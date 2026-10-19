<?php
/**
 * Tells the Listening player which question ids have an mp3 for each voice.
 * Reads the folders in portal/audio/ (us_woman, us_man, uk_woman, uk_man for
 * Listening, conversation for Conversation), so new audio files show up
 * automatically - no list to keep up to date.
 * Prints window.H212_VOICES for components/listen.js.
 */
function h212_voice_script() {
	$base   = dirname( __DIR__ ) . '/audio/';
	$ids    = array();
	$latest = 0;
	foreach ( array( 'us_woman', 'us_man', 'uk_woman', 'uk_man' ) as $voice ) {
		$ids[ $voice ] = array();
		foreach ( (array) glob( $base . $voice . '/*.mp3' ) as $file ) {
			$ids[ $voice ][] = basename( $file, '.mp3' );
			$latest = max( $latest, (int) filemtime( $file ) );
		}
	}
	// Conversation questions: one recorded file per question id (audio/conversation/<id>.m4a).
	// value = file time, used as a version number on the link.
	$conv = array();
	foreach ( (array) glob( $base . 'conversation/*.m4a' ) as $file ) {
		$conv[ basename( $file, '.m4a' ) ] = max( 1, (int) filemtime( $file ) );
	}
	// Speaking practice: audio/speaking/<id>_q.m4a (the question) and <id>_a.m4a (the good answer).
	$speak = array();
	foreach ( (array) glob( $base . 'speaking/*.m4a' ) as $file ) {
		$speak[ basename( $file, '.m4a' ) ] = max( 1, (int) filemtime( $file ) );
	}
	echo '<script>window.H212_VOICES = ' . wp_json_encode( array( 'v' => $latest, 'ids' => $ids, 'conv' => (object) $conv, 'speak' => (object) $speak ) ) . ';</script>' . "\n";
}
