<?php
/**
 * Tracks wrong answers for a student.
 * - h212_current_wrong: question IDs the student currently has wrong
 *   (cleared once they answer that question correctly). Drives which
 *   questions resurface for retry on the homework page.
 * - h212_mistake_log: a permanent, append-only record of every wrong
 *   answer ever given (question text, what they chose, the correct
 *   answer, and when) - kept for a future teacher-facing report. Never
 *   cleared, even after the student later gets the question right.
 *
 * GET  -> returns the student's current_wrong list.
 * POST -> records one answer (right or wrong) and returns the updated
 *         current_wrong list.
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );

function h212_get_current_wrong( $user_id ) {
	$list = get_user_meta( $user_id, 'h212_current_wrong', true );
	return is_array( $list ) ? $list : array();
}

function h212_get_mistake_log( $user_id ) {
	$log = get_user_meta( $user_id, 'h212_mistake_log', true );
	return is_array( $log ) ? $log : array();
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

	$correct       = ! empty( $body['correct'] );
	$current_wrong = h212_get_current_wrong( $h212_user->ID );

	if ( $correct ) {
		$current_wrong = array_values( array_diff( $current_wrong, array( $id ) ) );
		update_user_meta( $h212_user->ID, 'h212_current_wrong', $current_wrong );
	} else {
		if ( ! in_array( $id, $current_wrong, true ) ) {
			$current_wrong[] = $id;
			update_user_meta( $h212_user->ID, 'h212_current_wrong', $current_wrong );
		}

		$log   = h212_get_mistake_log( $h212_user->ID );
		$log[] = array(
			'id'             => $id,
			'level'          => isset( $body['level'] )   ? intval( $body['level'] )   : 0,
			'chapter'        => isset( $body['chapter'] ) ? intval( $body['chapter'] ) : 0,
			'type'           => isset( $body['type'] )    ? sanitize_text_field( $body['type'] )    : '',
			'question'       => isset( $body['question'] )       ? sanitize_text_field( $body['question'] )       : '',
			'chosen'         => isset( $body['chosen'] )          ? sanitize_text_field( $body['chosen'] )         : '',
			'correct_answer' => isset( $body['correct_answer'] )  ? sanitize_text_field( $body['correct_answer'] ) : '',
			'date'           => current_time( 'mysql' ),
		);
		update_user_meta( $h212_user->ID, 'h212_mistake_log', $log );
	}

	echo wp_json_encode( array( 'ok' => true, 'current_wrong' => $current_wrong ) );
	exit;
}

// GET
echo wp_json_encode( array( 'current_wrong' => h212_get_current_wrong( $h212_user->ID ) ) );
