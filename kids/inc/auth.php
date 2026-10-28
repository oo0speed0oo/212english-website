<?php
/**
 * 212 Kids - gatekeeper for every kids page.
 * Include this at the very top of a page, before any HTML is echoed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	require_once __DIR__ . '/../../wp-load.php';
}

/*
 * WHO CAN OPEN /kids/  (the one easy setting)
 *   'admins'   = only administrators (testing, now)
 *   'everyone' = any logged-in account (parents and students)
 */
if ( ! defined( 'H212_KIDS_WHO' ) ) {
	define( 'H212_KIDS_WHO', 'admins' );
}

// Kids pages are private and change per account: no page cache may keep a copy (LiteSpeed included).
function h212_kids_no_cache() {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
	if ( ! defined( 'DONOTCACHEOBJECT' ) ) {
		define( 'DONOTCACHEOBJECT', true );
	}
	if ( ! headers_sent() ) {
		nocache_headers();
		header( 'X-LiteSpeed-Cache-Control: no-cache, no-store, private' );
	}
	do_action( 'litespeed_control_set_nocache', '212 Kids: private page' );
}
h212_kids_no_cache();

function h212_kids_can_open() {
	if ( ! is_user_logged_in() ) {
		return false;
	}
	if ( 'everyone' === H212_KIDS_WHO ) {
		return true;
	}
	return current_user_can( 'administrator' );
}

// Not allowed (yet): show the simple "Coming soon" page and stop.
if ( ! h212_kids_can_open() ) {
	// A JSON request (saving) gets a plain error instead of a page.
	if ( defined( 'H212_KIDS_JSON' ) ) {
		http_response_code( 403 );
		header( 'Content-Type: application/json' );
		echo wp_json_encode( array( 'error' => 'Please log in again.' ) );
		exit;
	}
	require __DIR__ . '/coming-soon.php';
	exit;
}

$h212_user = wp_get_current_user();

require_once __DIR__ . '/children.php';
