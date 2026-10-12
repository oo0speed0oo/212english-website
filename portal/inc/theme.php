<?php
/**
 * Saves the student's chosen colour theme (user meta h212_theme).
 * POST { nonce, theme } where theme is classic | sakura | sky.
 */

require __DIR__ . '/auth.php';

header( 'Content-Type: application/json' );

$body = json_decode( file_get_contents( 'php://input' ), true );

if ( 'POST' !== $_SERVER['REQUEST_METHOD'] || ! is_array( $body )
	|| ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_theme' ) ) {
	http_response_code( 403 );
	echo wp_json_encode( array( 'error' => 'Invalid or expired request. Please refresh the page.' ) );
	exit;
}

$theme = isset( $body['theme'] ) ? sanitize_key( $body['theme'] ) : '';
if ( ! in_array( $theme, array( 'classic', 'sakura', 'sky' ), true ) ) {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => 'Unknown theme.' ) );
	exit;
}

update_user_meta( $h212_user->ID, 'h212_theme', $theme );
echo wp_json_encode( array( 'ok' => true, 'theme' => $theme ) );
