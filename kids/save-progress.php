<?php
/**
 * 212 Kids - save a child's progress and records.
 * POST JSON { nonce, child: CHILD ID, ... } and one of:
 *   { tile: TILE ID }                                   a menu tile was opened
 *   { action: "pick" }                                  the child was picked on "Who is playing?"
 *   { action: "start", game: GAME ID }                  a game started -> answers { play: PLAY ID }
 *   { action: "answer", play, item: ITEM ID, tries, glowed }  one question answered (tries 1 = first try)
 *   { game: GAME ID, stars: 0-3, play?: PLAY ID }       a game was finished (stars + sticker)
 * The records need wp-content/mu-plugins/212-kids.php; without it only stars and stickers are saved.
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
$child    = h212_kids_find_child( $h212_user->ID, $child_id );
if ( ! $child ) {
	h212_kids_bad_request();
}

$action  = isset( $body['action'] ) ? (string) $body['action'] : '';
$records = function_exists( 'h212_kids_rec_start' );
$games   = h212_kids_games();
$play    = ( $records && isset( $body['play'] ) ) ? h212_kids_get_play( $h212_user->ID, $child_id, (int) $body['play'] ) : null;

if ( 'pick' === $action ) {
	if ( $records ) {
		h212_kids_rec_event( $h212_user->ID, $child_id, 'pick' );
	}
	echo wp_json_encode( array( 'ok' => true ) );
	exit;
}

if ( 'start' === $action ) {
	$game_id = isset( $body['game'] ) ? (string) $body['game'] : '';
	if ( ! isset( $games['games'][ $game_id ] ) ) {
		h212_kids_bad_request();
	}
	$play_id = $records ? h212_kids_rec_start( $h212_user->ID, $child_id, (string) $child['level'], $game_id ) : 0;
	echo wp_json_encode( array( 'ok' => true, 'play' => $play_id ) );
	exit;
}

if ( 'answer' === $action ) {
	// What was asked comes from games.json, never from the browser; only "how many tries" does.
	$item_id = isset( $body['item'] ) ? (string) $body['item'] : '';
	if ( ! $play || ! in_array( $item_id, h212_kids_game_item_ids( $play->game ), true ) ) {
		h212_kids_bad_request();
	}
	$item = $games['items'][ $item_id ];
	h212_kids_rec_answer( $play, array(
		'item_id'    => $item_id,
		'round_type' => (string) $item['type'],
		'word'       => (string) ( $item['word'] ?? '' ),
		// Opinion questions ("Do you like...?", the Pizza Shop customer) have no right or wrong:
		// saved, but not in accuracy.
		'counted'    => ! ( ( 'yesno' === $item['type'] && 'fact' !== ( $item['kind'] ?? 'opinion' ) ) || ! empty( $item['opinion'] ) ),
		'tries'      => isset( $body['tries'] ) ? (int) $body['tries'] : 1,
		'glowed'     => ! empty( $body['glowed'] ),
	) );
	echo wp_json_encode( array( 'ok' => true ) );
	exit;
}

if ( isset( $body['game'] ) ) {
	// A finished game: only games that really exist; the sticker comes from games.json, never from the browser.
	$game_id = (string) $body['game'];
	if ( ! isset( $games['games'][ $game_id ] ) ) {
		h212_kids_bad_request();
	}
	$sticker  = isset( $games['games'][ $game_id ]['sticker'] ) ? sanitize_key( $games['games'][ $game_id ]['sticker'] ) : '';
	$stars    = isset( $body['stars'] ) ? $body['stars'] : 0;
	$progress = h212_kids_record_finish( $h212_user->ID, $child_id, $game_id, $stars, $sticker );
	if ( $play && $play->game === $game_id ) {
		h212_kids_rec_finish( $play, max( 0, min( 3, (int) $stars ) ) );
	}
} else {
	// Only tiles that are really on the menu.
	$tile_id = isset( $body['tile'] ) ? (string) $body['tile'] : '';
	if ( ! in_array( $tile_id, h212_kids_tile_ids(), true ) ) {
		h212_kids_bad_request();
	}
	$progress = h212_kids_record_play( $h212_user->ID, $child_id, $tile_id );
}

echo wp_json_encode( array( 'ok' => true, 'progress' => $progress ) );
