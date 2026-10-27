<?php
/**
 * 212 English School - shared progress and unlock rules.
 *
 * ONE place that knows:
 *  - how a chapter's Homework is split into 6 practice parts
 *  - which questions exist (portal/homework-content.csv + portal/build-content.csv)
 *  - how far a student is through a chapter
 *  - which chapters/levels a student has unlocked
 *
 * Used by portal/inc/progress.php (Homework + Tests pages), portal/grades.php
 * and the wp-admin Student Results page (212-teacher-results.php).
 *
 * UNLOCK RULE
 *  - Chapter N+1 opens when the student has finished 70% of chapter N's
 *    homework questions (all parts together). "Finished" = answered at least
 *    once and not currently wrong.
 *  - The first chapter of the next level opens after the LAST chapter of the
 *    level before it is at 70% (same idea).
 *  - Once a chapter is unlocked it stays unlocked (user meta h212_unlocked),
 *    even if new questions are added later.
 *  - The first time a student's state is computed, every chapter they could
 *    open under the OLD rule (every quiz finished) is marked unlocked, so no
 *    one loses access when the rule changes.
 *  - "Mastered" (Grades page) is still 100%.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// H212_LEVELS / H212_CHAPTERS are NOT used by any current file any more - the course
// map below reads the real levels and chapters from the content files. They only
// stay defined so an older copy of a portal page that is still on the server
// during an upload does not crash. Do not use them in new code.
if ( ! defined( 'H212_LEVELS' ) ) {
	define( 'H212_LEVELS', 5 );
}
if ( ! defined( 'H212_CHAPTERS' ) ) {
	define( 'H212_CHAPTERS', 17 );
}
if ( ! defined( 'H212_UNLOCK_PERCENT' ) ) {
	define( 'H212_UNLOCK_PERCENT', 70 );
}
// The old (pre-70%) unlock rule only ever saw the original Homework questions,
// ids 1-1409. Questions added after that never count against a student's
// existing access (see h212_legacy_unlocked_keys()).
// Question ids up to this number are used OR were skipped on purpose. Never hand
// them out again (the Homework Questions screen starts new ids above this).
if ( ! defined( 'H212_RESERVED_MAX_ID' ) ) {
	define( 'H212_RESERVED_MAX_ID', 4536 );
}
if ( ! defined( 'H212_LEGACY_MAX_ID' ) ) {
	define( 'H212_LEGACY_MAX_ID', 1409 );
}

/**
 * The 6 practice parts of a chapter, in 3 groups. Each part is a question
 * "type" in the data: photo / vocabulary / grammar / builder / listening /
 * conversation. (builder rows come from build-content.csv.)
 */
function h212_part_groups() {
	return array(
		'vocabulary' => array( 'photo', 'vocabulary' ),
		'grammar'    => array( 'grammar', 'builder' ),
		'listening'  => array( 'listening', 'conversation' ),
	);
}

function h212_all_parts() {
	$out = array();
	foreach ( h212_part_groups() as $parts ) {
		$out = array_merge( $out, $parts );
	}
	return $out;
}

function h212_read_csv_rows( $path ) {
	if ( ! file_exists( $path ) ) {
		return array();
	}
	$fh = fopen( $path, 'r' );
	if ( ! $fh ) {
		return array();
	}
	$header = fgetcsv( $fh );
	if ( ! $header ) {
		fclose( $fh );
		return array();
	}
	$header = array_map( function ( $h ) { return strtolower( trim( (string) $h ) ); }, $header );
	$header[0] = ltrim( $header[0], "\xEF\xBB\xBF" ); // BOM, if a spreadsheet added one
	$out = array();
	while ( ( $row = fgetcsv( $fh ) ) !== false ) {
		if ( count( $row ) < count( $header ) ) {
			continue;
		}
		$out[] = array_combine( $header, array_slice( $row, 0, count( $header ) ) );
	}
	fclose( $fh );
	return $out;
}

/**
 * File names in portal/images/vocab/ (question photos). Read from the folder
 * with exact spelling, so it behaves the same on Mac and on the server (which
 * cares about capital letters).
 */
function h212_vocab_images() {
	static $names = null;
	if ( null === $names ) {
		$names = array();
		$dir   = ABSPATH . 'portal/images/vocab';
		if ( is_dir( $dir ) ) {
			foreach ( (array) scandir( $dir ) as $f ) {
				if ( '.' !== $f[0] ) {
					// value = file time, used as a version number on the picture link
					$names[ $f ] = max( 1, (int) @filemtime( $dir . '/' . $f ) );
				}
			}
		}
	}
	return $names;
}

/** The picture file a photo question uses (its image column, or a guess from the answer word). */
function h212_photo_file( $item ) {
	$img = isset( $item['image'] ) ? trim( $item['image'] ) : '';
	if ( '' === $img ) {
		$img = strtolower( preg_replace( '/\s+/', '-', trim( isset( $item['answer'] ) ? $item['answer'] : '' ) ) ) . '.png';
	}
	return $img;
}

/**
 * Every question the portal knows about, as plain rows:
 * id, level, chapter, type, mode ('homework'|'test'), question, answer ...
 * Sentence Builder rows (build-content.csv) come in with type 'builder'.
 * The list is cached for the rest of the request.
 */
function h212_progress_bank() {
	static $bank = null;
	if ( null !== $bank ) {
		return $bank;
	}
	$bank = array();
	foreach ( h212_read_csv_rows( ABSPATH . 'portal/homework-content.csv' ) as $item ) {
		if ( empty( $item['level'] ) || empty( $item['type'] ) ) {
			continue;
		}
		$item['level']   = (int) $item['level'];
		$item['chapter'] = (int) $item['chapter'];
		$item['type']    = strtolower( trim( $item['type'] ) );
		$item['mode']    = ( isset( $item['mode'] ) && 'test' === strtolower( trim( $item['mode'] ) ) ) ? 'test' : 'homework';
		// A photo question whose picture is not on the server yet is hidden
		// completely: it is not shown and not counted for finishing or the
		// 70% rule. It appears by itself when the picture is uploaded.
		if ( 'photo' === $item['type'] ) {
			$images = h212_vocab_images();
			if ( ! isset( $images[ h212_photo_file( $item ) ] ) ) {
				continue;
			}
		}
		$bank[] = $item;
	}
	foreach ( h212_read_csv_rows( ABSPATH . 'portal/build-content.csv' ) as $item ) {
		if ( empty( $item['id'] ) || empty( $item['level'] ) ) {
			continue;
		}
		$bank[] = array(
			'id'       => $item['id'],
			'level'    => (int) $item['level'],
			'chapter'  => (int) $item['chapter'],
			'type'     => 'builder',
			'mode'     => ( isset( $item['mode'] ) && 'test' === strtolower( trim( $item['mode'] ) ) ) ? 'test' : 'homework',
			'question' => isset( $item['prompt_ja'] ) ? $item['prompt_ja'] : '',
			'answer'   => isset( $item['tiles'] ) ? implode( ' ', explode( '|', $item['tiles'] ) ) : '',
		);
	}
	return $bank;
}

/** Homework questions of one part in one chapter (use $mode = 'test' for test rows). */
function h212_questions_for_part( $bank, $level, $chapter, $part, $mode = 'homework' ) {
	return array_values( array_filter( $bank, function ( $q ) use ( $level, $chapter, $part, $mode ) {
		return (int) $q['level'] === (int) $level && (int) $q['chapter'] === (int) $chapter
			&& $q['type'] === $part && $q['mode'] === $mode;
	} ) );
}

/* ============================================================
 * THE COURSE MAP
 *
 * The ONE place that knows which levels, chapters and parts exist. It is read
 * from the content files (homework-content.csv + build-content.csv), so adding a
 * new level or chapter to those files is all it takes: the student pages, Grades,
 * the unlock rules, score saving and the teacher screens all follow it. Nothing
 * else in the portal may hardcode a number of levels, chapters or a list of
 * question types.
 *
 * Returns array( 'levels' => array( LEVEL => array( CHAPTER => array(
 *     'parts' => array( part => number of Homework questions ),
 *     'homework' => number of Homework questions, 'tests' => number of Test questions ) ) ) ),
 * levels and chapters in order. Cached for the rest of the request.
 * ============================================================ */
function h212_course_map() {
	static $map = null;
	if ( null !== $map ) {
		return $map;
	}
	$map   = array( 'levels' => array() );
	$known = h212_all_parts();
	foreach ( h212_progress_bank() as $q ) {
		$l = (int) $q['level'];
		$c = (int) $q['chapter'];
		if ( $l < 1 || $c < 1 || ! in_array( $q['type'], $known, true ) ) {
			continue;
		}
		if ( ! isset( $map['levels'][ $l ][ $c ] ) ) {
			$map['levels'][ $l ][ $c ] = array( 'parts' => array(), 'homework' => 0, 'tests' => 0 );
		}
		if ( 'test' === $q['mode'] ) {
			$map['levels'][ $l ][ $c ]['tests']++;
		} else {
			$map['levels'][ $l ][ $c ]['homework']++;
			$map['levels'][ $l ][ $c ]['parts'][ $q['type'] ] = ( $map['levels'][ $l ][ $c ]['parts'][ $q['type'] ] ?? 0 ) + 1;
		}
	}
	ksort( $map['levels'] );
	foreach ( $map['levels'] as $l => $chs ) {
		ksort( $map['levels'][ $l ] );
	}
	return $map;
}

/** Every level that has questions, in order: array( 1, 2, ... ) */
function h212_course_levels() {
	return array_keys( h212_course_map()['levels'] );
}

/** Every chapter of one level that has questions, in order: array( 1, 2, ... ) */
function h212_course_chapters( $level ) {
	$m = h212_course_map()['levels'];
	return isset( $m[ (int) $level ] ) ? array_keys( $m[ (int) $level ] ) : array();
}

/** Does this level + chapter have any questions? */
function h212_course_has( $level, $chapter ) {
	$m = h212_course_map()['levels'];
	return isset( $m[ (int) $level ][ (int) $chapter ] );
}

/** Every chapter in course order as array( array( level, chapter ), ... ) */
function h212_course_keys() {
	$out = array();
	foreach ( h212_course_map()['levels'] as $l => $chs ) {
		foreach ( array_keys( $chs ) as $c ) {
			$out[] = array( (int) $l, (int) $c );
		}
	}
	return $out;
}

/** The highest chapter number in any level (0 if there are none). */
function h212_course_max_chapter() {
	$max = 0;
	foreach ( h212_course_map()['levels'] as $chs ) {
		if ( $chs ) {
			$max = max( $max, max( array_keys( $chs ) ) );
		}
	}
	return $max;
}

/** What the browser pages need: which chapters each level has, and the part groups. */
function h212_course_for_js() {
	$levels = array();
	foreach ( h212_course_map()['levels'] as $l => $chs ) {
		$levels[ (string) $l ] = array_keys( $chs );
	}
	return array( 'levels' => (object) $levels, 'groups' => h212_part_groups() );
}

/** How far a student is through one chapter's Homework, part by part. */
function h212_chapter_stats( $bank, $level, $chapter, $seen_set, $wrong_set ) {
	$stats = array( 'parts' => array(), 'total' => 0, 'finished' => 0, 'seen' => 0 );
	foreach ( h212_all_parts() as $part ) {
		$p = array( 'total' => 0, 'finished' => 0, 'seen' => 0 );
		foreach ( h212_questions_for_part( $bank, $level, $chapter, $part ) as $q ) {
			$p['total']++;
			$was_seen = isset( $seen_set[ $q['id'] ] );
			if ( $was_seen ) {
				$p['seen']++;
				if ( ! isset( $wrong_set[ $q['id'] ] ) ) {
					$p['finished']++;
				}
			}
		}
		$stats['parts'][ $part ] = $p;
		$stats['total']         += $p['total'];
		$stats['finished']      += $p['finished'];
		$stats['seen']          += $p['seen'];
	}
	return $stats;
}

/** 70% of this chapter's homework finished? (A chapter with no questions never passes.) */
function h212_chapter_passed( $stats ) {
	return $stats['total'] > 0 && $stats['finished'] * 100 >= H212_UNLOCK_PERCENT * $stats['total'];
}

/** 100% finished - what "Mastered" means on the Grades page. */
function h212_chapter_mastered( $stats ) {
	return $stats['total'] > 0 && $stats['finished'] === $stats['total'];
}

function h212_student_lists( $user_id ) {
	$seen  = get_user_meta( $user_id, 'h212_seen_questions', true );
	$wrong = get_user_meta( $user_id, 'h212_current_wrong', true );
	return array(
		'seen'  => array_flip( array_map( 'strval', is_array( $seen ) ? $seen : array() ) ),
		'wrong' => array_flip( array_map( 'strval', is_array( $wrong ) ? $wrong : array() ) ),
	);
}

/**
 * The OLD rule, used once per student to keep everything they can open today
 * open: a chapter counts as finished when its vocabulary (photo + word),
 * grammar and listening quizzes are each completely done; the next chapter
 * needs that, and the next level needs every chapter of the level finished.
 */
function h212_legacy_unlocked_keys( $bank, $seen_set, $wrong_set ) {
	$old_types = array(
		'vocabulary' => array( 'vocabulary', 'photo' ),
		'grammar'    => array( 'grammar' ),
		'listening'  => array( 'listening' ),
	);
	$finished = array();
	foreach ( h212_course_keys() as $lc ) {
		list( $l, $c ) = $lc;
		$ok = true;
		foreach ( $old_types as $types ) {
			$qs = array_filter( $bank, function ( $q ) use ( $l, $c, $types ) {
				return (int) $q['level'] === $l && (int) $q['chapter'] === $c
					&& 'homework' === $q['mode'] && in_array( $q['type'], $types, true )
					&& (int) $q['id'] <= H212_LEGACY_MAX_ID;
			} );
			if ( ! $qs ) {
				$ok = false;
				break;
			}
			foreach ( $qs as $q ) {
				if ( ! isset( $seen_set[ $q['id'] ] ) || isset( $wrong_set[ $q['id'] ] ) ) {
					$ok = false;
					break 2;
				}
			}
		}
		$finished[ $l . '-' . $c ] = $ok;
	}
	$keys       = array();
	$level_open = true;
	$prev_level = null;
	foreach ( h212_course_levels() as $l ) {
		if ( null !== $prev_level ) {
			// the next level needs every chapter of the level before it finished
			foreach ( h212_course_chapters( $prev_level ) as $pc ) {
				if ( empty( $finished[ $prev_level . '-' . $pc ] ) ) {
					$level_open = false;
					break;
				}
			}
		}
		if ( ! $level_open ) {
			break;
		}
		$prev_c = null;
		foreach ( h212_course_chapters( $l ) as $c ) {
			if ( null !== $prev_c && empty( $finished[ $l . '-' . $prev_c ] ) ) {
				break;
			}
			$keys[] = $l . '-' . $c;
			$prev_c = $c;
		}
		$prev_level = $l;
	}
	return $keys;
}

/**
 * Everything the pages need to know about one student's progress.
 *
 * Returns array(
 *   'chapters' => array( 'L-C' => array( 'u' => unlocked?, 't' => total questions, 'f' => finished, 'parts' => ... ) ),
 *   'first_run' => true if this student's unlock list was just created,
 * )
 * With $persist = true, newly unlocked chapters are saved to the student's
 * account so they stay unlocked. The wp-admin report passes false (read only).
 */
function h212_progress_state( $user_id, $persist = true ) {
	$bank  = h212_progress_bank();
	$lists = h212_student_lists( $user_id );
	$seen  = $lists['seen'];
	$wrong = $lists['wrong'];

	$stored    = get_user_meta( $user_id, 'h212_unlocked', true );
	$first_run = ! is_array( $stored );
	$unlocked  = array();
	if ( ! $first_run ) {
		$unlocked = array_flip( array_map( 'strval', $stored ) );
	} else {
		foreach ( h212_legacy_unlocked_keys( $bank, $seen, $wrong ) as $k ) {
			$unlocked[ $k ] = true;
		}
	}

	$chapters    = array();
	$prev_open   = true;
	$prev_passed = true;
	$is_first    = true;
	foreach ( h212_course_keys() as $lc ) {
		list( $l, $c ) = $lc;
		$key   = $l . '-' . $c;
		$stats = h212_chapter_stats( $bank, $l, $c, $seen, $wrong );
		if ( $is_first ) {
			$open     = true;   // the very first chapter of the course is always open
			$is_first = false;
		} else {
			$open = isset( $unlocked[ $key ] ) || ( $prev_open && $prev_passed );
		}
		if ( $open ) {
			$unlocked[ $key ] = true;
		}
		$chapters[ $key ] = array(
			'u'     => $open,
			't'     => $stats['total'],
			'f'     => $stats['finished'],
			's'     => $stats['seen'],
			'parts' => $stats['parts'],
		);
		$prev_open   = $open;
		$prev_passed = h212_chapter_passed( $stats );
	}

	if ( $persist ) {
		$new_list = array_keys( $unlocked );
		if ( $first_run || count( $new_list ) !== count( (array) $stored ) ) {
			update_user_meta( $user_id, 'h212_unlocked', $new_list );
		}
	}

	return array( 'chapters' => $chapters, 'first_run' => $first_run );
}

/* ============================================================
 * ACTIVITY, CACHING AND THE TEACHER'S "LAST ACTIVE"
 * ============================================================ */

/**
 * Tell LiteSpeed Cache (and any other page cache) NOT to keep a copy of this page.
 * Student pages, the data they save, and the teacher screens are private and must
 * always be fresh. Safe to call more than once.
 */
function h212_no_cache() {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
	if ( ! defined( 'DONOTCACHEOBJECT' ) ) {
		define( 'DONOTCACHEOBJECT', true );
	}
	if ( ! headers_sent() ) {
		nocache_headers();
		header( 'X-LiteSpeed-Cache-Control: no-cache, no-store, private' );
	}
	do_action( 'litespeed_control_set_nocache', '212 English: private student/teacher page' );
}

/**
 * Remember that a student was just active (any portal page or save). Written at most
 * once every $min_seconds so a busy student does not cause a database write per click.
 */
function h212_touch_activity( $user_id, $min_seconds = 60 ) {
	$user_id = (int) $user_id;
	if ( $user_id < 1 ) {
		return;
	}
	$last = get_user_meta( $user_id, 'h212_last_active', true );
	if ( $last && ( current_time( 'timestamp' ) - strtotime( $last ) ) < $min_seconds ) {
		return;
	}
	update_user_meta( $user_id, 'h212_last_active', current_time( 'mysql' ) );
}

/**
 * The latest sign of life from a student, as "Y-m-d H:i:s" (or '' if none): the saved
 * "last active" stamp, and the newest date found in anything the portal records.
 */
function h212_last_activity( $user_id ) {
	$latest = (string) get_user_meta( $user_id, 'h212_last_active', true );
	foreach ( h212_practice_sections() as $def ) {
		$rec = get_user_meta( $user_id, $def['meta'], true );
		if ( is_array( $rec ) && ! empty( $rec['sentences'] ) && is_array( $rec['sentences'] ) ) {
			foreach ( $rec['sentences'] as $r ) {
				if ( is_array( $r ) && isset( $r['date'] ) && $r['date'] > $latest ) {
					$latest = $r['date'];
				}
			}
		}
	}
	foreach ( array( 'h212_quiz_scores', 'h212_test_scores', 'h212_mistake_log', 'h212_video_sentences' ) as $key ) {
		$rows = get_user_meta( $user_id, $key, true );
		if ( is_array( $rows ) ) {
			foreach ( $rows as $r ) {
				if ( is_array( $r ) && isset( $r['date'] ) && $r['date'] > $latest ) {
					$latest = $r['date'];
				}
			}
		}
	}
	return $latest;
}

/** The student's optional-practice numbers for the teacher: label => text (grows as sections are added). */
function h212_practice_summary( $user_id ) {
	$out    = array();
	$tries  = get_user_meta( $user_id, 'h212_speaking', true );
	$tries  = is_array( $tries ) ? $tries : array();
	$out['Speaking'] = $tries ? count( $tries ) . ' questions tried, ' . array_sum( array_map( 'intval', $tries ) ) . ' tries in total' : 'Nothing yet';
	foreach ( h212_practice_sections() as $key => $def ) {
		$st    = h212_practice_state( $user_id, $key );
		$total = count( h212_practice_sets( $key ) );
		$out[ $def['label'] ] = ( $st['seen'] || $st['sentences'] )
			? h212_practice_sets_done( $user_id, $key ) . ' of ' . $total . ' sets done, ' . count( $st['seen'] ) . ' questions answered, ' . count( $st['wrong'] ) . ' to review, ' . count( $st['sentences'] ) . ' sentences written'
			: 'Nothing yet';
	}
	return $out;
}

/* ============================================================
 * PRACTICE SECTIONS: OPPOSITES and IDIOMS (practice only)
 *
 * Both are built the same way: the content file is grouped into numbered SETS of
 * about ten items; each item has three questions (two multiple-choice, then one
 * "write your own sentence"). They never count for unlocks, Grades or the chapter
 * percentage: nothing here touches h212_progress_bank().
 *
 * Each section keeps its own record in its own user meta (so it can never affect
 * Homework): array( 'seen' => ids answered, 'wrong' => ids currently wrong,
 * 'sentences' => array( array( id, set, text, date ), ... ) ).
 * ============================================================ */

function h212_practice_sections() {
	return array(
		'opposites' => array(
			'file'      => 'opposites-content.csv',
			'meta'      => 'h212_opposites',
			'label'     => 'Opposites',
			'item'      => 'word',
			'item_ja'   => 'word_ja',
			'pair'      => 'opposite',
			'pair_ja'   => 'opposite_ja',
			'kinds'     => array( 'choice', 'blank', 'write' ),
			'min_words' => 4,
		),
		'idioms'    => array(
			'file'      => 'idioms-content.csv',
			'meta'      => 'h212_idioms',
			'label'     => 'Idioms',
			'item'      => 'idiom',
			'item_ja'   => 'idiom_ja',
			'pair'      => '',
			'pair_ja'   => '',
			'kinds'     => array( 'meaning', 'blank', 'write' ),
			'min_words' => 4,
		),
	);
}

/** One section's questions as plain rows (id, set, kind, item, item_ja, pair, pair_ja, question, choices, answer, required, example). */
function h212_practice_rows( $section ) {
	static $cache = array();
	$defs = h212_practice_sections();
	if ( ! isset( $defs[ $section ] ) ) {
		return array();
	}
	if ( isset( $cache[ $section ] ) ) {
		return $cache[ $section ];
	}
	$d    = $defs[ $section ];
	$rows = array();
	foreach ( h212_read_csv_rows( ABSPATH . 'portal/' . $d['file'] ) as $r ) {
		if ( empty( $r['id'] ) || empty( $r['kind'] ) ) {
			continue;
		}
		$required = array();
		foreach ( explode( '|', (string) ( $r['required_words'] ?? '' ) ) as $w ) {
			$w = trim( $w );
			if ( '' !== $w && '-' !== $w ) {
				$required[] = $w;
			}
		}
		$rows[] = array(
			'id'       => (string) $r['id'],
			'set'      => (int) ( $r['set'] ?? 0 ),
			'kind'     => strtolower( trim( $r['kind'] ) ),
			'item'     => $r[ $d['item'] ] ?? '',
			'item_ja'  => $r[ $d['item_ja'] ] ?? '',
			'pair'     => $d['pair'] ? ( $r[ $d['pair'] ] ?? '' ) : '',
			'pair_ja'  => $d['pair_ja'] ? ( $r[ $d['pair_ja'] ] ?? '' ) : '',
			'question' => $r['question'] ?? '',
			'choices'  => array( $r['choice_a'] ?? '', $r['choice_b'] ?? '', $r['choice_c'] ?? '' ),
			'answer'   => $r['answer'] ?? '',
			'required' => $required,
			'example'  => ( isset( $r['example'] ) && '-' !== trim( $r['example'] ) ) ? $r['example'] : '',
		);
	}
	$cache[ $section ] = $rows;
	return $rows;
}

function h212_practice_row( $section, $id ) {
	foreach ( h212_practice_rows( $section ) as $r ) {
		if ( (string) $id === $r['id'] ) {
			return $r;
		}
	}
	return null;
}

/** The sets in a section: array( set number => array of ids ), in order. */
function h212_practice_sets( $section ) {
	$sets = array();
	foreach ( h212_practice_rows( $section ) as $r ) {
		$sets[ $r['set'] ][] = $r['id'];
	}
	ksort( $sets );
	return $sets;
}

/** A student's record for one section (always the same shape, even if nothing is saved yet). */
function h212_practice_state( $user_id, $section ) {
	$defs = h212_practice_sections();
	$raw  = isset( $defs[ $section ] ) ? get_user_meta( $user_id, $defs[ $section ]['meta'], true ) : array();
	$raw  = is_array( $raw ) ? $raw : array();
	return array(
		'seen'      => array_values( array_unique( array_map( 'strval', (array) ( $raw['seen'] ?? array() ) ) ) ),
		'wrong'     => array_values( array_unique( array_map( 'strval', (array) ( $raw['wrong'] ?? array() ) ) ) ),
		'sentences' => is_array( $raw['sentences'] ?? null ) ? $raw['sentences'] : array(),
	);
}

function h212_practice_save_state( $user_id, $section, $state ) {
	$defs = h212_practice_sections();
	if ( ! isset( $defs[ $section ] ) ) {
		return;
	}
	if ( count( $state['sentences'] ) > 1000 ) {
		$state['sentences'] = array_slice( $state['sentences'], -1000 );
	}
	update_user_meta( $user_id, $defs[ $section ]['meta'], $state );
}

/** How many of a section's sets this student has completely finished (every question answered and not wrong). */
function h212_practice_sets_done( $user_id, $section ) {
	$state = h212_practice_state( $user_id, $section );
	$seen  = array_flip( $state['seen'] );
	$wrong = array_flip( $state['wrong'] );
	$done  = 0;
	foreach ( h212_practice_sets( $section ) as $ids ) {
		$ok = true;
		foreach ( $ids as $id ) {
			if ( ! isset( $seen[ $id ] ) || isset( $wrong[ $id ] ) ) {
				$ok = false;
				break;
			}
		}
		if ( $ok ) {
			$done++;
		}
	}
	return $done;
}

/* ============================================================
 * VIDEO LESSONS (portal/video-content.csv)
 *
 * 71 videos, each with 5 multiple-choice questions and 1 "Your turn"
 * writing task. Question ids share the main id sequence (1760-2185). Videos do
 * NOT count for chapter unlocks: nothing here touches h212_progress_bank().
 * ============================================================ */

/** Every video, in "order": video_id, title, questions[], write (required words, example, id). */
function h212_video_list() {
	static $videos = null;
	if ( null !== $videos ) {
		return $videos;
	}
	$by_id = array();
	foreach ( h212_read_csv_rows( ABSPATH . 'portal/video-content.csv' ) as $r ) {
		$vid = isset( $r['video_id'] ) ? trim( $r['video_id'] ) : '';
		if ( '' === $vid || ! preg_match( '/^[A-Za-z0-9_-]{6,20}$/', $vid ) ) {
			continue;
		}
		if ( ! isset( $by_id[ $vid ] ) ) {
			$by_id[ $vid ] = array(
				'video_id'  => $vid,
				'order'     => (int) ( $r['order'] ?? 0 ),
				'title'     => $r['title'] ?? '',
				'questions' => array(),
				'write'     => null,
			);
		}
		$type = strtolower( trim( $r['type'] ?? '' ) );
		if ( 'question' === $type ) {
			$by_id[ $vid ]['questions'][] = array(
				'id'       => $r['id'],
				'question' => $r['question'],
				'choices'  => array( $r['choice_a'], $r['choice_b'], $r['choice_c'] ),
				'answer'   => $r['answer'],
			);
		} elseif ( 'write' === $type ) {
			$req = array();
			foreach ( explode( '|', (string) ( $r['required_words'] ?? '' ) ) as $w ) {
				$w = trim( $w );
				if ( '' !== $w && '-' !== $w ) {
					$req[] = $w;
				}
			}
			$by_id[ $vid ]['write'] = array(
				'id'       => $r['id'],
				'required' => $req,
				'example'  => ( isset( $r['example'] ) && '-' !== trim( $r['example'] ) ) ? $r['example'] : '',
			);
		}
	}
	$videos = array_values( $by_id );
	usort( $videos, function ( $a, $b ) { return $a['order'] <=> $b['order']; } );
	return $videos;
}

function h212_video_get( $video_id ) {
	foreach ( h212_video_list() as $v ) {
		if ( $v['video_id'] === $video_id ) {
			return $v;
		}
	}
	return null;
}

/** video_id => title, for the teacher's report. */
function h212_video_titles() {
	$out = array();
	foreach ( h212_video_list() as $v ) {
		$out[ $v['video_id'] ] = $v['title'];
	}
	return $out;
}

/** Curly quotes (iPhones type them) become straight ones; lower case. */
function h212_video_normalize( $text ) {
	$text = str_replace( array( "\xE2\x80\x99", "\xE2\x80\x98", "\xCA\xBC" ), "'", (string) $text );
	$text = str_replace( array( "\xE2\x80\x9C", "\xE2\x80\x9D" ), '"', $text );
	return function_exists( 'mb_strtolower' ) ? mb_strtolower( $text, 'UTF-8' ) : strtolower( $text );
}

/**
 * Checks a student's sentence for one video.
 *  - at least $min_words words (5 for videos; the Opposites and Idioms sections use 4)
 *  - every required word/phrase is used (case-insensitive; a word also matches
 *    when it starts a longer word, so "pamper" matches "pampered"; words of
 *    1-2 letters must match exactly so "to" does not match "today")
 * Returns array( 'ok' => bool, 'short' => bool, 'missing' => array of required items not used ).
 */
function h212_video_check_sentence( $text, $required, $min_words = 5 ) {
	$norm  = h212_video_normalize( $text );
	$words = preg_split( '/[^a-z0-9\']+/u', $norm, -1, PREG_SPLIT_NO_EMPTY );
	$short = count( $words ) < (int) $min_words;

	$missing = array();
	foreach ( (array) $required as $item ) {
		$parts = preg_split( '/\s+/', trim( h212_video_normalize( $item ) ), -1, PREG_SPLIT_NO_EMPTY );
		if ( ! $parts ) {
			continue;
		}
		$pieces = array();
		foreach ( $parts as $p ) {
			$q        = preg_quote( $p, '/' );
			$pieces[] = ( strlen( $p ) >= 3 ) ? $q . "[a-z0-9']*" : $q . "(?![a-z0-9'])";
		}
		$re = "/(?<![a-z0-9'])" . implode( '[^a-z0-9\']+', $pieces ) . '/u';
		if ( ! preg_match( $re, $norm ) ) {
			$missing[] = $item;
		}
	}
	return array( 'ok' => ! $short && ! $missing, 'short' => $short, 'missing' => $missing );
}

function h212_video_sentences( $user_id ) {
	$list = get_user_meta( $user_id, 'h212_video_sentences', true );
	return is_array( $list ) ? $list : array();
}

/** For the Videos list: per video, how many questions are finished and whether a sentence was sent. */
function h212_video_progress( $user_id ) {
	$lists = h212_student_lists( $user_id );
	$sent  = array();
	foreach ( h212_video_sentences( $user_id ) as $s ) {
		$sent[ $s['video_id'] ] = true;
	}
	$out = array();
	foreach ( h212_video_list() as $v ) {
		$done = 0;
		foreach ( $v['questions'] as $q ) {
			if ( isset( $lists['seen'][ $q['id'] ] ) && ! isset( $lists['wrong'][ $q['id'] ] ) ) {
				$done++;
			}
		}
		$total = count( $v['questions'] );
		$out[ $v['video_id'] ] = array(
			'done'     => $done,
			'total'    => $total,
			'sentence' => ! empty( $sent[ $v['video_id'] ] ),
			'finished' => $total > 0 && $done === $total && ! empty( $sent[ $v['video_id'] ] ),
		);
	}
	return $out;
}
