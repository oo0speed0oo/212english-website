<?php
/**
 * 212 Kids - add, change or remove a child on the logged-in account.
 * POST JSON { nonce, action: add | update | remove, child: { id?, name, color, level } }
 * Answers with the whole new list of children.
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

$action   = isset( $body['action'] ) ? (string) $body['action'] : '';
$raw      = isset( $body['child'] ) && is_array( $body['child'] ) ? $body['child'] : array();
$child_id = isset( $raw['id'] ) ? sanitize_key( $raw['id'] ) : '';
$children = h212_kids_get_children( $h212_user->ID );

function h212_kids_fail( $msg ) {
	http_response_code( 400 );
	echo wp_json_encode( array( 'error' => $msg ) );
	exit;
}

if ( 'add' === $action ) {
	$child = h212_kids_clean_child( $raw );
	if ( ! $child ) {
		h212_kids_fail( 'Please type a nickname and pick a color and level.' );
	}
	if ( count( $children ) >= H212_KIDS_MAX_CHILDREN ) {
		h212_kids_fail( 'This account already has the most children allowed.' );
	}
	$child = array( 'id' => strtolower( wp_generate_password( 8, false ) ) ) + $child;
	$children[] = $child;
} elseif ( 'update' === $action || 'remove' === $action ) {
	$found = false;
	foreach ( $children as $i => $c ) {
		if ( isset( $c['id'] ) && $c['id'] === $child_id ) {
			$found = true;
			if ( 'remove' === $action ) {
				unset( $children[ $i ] );
				h212_kids_forget_progress( $h212_user->ID, $child_id );
			} else {
				$child = h212_kids_clean_child( $raw );
				if ( ! $child ) {
					h212_kids_fail( 'Please type a nickname and pick a color and level.' );
				}
				$children[ $i ] = array( 'id' => $child_id ) + $child;
			}
		}
	}
	if ( ! $found ) {
		h212_kids_fail( 'That child was not found. Please refresh the page.' );
	}
} else {
	h212_kids_fail( 'Unknown action.' );
}

h212_kids_save_children( $h212_user->ID, $children );
echo wp_json_encode( array( 'ok' => true, 'children' => h212_kids_get_children( $h212_user->ID ) ) );
