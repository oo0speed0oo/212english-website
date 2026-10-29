<?php
/**
 * 212 Kids - gatekeeper for every kids page.
 * Include this at the very top of a page, before any HTML is echoed.
 */

require_once __DIR__ . '/boot.php';

if ( ! h212_kids_can_open() ) {
	// A JSON request (saving) gets a plain error instead of a page.
	if ( defined( 'H212_KIDS_JSON' ) ) {
		http_response_code( 403 );
		header( 'Content-Type: application/json' );
		echo wp_json_encode( array( 'error' => 'Please log in again.' ) );
		exit;
	}
	// Not logged in: the kids login page. Logged in with an account that may not come in: "Coming soon".
	if ( ! is_user_logged_in() ) {
		wp_safe_redirect( h212_kids_url( 'login.php' ) );
		exit;
	}
	require __DIR__ . '/coming-soon.php';
	exit;
}

$h212_user = wp_get_current_user();

// Note that this account was just active (the same "Last active" the teacher screen shows for students).
if ( function_exists( 'h212_touch_activity' ) ) {
	h212_touch_activity( $h212_user->ID );
}

require_once __DIR__ . '/children.php';
