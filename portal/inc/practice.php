<?php
/**
 * Opposites and Idioms practice: saves a student's progress and written sentences.
 * Practice only - none of this counts for unlocks or Grades. Each section has its own
 * record (user meta h212_opposites / h212_idioms), see wp-content/mu-plugins/212-progress.php.
 *
 * GET  ?section=opposites
 *      -> { seen: [ids], wrong: [ids] }
 * POST { nonce, section, action: "answer", id, chosen }
 *      -> { ok, correct, answer, seen, wrong }        (the SERVER decides if it is correct)
 * POST { nonce, section, action: "sentence", id, text }
 *      -> { ok: true, example, seen, wrong }                       saved for the teacher
 *      -> { ok: false, short, missing: [words], min }              not saved - what to fix
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );

$defs = h212_practice_sections();
$body = null;
if ( 'POST' === $_SERVER['REQUEST_METHOD'] ) {
	$body = json_decode( file_get_contents( 'php://input' ), true );
}

$section = '';
if ( is_array( $body ) && isset( $body['section'] ) ) {
	$section = sanitize_key( $body['section'] );
} elseif ( isset( $_GET['section'] ) ) {
	$section = sanitize_key( wp_unslash( $_GET['section'] ) );
}
if ( ! isset( $defs[ $section ] ) ) {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => 'Unknown section.' ) );
	exit;
}
$def   = $defs[ $section ];
$state = h212_practice_state( $h212_user->ID, $section );

if ( 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
	echo wp_json_encode( array( 'seen' => $state['seen'], 'wrong' => $state['wrong'] ) );
	exit;
}

if ( ! is_array( $body ) || ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_practice' ) ) {
	http_response_code( 403 );
	echo wp_json_encode( array( 'error' => 'Invalid or expired request. Please refresh the page.' ) );
	exit;
}

$id  = isset( $body['id'] ) ? sanitize_text_field( (string) $body['id'] ) : '';
$row = h212_practice_row( $section, $id );
if ( ! $row ) {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => 'Unknown question.' ) );
	exit;
}

$action = isset( $body['action'] ) ? sanitize_key( $body['action'] ) : '';

// ── An answer to a multiple-choice question ──
if ( 'answer' === $action && 'write' !== $row['kind'] ) {
	$chosen  = isset( $body['chosen'] ) ? sanitize_text_field( (string) $body['chosen'] ) : '';
	$correct = ( $chosen === $row['answer'] );
	if ( ! in_array( $id, $state['seen'], true ) ) {
		$state['seen'][] = $id;
	}
	if ( $correct ) {
		$state['wrong'] = array_values( array_diff( $state['wrong'], array( $id ) ) );
	} elseif ( ! in_array( $id, $state['wrong'], true ) ) {
		$state['wrong'][] = $id;
	}
	h212_practice_save_state( $h212_user->ID, $section, $state );
	echo wp_json_encode( array( 'ok' => true, 'correct' => $correct, 'answer' => $row['answer'], 'seen' => $state['seen'], 'wrong' => $state['wrong'] ) );
	exit;
}

// ── A written sentence ──
if ( 'sentence' === $action && 'write' === $row['kind'] ) {
	$text = isset( $body['text'] ) ? trim( sanitize_textarea_field( (string) $body['text'] ) ) : '';
	$text = function_exists( 'mb_substr' ) ? mb_substr( $text, 0, 500 ) : substr( $text, 0, 500 );

	$check = h212_video_check_sentence( $text, $row['required'], (int) $def['min_words'] );
	if ( ! $check['ok'] ) {
		echo wp_json_encode( array( 'ok' => false, 'short' => $check['short'], 'missing' => $check['missing'], 'min' => (int) $def['min_words'] ) );
		exit;
	}

	$state['sentences'][] = array(
		'id'   => $id,
		'set'  => $row['set'],
		'text' => $text,
		'date' => current_time( 'mysql' ),
	);
	if ( ! in_array( $id, $state['seen'], true ) ) {
		$state['seen'][] = $id;
	}
	$state['wrong'] = array_values( array_diff( $state['wrong'], array( $id ) ) );
	h212_practice_save_state( $h212_user->ID, $section, $state );
	echo wp_json_encode( array( 'ok' => true, 'example' => $row['example'], 'seen' => $state['seen'], 'wrong' => $state['wrong'] ) );
	exit;
}

http_response_code( 400 );
echo wp_json_encode( array( 'error' => 'Unknown action.' ) );
