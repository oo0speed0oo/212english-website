<?php
/**
 * 212 Kids - the WordPress side of the kids area (/kids/).
 *
 * - Adds the "Kids Parent" role: make one in wp-admin > Users > Add New, Role "Kids Parent".
 *   Kids Parents can open /kids/ only (not the adult portal, not wp-admin).
 * - Keeps the RECORDS the teacher sees (wp-admin > 212 English > 212 Kids, in 212-kids-teacher.php).
 *
 * What is saved, nothing else about a child:
 *   user meta on the grown-up's account
 *     h212_kids_children     list of { id, name (nickname), color, level }
 *     h212_kids_progress     { child id: { stars, played: { tile id: times }, best: { game id: stars }, stickers, last } }
 *     h212_kids_login_count  how many times this grown-up logged in to /kids/, and h212_kids_last_login
 *   three database tables (made automatically, see h212_kids_install_tables)
 *     wp_h212_kids_plays     one row per game played: who, which game, started, finished, questions, first-try right, stars
 *     wp_h212_kids_answers   one row per question answered: which question, word, first try right?, tries, did it glow?
 *     wp_h212_kids_events    one row each time a child is picked on "Who is playing?", and each grown-up login
 * A child's rows are deleted when the child is removed; the teacher can delete records older than 12 months.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Register the Kids Parent role. Runs on every load but only acts once.
add_action( 'init', function () {
	if ( ! get_role( 'kids_parent' ) ) {
		add_role( 'kids_parent', 'Kids Parent', array( 'read' => true ) );
	}
} );

function h212_kids_is_parent_only( $user = null ) {
	$user  = $user ? $user : wp_get_current_user();
	$roles = (array) $user->roles;
	return in_array( 'kids_parent', $roles, true ) && ! in_array( 'administrator', $roles, true );
}

// Kids Parents never need wp-admin - send them to /kids/ instead.
add_action( 'admin_init', function () {
	if ( wp_doing_ajax() || ! is_admin() ) {
		return;
	}
	if ( h212_kids_is_parent_only() ) {
		wp_safe_redirect( home_url( '/kids/' ) );
		exit;
	}
} );

// Hide the admin toolbar on the front end for Kids Parents.
add_filter( 'show_admin_bar', function ( $show ) {
	return h212_kids_is_parent_only() ? false : $show;
} );

// After logging in on the normal WordPress login screen, Kids Parents go to /kids/.
add_filter( 'login_redirect', function ( $redirect_to, $requested, $user ) {
	if ( $user instanceof WP_User && h212_kids_is_parent_only( $user ) ) {
		return home_url( '/kids/' );
	}
	return $redirect_to;
}, 10, 3 );

// ---------- the record tables ----------

define( 'H212_KIDS_DB_VERSION', '1' );

function h212_kids_table( $name ) {
	global $wpdb;
	return $wpdb->prefix . 'h212_kids_' . $name;
}

// Makes (or updates) the three tables once; afterwards it only reads one saved option.
function h212_kids_install_tables() {
	if ( get_option( 'h212_kids_db_version' ) === H212_KIDS_DB_VERSION ) {
		return;
	}
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$charset = $wpdb->get_charset_collate();
	dbDelta( 'CREATE TABLE ' . h212_kids_table( 'plays' ) . " (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		user_id bigint(20) unsigned NOT NULL,
		child_id varchar(20) NOT NULL,
		level varchar(8) NOT NULL DEFAULT '',
		game varchar(64) NOT NULL,
		started datetime NOT NULL,
		finished datetime DEFAULT NULL,
		asked smallint(5) unsigned NOT NULL DEFAULT 0,
		counted smallint(5) unsigned NOT NULL DEFAULT 0,
		first_right smallint(5) unsigned NOT NULL DEFAULT 0,
		stars tinyint(3) unsigned NOT NULL DEFAULT 0,
		PRIMARY KEY  (id),
		KEY child (user_id,child_id),
		KEY started (started)
	) $charset;" );
	dbDelta( 'CREATE TABLE ' . h212_kids_table( 'answers' ) . " (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		play_id bigint(20) unsigned NOT NULL,
		user_id bigint(20) unsigned NOT NULL,
		child_id varchar(20) NOT NULL,
		level varchar(8) NOT NULL DEFAULT '',
		game varchar(64) NOT NULL,
		item_id varchar(12) NOT NULL,
		round_type varchar(16) NOT NULL DEFAULT '',
		word varchar(40) NOT NULL DEFAULT '',
		counted tinyint(1) unsigned NOT NULL DEFAULT 1,
		first_right tinyint(1) unsigned NOT NULL DEFAULT 0,
		tries tinyint(3) unsigned NOT NULL DEFAULT 1,
		glowed tinyint(1) unsigned NOT NULL DEFAULT 0,
		created datetime NOT NULL,
		PRIMARY KEY  (id),
		KEY play (play_id),
		KEY child (user_id,child_id),
		KEY created (created),
		KEY word (word)
	) $charset;" );
	dbDelta( 'CREATE TABLE ' . h212_kids_table( 'events' ) . " (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		user_id bigint(20) unsigned NOT NULL,
		child_id varchar(20) NOT NULL DEFAULT '',
		kind varchar(16) NOT NULL,
		created datetime NOT NULL,
		PRIMARY KEY  (id),
		KEY child (user_id,child_id),
		KEY created (created)
	) $charset;" );
	update_option( 'h212_kids_db_version', H212_KIDS_DB_VERSION );
}
add_action( 'init', 'h212_kids_install_tables' );

// ---------- saving records (called by kids/save-progress.php) ----------

function h212_kids_now() {
	return current_time( 'mysql' );
}

// "pick" = a child was chosen on "Who is playing?" (the child's login); "login" = a grown-up logged in.
function h212_kids_rec_event( $user_id, $child_id, $kind ) {
	global $wpdb;
	$t = h212_kids_table( 'events' );
	// The same child picked again within 10 minutes is the same visit: don't count it twice.
	if ( 'pick' === $kind ) {
		$recent = $wpdb->get_var( $wpdb->prepare(
			"SELECT id FROM $t WHERE user_id = %d AND child_id = %s AND kind = 'pick' AND created > %s LIMIT 1",
			$user_id, $child_id, gmdate( 'Y-m-d H:i:s', current_time( 'timestamp' ) - 600 )
		) );
		if ( $recent ) {
			return;
		}
	}
	$wpdb->insert( $t, array( 'user_id' => $user_id, 'child_id' => $child_id, 'kind' => $kind, 'created' => h212_kids_now() ) );
}

function h212_kids_rec_start( $user_id, $child_id, $level, $game ) {
	global $wpdb;
	$wpdb->insert( h212_kids_table( 'plays' ), array(
		'user_id'  => $user_id,
		'child_id' => $child_id,
		'level'    => $level,
		'game'     => $game,
		'started'  => h212_kids_now(),
	) );
	return (int) $wpdb->insert_id;
}

// The play, if it belongs to this account and child; otherwise null.
function h212_kids_get_play( $user_id, $child_id, $play_id ) {
	global $wpdb;
	$t = h212_kids_table( 'plays' );
	return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $t WHERE id = %d AND user_id = %d AND child_id = %s", $play_id, $user_id, $child_id ) );
}

/*
 * One answered question. $a = { item_id, round_type, word, counted (0 for opinion questions),
 * tries (1 = right on the first try), glowed }. A question already saved for this play is ignored.
 */
function h212_kids_rec_answer( $play, $a ) {
	global $wpdb;
	$t = h212_kids_table( 'answers' );
	$seen = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM $t WHERE play_id = %d AND item_id = %s LIMIT 1", $play->id, $a['item_id'] ) );
	if ( $seen ) {
		return;
	}
	$tries       = max( 1, min( 9, (int) $a['tries'] ) );
	$counted     = $a['counted'] ? 1 : 0;
	$first_right = ( $counted && 1 === $tries ) ? 1 : 0;
	$wpdb->insert( $t, array(
		'play_id'     => $play->id,
		'user_id'     => $play->user_id,
		'child_id'    => $play->child_id,
		'level'       => $play->level,
		'game'        => $play->game,
		'item_id'     => $a['item_id'],
		'round_type'  => $a['round_type'],
		'word'        => $a['word'],
		'counted'     => $counted,
		'first_right' => $first_right,
		'tries'       => $tries,
		'glowed'      => $a['glowed'] ? 1 : 0,
		'created'     => h212_kids_now(),
	) );
	$wpdb->query( $wpdb->prepare(
		'UPDATE ' . h212_kids_table( 'plays' ) . ' SET asked = asked + 1, counted = counted + %d, first_right = first_right + %d WHERE id = %d',
		$counted, $first_right, $play->id
	) );
}

function h212_kids_rec_finish( $play, $stars ) {
	global $wpdb;
	if ( $play->finished ) {
		return;
	}
	$wpdb->update( h212_kids_table( 'plays' ), array( 'finished' => h212_kids_now(), 'stars' => (int) $stars ), array( 'id' => $play->id ) );
}

// A child was removed: delete every record of that child.
function h212_kids_forget_child_records( $user_id, $child_id ) {
	global $wpdb;
	foreach ( array( 'plays', 'answers', 'events' ) as $name ) {
		$wpdb->delete( h212_kids_table( $name ), array( 'user_id' => $user_id, 'child_id' => $child_id ) );
	}
}

// A WordPress account was deleted: delete its kids records too.
add_action( 'deleted_user', function ( $user_id ) {
	global $wpdb;
	foreach ( array( 'plays', 'answers', 'events' ) as $name ) {
		$wpdb->delete( h212_kids_table( $name ), array( 'user_id' => (int) $user_id ) );
	}
} );

// Count grown-up logins to 212 Kids: the kids login page, or a Kids Parent logging in anywhere.
add_action( 'wp_login', function ( $login, $user ) {
	if ( ! defined( 'H212_KIDS_LOGIN' ) && ! h212_kids_is_parent_only( $user ) ) {
		return;
	}
	update_user_meta( $user->ID, 'h212_kids_login_count', (int) get_user_meta( $user->ID, 'h212_kids_login_count', true ) + 1 );
	update_user_meta( $user->ID, 'h212_kids_last_login', h212_kids_now() );
	h212_kids_rec_event( $user->ID, '', 'login' );
}, 10, 2 );

// The latest plays of one account's children, for the parents' "How is my child doing?" screen.
function h212_kids_recent_plays( $user_id, $per_child = 15 ) {
	global $wpdb;
	$t    = h212_kids_table( 'plays' );
	$rows = $wpdb->get_results( $wpdb->prepare(
		"SELECT child_id, game, started, finished, counted, first_right, stars FROM $t WHERE user_id = %d ORDER BY started DESC LIMIT 400",
		$user_id
	) );
	$out = array();
	foreach ( (array) $rows as $r ) {
		if ( ! isset( $out[ $r->child_id ] ) ) {
			$out[ $r->child_id ] = array();
		}
		if ( count( $out[ $r->child_id ] ) < $per_child ) {
			$out[ $r->child_id ][] = $r;
		}
	}
	return $out;
}

// ---------- homework (Batch 1C) ----------
// Mike picks one game per level per week (212 Kids > Homework in wp-admin).
// Saved in the option "h212_kids_homework": { "2026-11-02" (that week's Monday): { "prek": "fruits-tap", "k": ... } }.
// A child's homework is DONE when they finish that game during that week (Monday to Sunday, site time).

// The Monday ("Y-m-d") of the week a time falls in (default: now, site time).
function h212_kids_week_start( $timestamp = null ) {
	$t = null === $timestamp ? current_time( 'timestamp' ) : $timestamp;
	return gmdate( 'Y-m-d', strtotime( 'monday this week', $t ) );
}

function h212_kids_homework_all() {
	$all = get_option( 'h212_kids_homework', array() );
	return is_array( $all ) ? $all : array();
}

// The homework game for one level in one week ('' if Mike has not picked one).
function h212_kids_homework_game( $level, $monday = null ) {
	$monday = $monday ? $monday : h212_kids_week_start();
	$all    = h212_kids_homework_all();
	return isset( $all[ $monday ][ (string) $level ] ) ? (string) $all[ $monday ][ (string) $level ] : '';
}

// Saves one week's picks ({ level: game id, ... }; an empty game id = no homework). Keeps the last year only.
function h212_kids_homework_save( $monday, $picks ) {
	$all = h212_kids_homework_all();
	$all[ $monday ] = array_filter( array_map( 'strval', (array) $picks ) );
	if ( ! $all[ $monday ] ) {
		unset( $all[ $monday ] );
	}
	$oldest = gmdate( 'Y-m-d', strtotime( '-53 weeks', current_time( 'timestamp' ) ) );
	foreach ( array_keys( $all ) as $week ) {
		if ( $week < $oldest ) {
			unset( $all[ $week ] );
		}
	}
	ksort( $all );
	update_option( 'h212_kids_homework', $all, false );
}

// When each child finished a game during a week: { "user id:child id": "Y-m-d H:i:s" (first finish) }.
function h212_kids_homework_finishes( $game, $monday, $user_id = 0 ) {
	global $wpdb;
	$t    = h212_kids_table( 'plays' );
	$from = $monday . ' 00:00:00';
	$to   = gmdate( 'Y-m-d', strtotime( $monday . ' +7 days' ) ) . ' 00:00:00';
	$sql  = $wpdb->prepare( "SELECT user_id, child_id, MIN(finished) done FROM $t WHERE game = %s AND finished >= %s AND finished < %s", $game, $from, $to );
	if ( $user_id ) {
		$sql .= $wpdb->prepare( ' AND user_id = %d', $user_id );
	}
	$out = array();
	foreach ( (array) $wpdb->get_results( $sql . ' GROUP BY user_id, child_id' ) as $r ) {
		$out[ $r->user_id . ':' . $r->child_id ] = $r->done;
	}
	return $out;
}
