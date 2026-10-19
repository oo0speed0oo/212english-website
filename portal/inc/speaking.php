<?php
/**
 * Speaking practice: remembers HOW MANY TIMES a student tried each speaking
 * question (user meta h212_speaking: question id => number of tries).
 * Nothing else is saved - no audio, no scores. Speaking is practice only and
 * never counts toward unlocking chapters or Grades.
 * GET  -> { tries: { "2611": 2, ... } }
 * POST -> { nonce, id } adds one try for that question, returns the same list.
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );
header( 'Cache-Control: no-store' );

function h212_get_speaking_tries( $user_id ) {
	$tries = get_user_meta( $user_id, 'h212_speaking', true );
	return is_array( $tries ) ? $tries : array();
}

if ( 'POST' === $_SERVER['REQUEST_METHOD'] ) {
	$body = json_decode( file_get_contents( 'php://input' ), true );

	if ( ! is_array( $body ) || ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_save_score' ) ) {
		http_response_code( 403 );
		echo wp_json_encode( array( 'error' => 'Invalid or expired request. Please refresh the page.' ) );
		exit;
	}

	$id = isset( $body['id'] ) ? sanitize_text_field( (string) $body['id'] ) : '';
	if ( ! preg_match( '/^\d{1,6}$/', $id ) ) {
		http_response_code( 400 );
		echo wp_json_encode( array( 'error' => 'Missing or bad question id.' ) );
		exit;
	}

	$tries = h212_get_speaking_tries( $h212_user->ID );
	if ( isset( $tries[ $id ] ) || count( $tries ) < 1000 ) {
		$tries[ $id ] = min( 9999, (int) ( $tries[ $id ] ?? 0 ) + 1 );
		update_user_meta( $h212_user->ID, 'h212_speaking', $tries );
	}

	echo wp_json_encode( array( 'ok' => true, 'tries' => (object) $tries ) );
	exit;
}

echo wp_json_encode( array( 'tries' => (object) h212_get_speaking_tries( $h212_user->ID ) ) );
