<?php
/**
 * 212 Kids - the children saved on a parent's account (user meta h212_kids_children).
 *
 * PRIVACY: each child is ONLY { id, name (nickname), color, level }. Never add anything else
 * about a child here (no birthday, photo, school, full name, audio).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'H212_KIDS_MAX_CHILDREN', 8 );
define( 'H212_KIDS_NAME_MAX', 12 );

function h212_kids_colors() {
	return array( 'pink', 'blue', 'green', 'yellow', 'orange', 'purple' );
}

function h212_kids_levels() {
	return array( 'prek', 'k', '1', '2', '3', '4' );
}

function h212_kids_get_children( $user_id ) {
	$list = get_user_meta( $user_id, 'h212_kids_children', true );
	return is_array( $list ) ? array_values( $list ) : array();
}

function h212_kids_save_children( $user_id, $list ) {
	update_user_meta( $user_id, 'h212_kids_children', array_values( $list ) );
}

/*
 * Progress per child (user meta h212_kids_progress):
 *   { child id: { stars: total, played: { tile id: times opened }, best: { game id: stars },
 *                 stickers: [ sticker names ], last: 'Y-m-d H:i' } }
 */
function h212_kids_get_progress( $user_id ) {
	$all = get_user_meta( $user_id, 'h212_kids_progress', true );
	return is_array( $all ) ? $all : array();
}

function h212_kids_child_progress( $all, $child_id ) {
	$p = isset( $all[ $child_id ] ) && is_array( $all[ $child_id ] ) ? $all[ $child_id ] : array();
	return array(
		'stars'    => isset( $p['stars'] ) ? (int) $p['stars'] : 0,
		'played'   => isset( $p['played'] ) && is_array( $p['played'] ) ? $p['played'] : array(),
		'best'     => isset( $p['best'] ) && is_array( $p['best'] ) ? $p['best'] : array(),
		'stickers' => isset( $p['stickers'] ) && is_array( $p['stickers'] ) ? array_values( $p['stickers'] ) : array(),
		'last'     => isset( $p['last'] ) ? (string) $p['last'] : '',
	);
}

// A child finished a game: add its stars, remember the best score and give its sticker.
function h212_kids_record_finish( $user_id, $child_id, $game_id, $stars, $sticker ) {
	$all   = h212_kids_get_progress( $user_id );
	$p     = h212_kids_child_progress( $all, $child_id );
	$stars = max( 0, min( 3, (int) $stars ) );
	$p['stars'] += $stars;
	$p['best'][ $game_id ] = max( $stars, isset( $p['best'][ $game_id ] ) ? (int) $p['best'][ $game_id ] : 0 );
	if ( $sticker && ! in_array( $sticker, $p['stickers'], true ) ) {
		$p['stickers'][] = $sticker;
	}
	$p['last'] = current_time( 'Y-m-d H:i' );
	$all[ $child_id ] = $p;
	update_user_meta( $user_id, 'h212_kids_progress', $all );
	return $p;
}

function h212_kids_games() {
	static $games = null;
	if ( null === $games ) {
		$games = json_decode( (string) file_get_contents( __DIR__ . '/../games.json' ), true );
		$games = is_array( $games ) ? $games : array();
	}
	return $games;
}

// Every question id a game can ask (its rounds, including shared pools).
function h212_kids_game_item_ids( $game_id ) {
	$games = h212_kids_games();
	$ids   = array();
	foreach ( (array) ( $games['games'][ $game_id ]['rounds'] ?? array() ) as $round ) {
		if ( isset( $round['pool'] ) && isset( $games['pools'][ $round['pool'] ] ) ) {
			$round = $round + $games['pools'][ $round['pool'] ];
		}
		foreach ( (array) ( $round['items'] ?? array() ) as $id ) {
			if ( isset( $games['items'][ $id ] ) ) {
				$ids[] = (string) $id;
			}
		}
	}
	return $ids;
}

function h212_kids_find_child( $user_id, $child_id ) {
	foreach ( h212_kids_get_children( $user_id ) as $c ) {
		if ( $c['id'] === $child_id ) {
			return $c;
		}
	}
	return null;
}

// Remember that a child opened a tile.
function h212_kids_record_play( $user_id, $child_id, $tile_id ) {
	$all = h212_kids_get_progress( $user_id );
	$p   = h212_kids_child_progress( $all, $child_id );
	$p['played'][ $tile_id ] = ( isset( $p['played'][ $tile_id ] ) ? (int) $p['played'][ $tile_id ] : 0 ) + 1;
	$p['last'] = current_time( 'Y-m-d H:i' );
	$all[ $child_id ] = $p;
	update_user_meta( $user_id, 'h212_kids_progress', $all );
	return $p;
}

function h212_kids_forget_progress( $user_id, $child_id ) {
	$all = h212_kids_get_progress( $user_id );
	unset( $all[ $child_id ] );
	update_user_meta( $user_id, 'h212_kids_progress', $all );
}

// Every tile id in kids-menu.json (lessons and theme games), plus the homework tile.
function h212_kids_tile_ids() {
	$menu = json_decode( (string) file_get_contents( __DIR__ . '/../kids-menu.json' ), true );
	$ids  = array( 'homework' );
	if ( is_array( $menu ) ) {
		foreach ( (array) ( $menu['levels'] ?? array() ) as $lv ) {
			foreach ( (array) ( $lv['months'] ?? array() ) as $m ) {
				foreach ( (array) ( $m['lessons'] ?? array() ) as $l ) {
					$ids[] = (string) $l['id'];
				}
			}
		}
		foreach ( (array) ( $menu['themes'] ?? array() ) as $t ) {
			foreach ( (array) ( $t['games'] ?? array() ) as $g ) {
				$ids[] = (string) $g['id'];
			}
		}
	}
	return $ids;
}

// Clean one child from the browser. Returns null if anything is not allowed.
function h212_kids_clean_child( $raw ) {
	if ( ! is_array( $raw ) ) {
		return null;
	}
	$name = isset( $raw['name'] ) ? trim( sanitize_text_field( (string) $raw['name'] ) ) : '';
	$name = mb_substr( $name, 0, H212_KIDS_NAME_MAX );
	$color = isset( $raw['color'] ) ? (string) $raw['color'] : '';
	$level = isset( $raw['level'] ) ? (string) $raw['level'] : '';
	if ( '' === $name || ! in_array( $color, h212_kids_colors(), true ) || ! in_array( $level, h212_kids_levels(), true ) ) {
		return null;
	}
	return array( 'name' => $name, 'color' => $color, 'level' => $level );
}
