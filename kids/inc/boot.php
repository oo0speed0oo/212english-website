<?php
/**
 * 212 Kids - loads WordPress and the kids settings. Every kids page starts here.
 */

if ( ! defined( 'ABSPATH' ) ) {
	require_once __DIR__ . '/../../wp-load.php';
}

/*
 * WHO CAN OPEN /kids/  (the one easy setting)
 * A list of WordPress roles, separated by commas. Everyone else who logs in sees "Coming soon".
 *   administrator = Mike
 *   kids_parent   = parent accounts (wp-admin > Users > Add New > Role: Kids Parent)
 *   student       = adult portal students (useful as testers)
 * Admins only:  'administrator'
 */
if ( ! defined( 'H212_KIDS_ROLES' ) ) {
	define( 'H212_KIDS_ROLES', 'administrator,kids_parent,student' );
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

function h212_kids_can_open( $user = null ) {
	$user = $user ? $user : wp_get_current_user();
	if ( ! $user || ! $user->exists() ) {
		return false;
	}
	$allowed = array_filter( array_map( 'trim', explode( ',', H212_KIDS_ROLES ) ) );
	return (bool) array_intersect( $allowed, (array) $user->roles );
}

function h212_kids_url( $path = '' ) {
	return home_url( '/kids/' . $path );
}

function h212_kids_asset_v( $file ) {
	return (int) @filemtime( __DIR__ . '/../' . $file );
}
