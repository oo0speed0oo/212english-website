<?php
/**
 * Spelling ✏️ スペル: reads the word list in portal/spelling/ and hands the word games
 * (Missing Letters, Word Search, Crossword, Print) one clean picture of it.
 *   spelling-words.csv  set, level, chapter, word, word_ja, image, set_title
 * Voices: portal/audio/spelling/<word>.m4a (the robot voice reads the word if a file is missing).
 * Pictures: portal/images/vocab/<image>. A picture that is not on the site yet is simply left out
 * (the game then shows the sound and the Japanese), so a broken picture is never shown.
 *
 * Sets: L1-01..L1-17 (Level 1 chapters), L2-01..L2-09 (Level 2 chapters), OPP-01..OPP-20 (Opposites sets).
 * No question ids are used. Practice only: it never changes unlocks or Grades.
 */

/** The three groups on the set picker, in order. */
function h212_spelling_groups() {
	return array(
		'L1'  => array( 'key' => 'L1', 'name' => 'Level 1', 'name_ja' => 'レベル1' ),
		'L2'  => array( 'key' => 'L2', 'name' => 'Level 2', 'name_ja' => 'レベル2' ),
		'OPP' => array( 'key' => 'OPP', 'name' => 'Opposites', 'name_ja' => '反対語' ),
	);
}

/** Reads one spelling CSV into a list of rows keyed by column name. */
function h212_spelling_read_csv( $file ) {
	$path = dirname( __DIR__ ) . '/spelling/' . $file;
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

/** Picture files on the site (name => file time, used as a version number on the link). */
function h212_spelling_images() {
	static $names = null;
	if ( null === $names ) {
		$names = array();
		$dir   = dirname( __DIR__ ) . '/images/vocab';
		if ( is_dir( $dir ) ) {
			foreach ( (array) scandir( $dir ) as $f ) {
				if ( '' !== $f && '.' !== $f[0] ) {
					$names[ $f ] = max( 1, (int) @filemtime( $dir . '/' . $f ) );
				}
			}
		}
	}
	return $names;
}

/**
 * Every row of the word list: set, level, chapter, word, ja, set title, and the picture file
 * (empty when the row has no picture OR the file is not on the site). A bad row is skipped.
 */
function h212_spelling_words() {
	static $words = null;
	if ( null !== $words ) {
		return $words;
	}
	$words  = array();
	$images = h212_spelling_images();
	foreach ( h212_spelling_read_csv( 'spelling-words.csv' ) as $r ) {
		$set  = trim( $r['set'] );
		$word = strtolower( trim( $r['word'] ) );
		if ( ! preg_match( '/^(L1|L2|OPP)-\d+$/', $set ) || ! preg_match( '/^[a-z]{3,}$/', $word ) ) {
			continue;
		}
		$img     = trim( $r['image'] );
		$words[] = array(
			'set'     => $set,
			'level'   => (int) $r['level'],
			'chapter' => (int) $r['chapter'],
			'word'    => $word,
			'ja'      => trim( $r['word_ja'] ),
			'image'   => ( '' !== $img && isset( $images[ $img ] ) ) ? $img : '',
			'title'   => trim( $r['set_title'] ),
		);
	}
	return $words;
}

/** The word sets keyed by set id, in file order: group, number, title, how many words, how many have a picture. */
function h212_spelling_sets() {
	static $sets = null;
	if ( null !== $sets ) {
		return $sets;
	}
	$sets = array();
	foreach ( h212_spelling_words() as $w ) {
		$id = $w['set'];
		if ( ! isset( $sets[ $id ] ) ) {
			list( $group, $num ) = explode( '-', $id );
			$sets[ $id ] = array(
				'id'      => $id,
				'group'   => $group,
				'num'     => (int) $num,
				'level'   => $w['level'],
				'chapter' => $w['chapter'],
				'title'   => $w['title'],
				'words'   => 0,
				'images'  => 0,
			);
		}
		$sets[ $id ]['words']++;
		$sets[ $id ]['images'] += '' !== $w['image'] ? 1 : 0;
	}
	return $sets;
}

/** Words of one set, in file order. */
function h212_spelling_set_words( $set ) {
	$out = array();
	foreach ( h212_spelling_words() as $w ) {
		if ( $w['set'] === $set ) {
			$out[] = $w;
		}
	}
	return $out;
}

/** Which word voices exist (portal/audio/spelling/<word>.m4a). The page uses the robot voice for anything missing. */
function h212_spelling_audio() {
	$base = dirname( __DIR__ ) . '/audio/spelling/';
	$out  = array( 'v' => 0, 'words' => array() );
	foreach ( (array) glob( $base . '*.m4a' ) as $f ) {
		$out['words'][] = basename( $f, '.m4a' );
		$out['v']       = max( $out['v'], (int) filemtime( $f ) );
	}
	sort( $out['words'] );
	return $out;
}

/** The games a set can be practised with (the progress keys). */
function h212_spelling_parts() {
	return array( 'missing', 'search', 'cross' );
}

/** The two levels of difficulty. */
function h212_spelling_modes() {
	return array( 'easy', 'normal' );
}

/**
 * This student's Spelling record: { sets: { "L1-03": { missing: 80, ... } }, mode: "easy"|"normal", last: "time" }.
 * Saved in user meta h212_spelling. Practice only: it never counts for unlocks or Grades.
 */
function h212_spelling_state( $user_id ) {
	$raw  = get_user_meta( $user_id, 'h212_spelling', true );
	$raw  = is_array( $raw ) ? $raw : array();
	$sets = array();
	$all  = h212_spelling_sets();
	foreach ( (array) ( isset( $raw['sets'] ) ? $raw['sets'] : array() ) as $id => $parts ) {
		if ( ! is_array( $parts ) || ! isset( $all[ $id ] ) ) {
			continue;
		}
		foreach ( h212_spelling_parts() as $p ) {
			if ( ! empty( $parts[ $p ] ) && (int) $parts[ $p ] > 0 ) {
				$sets[ $id ][ $p ] = min( 100, (int) $parts[ $p ] );
			}
		}
	}
	$mode = isset( $raw['mode'] ) && in_array( $raw['mode'], h212_spelling_modes(), true ) ? $raw['mode'] : '';
	return array( 'sets' => $sets, 'mode' => $mode, 'last' => isset( $raw['last'] ) ? (string) $raw['last'] : '' );
}

/** Saves one record to user meta h212_spelling and returns the new state. */
function h212_spelling_save_state( $user_id, $state ) {
	update_user_meta( $user_id, 'h212_spelling', array( 'sets' => $state['sets'], 'mode' => $state['mode'], 'last' => $state['last'] ) );
	return $state;
}

/** Marks one game of one set done (or raises its best score, 1 to 100). Returns the new state, or false for an unknown set/game. */
function h212_spelling_mark( $user_id, $set, $part, $score = 1 ) {
	if ( ! isset( h212_spelling_sets()[ $set ] ) || ! in_array( $part, h212_spelling_parts(), true ) ) {
		return false;
	}
	$state = h212_spelling_state( $user_id );
	$old   = isset( $state['sets'][ $set ][ $part ] ) ? $state['sets'][ $set ][ $part ] : 0;
	$state['sets'][ $set ][ $part ] = max( $old, max( 1, min( 100, (int) $score ) ) );
	$state['last'] = current_time( 'mysql' );
	return h212_spelling_save_state( $user_id, $state );
}

/** Remembers the student's Easy / Normal choice. Returns the new state, or false for anything else. */
function h212_spelling_set_mode( $user_id, $mode ) {
	if ( ! in_array( $mode, h212_spelling_modes(), true ) ) {
		return false;
	}
	$state         = h212_spelling_state( $user_id );
	$state['mode'] = $mode;
	return h212_spelling_save_state( $user_id, $state );
}

/** Everything the Spelling page's JavaScript needs. */
function h212_spelling_for_js( $user_id ) {
	$state = h212_spelling_state( $user_id );
	$sets  = array();
	$words = array();
	foreach ( h212_spelling_sets() as $id => $s ) {
		$sets[] = $s;
	}
	foreach ( h212_spelling_words() as $w ) {
		$words[] = array( $w['set'], $w['word'], $w['ja'], $w['image'] );
	}
	$images = h212_spelling_images();
	$ver    = array();
	foreach ( $words as $w ) {
		if ( '' !== $w[3] ) {
			$ver[ $w[3] ] = $images[ $w[3] ];
		}
	}
	return array(
		'groups'   => array_values( h212_spelling_groups() ),
		'sets'     => $sets,
		'words'    => $words,                    // [ set, word, japanese, picture file or "" ]
		'imgv'     => (object) $ver,             // picture file => version number for the link
		'audio'    => h212_spelling_audio(),
		'progress' => (object) $state['sets'],
		'mode'     => $state['mode'],
	);
}
