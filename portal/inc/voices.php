<?php
/**
 * Tells the Listening player which question ids have an mp3 for each voice.
 * Reads the folders in portal/audio/ (us_woman, us_man, uk_woman, uk_man),
 * so new mp3 files show up automatically - no list to keep up to date.
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
	echo '<script>window.H212_VOICES = ' . wp_json_encode( array( 'v' => $latest, 'ids' => $ids ) ) . ';</script>' . "\n";
}
