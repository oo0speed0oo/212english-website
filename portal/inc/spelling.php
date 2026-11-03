<?php
/**
 * Spelling: saves which games of which word sets a student has finished, and their Easy / Normal choice.
 * Practice only - none of this counts for unlocks or Grades. Record: user meta h212_spelling.
 *
 * GET  -> { sets: { "L1-03": { missing: 80 } }, mode }
 * POST { nonce, action: "part", set, part, score? }   part = missing | search | cross
 * POST { nonce, action: "mode", mode }                 mode = easy | normal
 *      -> { ok: true, sets, mode }
 */

require __DIR__ . '/auth.php';
require_once __DIR__ . '/spelling-data.php';

header( 'Content-Type: application/json' );

if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
	$state = h212_spelling_state( $h212_user->ID );
	echo wp_json_encode( array( 'sets' => (object) $state['sets'], 'mode' => $state['mode'] ) );
	exit;
}

$body = json_decode( file_get_contents( 'php://input' ), true );
if ( ! is_array( $body ) || ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_spelling' ) ) {
	http_response_code( 403 );
	echo wp_json_encode( array( 'error' => 'Invalid or expired request. Please refresh the page.' ) );
	exit;
}

$action = isset( $body['action'] ) ? sanitize_key( $body['action'] ) : '';
$state  = false;
if ( 'part' === $action ) {
	$set   = isset( $body['set'] ) ? preg_replace( '/[^A-Za-z0-9-]/', '', (string) $body['set'] ) : '';
	$state = h212_spelling_mark( $h212_user->ID, $set, isset( $body['part'] ) ? sanitize_key( $body['part'] ) : '', isset( $body['score'] ) ? (int) $body['score'] : 1 );
} elseif ( 'mode' === $action ) {
	$state = h212_spelling_set_mode( $h212_user->ID, isset( $body['mode'] ) ? sanitize_key( $body['mode'] ) : '' );
}
if ( false === $state ) {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => 'Unknown set, game or level.' ) );
	exit;
}
echo wp_json_encode( array( 'ok' => true, 'sets' => (object) $state['sets'], 'mode' => $state['mode'] ) );
