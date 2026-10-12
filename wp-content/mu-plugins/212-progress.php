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
 *  - The first chapter of the next level opens after chapter 17 of the level
 *    before it is at 70% (same idea).
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

if ( ! defined( 'H212_LEVELS' ) ) {
	define( 'H212_LEVELS', 5 );
}
if ( ! defined( 'H212_CHAPTERS' ) ) {
	define( 'H212_CHAPTERS', 17 );
}
if ( ! defined( 'H212_UNLOCK_PERCENT' ) ) {
	define( 'H212_UNLOCK_PERCENT', 70 );
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
		$bank[]          = $item;
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
	for ( $l = 1; $l <= H212_LEVELS; $l++ ) {
		for ( $c = 1; $c <= H212_CHAPTERS; $c++ ) {
			$ok = true;
			foreach ( $old_types as $types ) {
				$qs = array_filter( $bank, function ( $q ) use ( $l, $c, $types ) {
					return (int) $q['level'] === $l && (int) $q['chapter'] === $c
						&& 'homework' === $q['mode'] && in_array( $q['type'], $types, true );
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
	}
	$keys        = array();
	$level_open  = true;
	for ( $l = 1; $l <= H212_LEVELS; $l++ ) {
		if ( $l > 1 ) {
			$level_open = $level_open && ! in_array( false, array_map( function ( $c ) use ( $finished, $l ) {
				return $finished[ ( $l - 1 ) . '-' . $c ];
			}, range( 1, H212_CHAPTERS ) ), true );
		}
		if ( ! $level_open ) {
			break;
		}
		for ( $c = 1; $c <= H212_CHAPTERS; $c++ ) {
			if ( $c > 1 && ! $finished[ $l . '-' . ( $c - 1 ) ] ) {
				break;
			}
			$keys[] = $l . '-' . $c;
		}
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
	for ( $l = 1; $l <= H212_LEVELS; $l++ ) {
		for ( $c = 1; $c <= H212_CHAPTERS; $c++ ) {
			$key   = $l . '-' . $c;
			$stats = h212_chapter_stats( $bank, $l, $c, $seen, $wrong );
			if ( 1 === $l && 1 === $c ) {
				$open = true;
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
	}

	if ( $persist ) {
		$new_list = array_keys( $unlocked );
		if ( $first_run || count( $new_list ) !== count( (array) $stored ) ) {
			update_user_meta( $user_id, 'h212_unlocked', $new_list );
		}
	}

	return array( 'chapters' => $chapters, 'first_run' => $first_run );
}
