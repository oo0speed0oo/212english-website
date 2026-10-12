<?php
/**
 * Returns where the logged-in student stands: which chapters are unlocked
 * and how much of each chapter's Homework is finished.
 * All the rules live in wp-content/mu-plugins/212-progress.php - the
 * Homework and Tests pages just read this.
 *
 * GET -> { chapters: { "1-1": { u: true, t: 58, f: 40, s: 45, parts: {...} }, ... } }
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );
header( 'Cache-Control: no-store' );

if ( ! function_exists( 'h212_progress_state' ) ) {
	http_response_code( 500 );
	echo wp_json_encode( array( 'error' => 'Progress rules are not installed.' ) );
	exit;
}

$state = h212_progress_state( $h212_user->ID, true );
echo wp_json_encode( array( 'chapters' => $state['chapters'] ) );
