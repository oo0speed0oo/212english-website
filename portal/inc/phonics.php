<?php
/**
 * Phonics: saves which parts of which lessons a student has finished.
 * Practice only - none of this counts for unlocks or Grades. Record: user meta h212_phonics.
 *
 * GET  -> { lessons: { "4": { board: 1 } } }
 * POST { nonce, action: "part", lesson, part, score? }
 *      -> { ok: true, lessons }      part = board | blend | listen | read | sentences
 */

require __DIR__ . '/auth.php';
require_once __DIR__ . '/phonics-data.php';

header( 'Content-Type: application/json' );

if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
	$state = h212_phonics_state( $h212_user->ID );
	echo wp_json_encode( array( 'lessons' => (object) $state['lessons'] ) );
	exit;
}

$body = json_decode( file_get_contents( 'php://input' ), true );
if ( ! is_array( $body ) || ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_phonics' ) ) {
	http_response_code( 403 );
	echo wp_json_encode( array( 'error' => 'Invalid or expired request. Please refresh the page.' ) );
	exit;
}

$action = isset( $body['action'] ) ? sanitize_key( $body['action'] ) : '';
$part   = isset( $body['part'] ) ? sanitize_key( $body['part'] ) : '';
$state  = ( 'part' === $action )
	? h212_phonics_mark( $h212_user->ID, isset( $body['lesson'] ) ? (int) $body['lesson'] : 0, $part, isset( $body['score'] ) ? (int) $body['score'] : 1 )
	: false;
if ( false === $state ) {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => 'Unknown lesson or part.' ) );
	exit;
}
echo wp_json_encode( array( 'ok' => true, 'lessons' => (object) $state['lessons'] ) );
