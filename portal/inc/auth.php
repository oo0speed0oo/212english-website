<?php
/**
 * Gatekeeper for every protected portal page.
 * Include this at the very top of a page, before any HTML is echoed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	require_once __DIR__ . '/../../wp-load.php';
}

if ( ! is_user_logged_in() || ! current_user_can( 'student' ) ) {
	wp_safe_redirect( home_url( '/portal/login.php' ) );
	exit;
}

$h212_user = wp_get_current_user();

require_once __DIR__ . '/i18n.php';
