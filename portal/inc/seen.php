<?php
/**
 * Tracks which individual homework/test question IDs a student has ever
 * answered, so a quiz can put never-seen questions first and put ones
 * they've already answered before at the end.
 * GET  -> returns all question IDs this student has answered, as JSON.
 * POST -> marks one more question ID as seen, returns the updated list.
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );

$h212_seen_meta_key = 'h212_seen_questions';

function h212_get_seen( $user_id ) {
	$seen = get_user_meta( $user_id, 'h212_seen_questions', true );
	return is_array( $seen ) ? $seen : array();
}

if ( $_SERVER['REQUEST_METHOD'] === 'POST' ) {
	$body = json_decode( file_get_contents( 'php://input' ), true );

	if ( ! is_array( $body ) || ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_save_score' ) ) {
		http_response_code( 403 );
		echo wp_json_encode( array( 'error' => 'Invalid or expired request. Please refresh the page.' ) );
		exit;
	}

	$id = isset( $body['id'] ) ? sanitize_text_field( $body['id'] ) : '';
	if ( $id === '' ) {
		http_response_code( 400 );
		echo wp_json_encode( array( 'error' => 'Missing question id.' ) );
		exit;
	}

	$seen = h212_get_seen( $h212_user->ID );
	if ( ! in_array( $id, $seen, true ) ) {
		$seen[] = $id;
		update_user_meta( $h212_user->ID, $h212_seen_meta_key, $seen );
	}

	echo wp_json_encode( array( 'ok' => true, 'seen' => $seen ) );
	exit;
}

// GET
echo wp_json_encode( array( 'seen' => h212_get_seen( $h212_user->ID ) ) );
