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
