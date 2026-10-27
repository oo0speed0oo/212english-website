<?php
/**
 * Saves and returns a logged-in student's homework/test quiz scores.
 * GET  -> returns all of this student's saved scores as JSON.
 * POST -> saves one new quiz attempt, returns the updated full list.
 *
 * Every attempt is kept (not just the latest), so the student's full
 * history is available for progress badges and a future Grades page.
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );

$h212_scores_meta_key = 'h212_quiz_scores';
// Which parts exist comes from the shared list in 212-progress.php (not typed here).
$h212_valid_types     = h212_all_parts();

function h212_get_scores( $user_id ) {
	$scores = get_user_meta( $user_id, 'h212_quiz_scores', true );
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
	$type    = isset( $body['type'] )    ? sanitize_text_field( $body['type'] ) : '';
	$score   = isset( $body['score'] )   ? intval( $body['score'] )   : -1;
	$total   = isset( $body['total'] )   ? intval( $body['total'] )   : 0;

	// Any level and chapter that exists in the content files is accepted - no fixed limit.
	$is_valid = h212_course_has( $level, $chapter )
		&& in_array( $type, $h212_valid_types, true )
		&& $total > 0 && $score >= 0 && $score <= $total;

	if ( ! $is_valid ) {
		http_response_code( 400 );
		echo wp_json_encode( array( 'error' => 'Invalid score data.' ) );
		exit;
	}

	$scores   = h212_get_scores( $h212_user->ID );
	$scores[] = array(
		'level'   => $level,
		'chapter' => $chapter,
		'type'    => $type,
		'score'   => $score,
		'total'   => $total,
		'date'    => current_time( 'mysql' ),
	);
	update_user_meta( $h212_user->ID, $h212_scores_meta_key, $scores );

	echo wp_json_encode( array( 'ok' => true, 'scores' => $scores ) );
	exit;
}

// GET
echo wp_json_encode( array( 'scores' => h212_get_scores( $h212_user->ID ) ) );
