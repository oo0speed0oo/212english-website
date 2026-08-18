<?php
/**
 * Saves and returns a logged-in student's Test attempts (separate from
 * h212_quiz_scores, which is Homework only). Every attempt is kept, so
 * "best score" reflects their best try, same convention as Homework.
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );

function h212_get_test_scores( $user_id ) {
	$scores = get_user_meta( $user_id, 'h212_test_scores', true );
	return is_array( $scores ) ? $scores : array();
}

if ( $_SERVER['REQUEST_METHOD'] === 'POST' ) {
	$body = json_decode( file_get_contents( 'php://input' ), true );

	if ( ! is_array( $body ) || ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_save_score' ) ) {
		http_response_code( 403 );
		echo wp_json_encode( array( 'error' => 'Invalid or expired request. Please refresh the page.' ) );
		exit;
	}

	$level   = isset( $body['level'] )   ? intval( $body['level'] )   : 0;
	$chapter = isset( $body['chapter'] ) ? intval( $body['chapter'] ) : 0;
	$score   = isset( $body['score'] )   ? intval( $body['score'] )   : -1;
	$total   = isset( $body['total'] )   ? intval( $body['total'] )   : 0;

	$is_valid = $level >= 1 && $level <= 5
		&& $chapter >= 1 && $chapter <= 16
		&& $total > 0 && $score >= 0 && $score <= $total;

	if ( ! $is_valid ) {
		http_response_code( 400 );
		echo wp_json_encode( array( 'error' => 'Invalid score data.' ) );
		exit;
	}

	$scores   = h212_get_test_scores( $h212_user->ID );
	$scores[] = array(
		'level'   => $level,
		'chapter' => $chapter,
		'score'   => $score,
		'total'   => $total,
		'date'    => current_time( 'mysql' ),
	);
	update_user_meta( $h212_user->ID, 'h212_test_scores', $scores );

	echo wp_json_encode( array( 'ok' => true, 'scores' => $scores ) );
	exit;
}

// GET
echo wp_json_encode( array( 'scores' => h212_get_test_scores( $h212_user->ID ) ) );
