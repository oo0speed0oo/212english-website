<?php
/**
 * 212 Kids - save a child's progress.
 * POST JSON { nonce, child: CHILD ID, tile: TILE ID }               a tile was opened
 * POST JSON { nonce, child: CHILD ID, game: GAME ID, stars: 0-3 }   a game was finished
 * Answers with that child's progress { stars, played, best, stickers, last }.
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

function h212_kids_bad_request() {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => 'Unknown child, tile or game.' ) );
	exit;
}

// Only this account's own children.
$child_id = isset( $body['child'] ) ? sanitize_key( $body['child'] ) : '';
if ( ! h212_kids_find_child( $h212_user->ID, $child_id ) ) {
	h212_kids_bad_request();
}

if ( isset( $body['game'] ) ) {
	// Only games that really exist; the sticker comes from games.json, never from the browser.
	$game_id = (string) $body['game'];
	$games   = h212_kids_games();
	if ( ! isset( $games['games'][ $game_id ] ) ) {
		h212_kids_bad_request();
	}
	$sticker  = isset( $games['games'][ $game_id ]['sticker'] ) ? sanitize_key( $games['games'][ $game_id ]['sticker'] ) : '';
	$progress = h212_kids_record_finish( $h212_user->ID, $child_id, $game_id, isset( $body['stars'] ) ? $body['stars'] : 0, $sticker );
} else {
	// Only tiles that are really on the menu.
	$tile_id = isset( $body['tile'] ) ? (string) $body['tile'] : '';
	if ( ! in_array( $tile_id, h212_kids_tile_ids(), true ) ) {
		h212_kids_bad_request();
	}
	$progress = h212_kids_record_play( $h212_user->ID, $child_id, $tile_id );
}

echo wp_json_encode( array( 'ok' => true, 'progress' => $progress ) );
