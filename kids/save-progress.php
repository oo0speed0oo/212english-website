<?php
/**
 * 212 Kids - remember that a child opened a tile.
 * POST JSON { nonce, child: CHILD ID, tile: TILE ID }
 * Answers with that child's progress { stars, played, last }.
 */

define( 'H212_KIDS_JSON', true );
require __DIR__ . '/inc/auth.php';

header( 'Content-Type: application/json' );

$body = json_decode( file_get_contents( 'php://input' ), true );

if ( 'POST' !== $_SERVER['REQUEST_METHOD'] || ! is_array( $body )
	|| ! isset( $body['nonce'] ) || ! wp_verify_nonce( $body['nonce'], 'h212_kids_children' ) ) {
	http_response_code( 403 );
	echo wp_json_encode( array( 'error' => 'Please refresh the page and try again.' ) );
	exit;
}

$child_id = isset( $body['child'] ) ? sanitize_key( $body['child'] ) : '';
$tile_id  = isset( $body['tile'] ) ? (string) $body['tile'] : '';

// Only this account's own children, and only tiles that are really on the menu.
$found = false;
foreach ( h212_kids_get_children( $h212_user->ID ) as $c ) {
	if ( $c['id'] === $child_id ) {
		$found = true;
	}
}
if ( ! $found || ! in_array( $tile_id, h212_kids_tile_ids(), true ) ) {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => 'Unknown child or tile.' ) );
	exit;
}

echo wp_json_encode( array( 'ok' => true, 'progress' => h212_kids_record_play( $h212_user->ID, $child_id, $tile_id ) ) );
