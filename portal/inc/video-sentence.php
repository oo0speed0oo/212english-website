<?php
/**
 * "Your turn": checks a student's sentence for one video lesson and, if it
 * passes, saves it for the teacher (user meta h212_video_sentences).
 * The checking rules live in wp-content/mu-plugins/212-progress.php.
 *
 * POST { nonce, video_id, text }
 *   -> { ok: true, example: "..." }                       saved
 *   -> { ok: false, short: bool, missing: ["word", ...] } not saved - what to fix
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );

$body = json_decode( file_get_contents( 'php://input' ), true );

if ( 'POST' !== $_SERVER['REQUEST_METHOD'] || ! is_array( $body )
	|| ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_video_sentence' ) ) {
	http_response_code( 403 );
	echo wp_json_encode( array( 'error' => 'Invalid or expired request. Please refresh the page.' ) );
	exit;
}

if ( ! function_exists( 'h212_video_get' ) ) {
	http_response_code( 500 );
	echo wp_json_encode( array( 'error' => 'Video rules are not installed.' ) );
	exit;
}

$video_id = isset( $body['video_id'] ) ? sanitize_text_field( $body['video_id'] ) : '';
$video    = h212_video_get( $video_id );
if ( ! $video || ! $video['write'] ) {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => 'Unknown video.' ) );
	exit;
}

$text = isset( $body['text'] ) ? trim( sanitize_textarea_field( (string) $body['text'] ) ) : '';
$text = function_exists( 'mb_substr' ) ? mb_substr( $text, 0, 500 ) : substr( $text, 0, 500 );

$check = h212_video_check_sentence( $text, $video['write']['required'] );
if ( ! $check['ok'] ) {
	echo wp_json_encode( array( 'ok' => false, 'short' => $check['short'], 'missing' => $check['missing'] ) );
	exit;
}

$list   = h212_video_sentences( $h212_user->ID );
$list[] = array(
	'video_id' => $video_id,
	'id'       => $video['write']['id'],
	'text'     => $text,
	'date'     => current_time( 'mysql' ),
);
if ( count( $list ) > 1000 ) {
	$list = array_slice( $list, -1000 );
}
update_user_meta( $h212_user->ID, 'h212_video_sentences', $list );

echo wp_json_encode( array( 'ok' => true, 'example' => $video['write']['example'] ) );
