<?php
/**
 * Phonics: reads the three content files in portal/phonics/ and hands the
 * Sound Board, the games and the worksheets one clean picture of them.
 *   phonics-sounds.csv   Mike's sounds in his teaching order
 *   phonics-lessons.csv  the lessons (sounds + Review / Bonus lessons)
 *   phonics-words.csv    every word and the lesson it belongs to
 * Voices: portal/audio/phonics/sounds/<sound_no>.m4a, portal/audio/phonics/words/<word>.m4a
 * No question ids are used here. The games build their questions from the word list.
 *
 * Rule: a word is never shown before the student has met every sound in it, so a
 * lesson only ever uses its own words and the sounds up to that lesson.
 */

/** The 9 Steps: first and last lesson of each. */
function h212_phonics_step_ranges() {
	return array(
		1 => array( 1, 10 ),
		2 => array( 11, 17 ),
		3 => array( 18, 24 ),
		4 => array( 25, 34 ),
		5 => array( 35, 40 ),
		6 => array( 41, 54 ),
		7 => array( 55, 60 ),
		8 => array( 61, 69 ),
		9 => array( 70, 77 ),
	);
}

/** Reads one phonics CSV into a list of rows keyed by column name. */
function h212_phonics_read_csv( $file ) {
	$path = dirname( __DIR__ ) . '/phonics/' . $file;
	$rows = array();
	if ( ! is_readable( $path ) ) {
		return $rows;
	}
	$h = fopen( $path, 'r' );
	if ( ! $h ) {
		return $rows;
	}
	$head = fgetcsv( $h );
	if ( ! $head ) {
		fclose( $h );
		return $rows;
	}
	$head[0] = preg_replace( '/^\xEF\xBB\xBF/', '', (string) $head[0] );
	$head    = array_map( 'trim', $head );
	while ( ( $r = fgetcsv( $h ) ) !== false ) {
		if ( count( $r ) < count( $head ) ) {
			if ( 1 === count( $r ) && ( null === $r[0] || '' === trim( (string) $r[0] ) ) ) {
				continue;
			}
			$r = array_pad( $r, count( $head ), '' );
		}
		$rows[] = array_combine( $head, array_slice( $r, 0, count( $head ) ) );
	}
	fclose( $h );
	return $rows;
}

/** Sounds in Mike's order, keyed by sound_no. Two-sound lessons (th, ew…) get a `parts` list. */
function h212_phonics_sounds() {
	static $sounds = null;
	if ( null !== $sounds ) {
		return $sounds;
	}
	$sounds = array();
	foreach ( h212_phonics_read_csv( 'phonics-sounds.csv' ) as $r ) {
		$n = (int) $r['sound_no'];
		if ( $n < 1 ) {
			continue;
		}
		$keys = array_map( 'trim', explode( ' / ', $r['key_word'] ) );
		$ipas = array_map( 'trim', explode( ' / ', $r['ipa'] ) );
		$parts = array();
		foreach ( $keys as $i => $k ) {
			$parts[] = array( 'key_word' => $k, 'ipa' => isset( $ipas[ $i ] ) ? $ipas[ $i ] : $ipas[0] );
		}
		$sounds[ $n ] = array(
			'sound_no' => $n,
			'sound'    => trim( $r['sound'] ),
			'key_word' => trim( $r['key_word'] ),
			'ipa'      => trim( $r['ipa'] ),
			'tip_ja'   => trim( $r['tip_ja'] ),
			'parts'    => $parts,
		);
	}
	ksort( $sounds );
	return $sounds;
}

/** Which Step a lesson number belongs to (0 if none). */
function h212_phonics_step_of( $lesson ) {
	foreach ( h212_phonics_step_ranges() as $step => $range ) {
		if ( $lesson >= $range[0] && $lesson <= $range[1] ) {
			return $step;
		}
	}
	return 0;
}

/**
 * A word is safe for the listening games and the mic check only when its note is
 * empty or just records a harmless move/spelling fix. Magic e, soft c, silent letters,
 * two-sound words and sight words are kept out (they stay in Read aloud).
 */
function h212_phonics_note_is_clean( $note ) {
	$note = trim( (string) $note );
	return '' === $note
		|| 0 === strpos( $note, 'moved from' )
		|| 0 === strpos( $note, 'ok:' )
		|| ( 0 === strpos( $note, 'fixed spelling' ) && false === strpos( $note, ';' ) )
		|| 'ph = f' === $note;
}

/** All words, removed ones dropped, each flagged for what it may be used for. */
function h212_phonics_words() {
	static $words = null;
	if ( null !== $words ) {
		return $words;
	}
	$words = array();
	foreach ( h212_phonics_read_csv( 'phonics-words.csv' ) as $r ) {
		$status = trim( $r['status'] );
		$word   = trim( $r['word'] );
		if ( '' === $word || 'removed' === $status ) {
			continue;
		}
		$lesson = (int) $r['lesson'];
		$clean  = h212_phonics_note_is_clean( $r['note'] );
		$words[] = array(
			'lesson' => $lesson,
			'group'  => trim( $r['group'] ),
			'word'   => $word,
			'status' => $status,                                  // common | rare | name
			'note'   => trim( $r['note'] ),
			'game'   => ( 'common' === $status && $clean ),        // listening games
			'mic'    => ( 'common' === $status ),                  // mic check (Read aloud)
		);
	}
	return $words;
}

/** Words of one lesson, each word once, in Mike's order. $only = 'game' | 'mic' | '' (all shown words). */
function h212_phonics_lesson_words( $lesson, $only = '' ) {
	$out  = array();
	$seen = array();
	foreach ( h212_phonics_words() as $w ) {
		if ( $w['lesson'] !== (int) $lesson || isset( $seen[ $w['word'] ] ) ) {
			continue;
		}
		if ( '' !== $only && empty( $w[ $only ] ) ) {
			continue;
		}
		$seen[ $w['word'] ] = true;
		$out[]              = $w;
	}
	return $out;
}

/** Lessons keyed by lesson number, with their Step and word counts. */
function h212_phonics_lessons() {
	static $lessons = null;
	if ( null !== $lessons ) {
		return $lessons;
	}
	$count = array();
	foreach ( h212_phonics_words() as $w ) {
		$count[ $w['lesson'] ][ $w['word'] ] = $w;
	}
	$lessons = array();
	foreach ( h212_phonics_read_csv( 'phonics-lessons.csv' ) as $r ) {
		$n = (int) $r['lesson'];
		if ( $n < 1 ) {
			continue;
		}
		$own   = isset( $count[ $n ] ) ? $count[ $n ] : array();
		$games = 0;
		foreach ( $own as $w ) {
			$games += $w['game'] ? 1 : 0;
		}
		$lessons[ $n ] = array(
			'lesson'   => $n,
			'sound_no' => (int) $r['sound_no'],
			'group'    => trim( $r['group'] ),
			'title'    => trim( $r['title'] ),
			'step'     => h212_phonics_step_of( $n ),
			'words'    => count( $own ),
			'game'     => $games,
			'kind'     => 0 === stripos( trim( $r['title'] ), 'Review' ) ? 'review' : ( 0 === stripos( trim( $r['title'] ), 'Bonus' ) ? 'bonus' : 'sound' ),
		);
	}
	ksort( $lessons );
	return $lessons;
}

/** The sounds a student has met by the end of a lesson (so the Sound Board never shows a later sound). */
function h212_phonics_known_sounds( $lesson ) {
	$lessons = h212_phonics_lessons();
	if ( ! isset( $lessons[ (int) $lesson ] ) ) {
		return array();
	}
	$upto = $lessons[ (int) $lesson ]['sound_no'];
	return array_filter(
		h212_phonics_sounds(),
		function ( $s ) use ( $upto ) {
			return $s['sound_no'] <= $upto;
		}
	);
}

/** The 9 Steps with their lessons: the shape the Steps and Lessons screens need. */
function h212_phonics_steps() {
	$steps = array();
	foreach ( h212_phonics_step_ranges() as $step => $range ) {
		$steps[ $step ] = array( 'step' => $step, 'first' => $range[0], 'last' => $range[1], 'lessons' => array() );
	}
	foreach ( h212_phonics_lessons() as $n => $l ) {
		if ( $l['step'] ) {
			$steps[ $l['step'] ]['lessons'][] = $l['lesson'];
		}
	}
	return $steps;
}

/** Which recorded voices exist (portal/audio/phonics/...). The page uses the robot voice for anything missing. */
function h212_phonics_audio() {
	$base = dirname( __DIR__ ) . '/audio/phonics/';
	$out  = array( 'v' => 0, 'sounds' => array(), 'words' => array() );
	foreach ( (array) glob( $base . 'sounds/*.m4a' ) as $f ) {
		$out['sounds'][] = (int) basename( $f, '.m4a' );
		$out['v']        = max( $out['v'], (int) filemtime( $f ) );
	}
	foreach ( (array) glob( $base . 'words/*.m4a' ) as $f ) {
		$out['words'][] = basename( $f, '.m4a' );
		$out['v']       = max( $out['v'], (int) filemtime( $f ) );
	}
	sort( $out['sounds'] );
	sort( $out['words'] );
	return $out;
}

/** Prints window.H212_PHONICS_AUDIO for the phonics pages (like voices.php does for the other sections). */
function h212_phonics_audio_script() {
	echo '<script>window.H212_PHONICS_AUDIO = ' . wp_json_encode( h212_phonics_audio() ) . ';</script>' . "\n";
}

/** The parts of a lesson that can be marked done (A Sound Board, B Blend, C Listen & pick, D Read aloud, E Sentences). */
function h212_phonics_parts() {
	return array( 'board', 'blend', 'listen', 'read', 'sentences' );
}

/** This student's Phonics progress: { lessons: { "4": { board: 1, ... } }, last: "time" }. Practice only: it never counts for unlocks or Grades. */
function h212_phonics_state( $user_id ) {
	$raw     = get_user_meta( $user_id, 'h212_phonics', true );
	$raw     = is_array( $raw ) ? $raw : array();
	$lessons = array();
	foreach ( (array) ( isset( $raw['lessons'] ) ? $raw['lessons'] : array() ) as $n => $parts ) {
		if ( ! is_array( $parts ) || ! isset( h212_phonics_lessons()[ (int) $n ] ) ) {
			continue;
		}
		foreach ( h212_phonics_parts() as $p ) {
			if ( ! empty( $parts[ $p ] ) ) {
				$lessons[ (int) $n ][ $p ] = (int) $parts[ $p ];
			}
		}
	}
	return array( 'lessons' => $lessons, 'last' => isset( $raw['last'] ) ? (string) $raw['last'] : '' );
}

/** Marks one part of one lesson done (or raises its best score). Returns the new state, or false for an unknown lesson/part. */
function h212_phonics_mark( $user_id, $lesson, $part, $score = 1 ) {
	$lesson = (int) $lesson;
	if ( ! isset( h212_phonics_lessons()[ $lesson ] ) || ! in_array( $part, h212_phonics_parts(), true ) ) {
		return false;
	}
	$state = h212_phonics_state( $user_id );
	$old   = isset( $state['lessons'][ $lesson ][ $part ] ) ? $state['lessons'][ $lesson ][ $part ] : 0;
	$state['lessons'][ $lesson ][ $part ] = max( $old, max( 1, min( 100, (int) $score ) ) );
	$state['last'] = current_time( 'mysql' );
	update_user_meta( $user_id, 'h212_phonics', $state );
	return $state;
}

/** Everything the page's JavaScript needs for the Steps, Lessons and Sound Board screens. */
function h212_phonics_for_js( $user_id ) {
	$lessons = array();
	foreach ( h212_phonics_lessons() as $n => $l ) {
		$lessons[ $n ] = array( 'n' => $n, 'sound_no' => $l['sound_no'], 'title' => $l['title'], 'step' => $l['step'], 'kind' => $l['kind'], 'words' => $l['words'] );
	}
	$state = h212_phonics_state( $user_id );
	return array(
		'steps'    => array_values( h212_phonics_steps() ),
		'lessons'  => $lessons,
		'sounds'   => h212_phonics_sounds(),
		'progress' => (object) $state['lessons'],
		'audio'    => h212_phonics_audio(),
	);
}
