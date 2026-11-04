<?php
/**
 * 212 Kids - the teacher screen: wp-admin > 212 English > 212 Kids (Mike only).
 *
 *   This week (default)  one row per child: picked this week, plays, games finished, first-try right %, stars,
 *                        last played. Children who haven't played for 7 days are marked.
 *   Hardest words        which words are missed on the first try most (all children or one level).
 *   Overview             every account, child, stars, stickers and tiles opened.
 *   Child page           the child's plays, DONE games and replays, and the words they miss most.
 *   CSV                  plays or answers, for the chosen filters.
 * Filters: level, family, week (or all time). The records come from 212-kids.php.
 * The child never sees any of this; parents see a short, friendly version in the kids area.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_menu', function () {
	global $admin_page_hooks;
	// Sits under the "212 English" menu (212-teacher-results.php); stands alone if that menu is missing.
	if ( isset( $admin_page_hooks['h212-student-results'] ) ) {
		add_submenu_page( 'h212-student-results', '212 Kids', '212 Kids', 'manage_options', 'h212-kids', 'h212_kids_render_admin_page' );
	} else {
		add_menu_page( '212 Kids', '212 Kids', 'manage_options', 'h212-kids', 'h212_kids_render_admin_page', 'dashicons-smiley', 27 );
	}
}, 20 );

// ---------- shared helpers ----------

function h212_kids_admin_json( $file ) {
	$path = ABSPATH . 'kids/' . $file;
	$data = is_readable( $path ) ? json_decode( (string) file_get_contents( $path ), true ) : null;
	return is_array( $data ) ? $data : array();
}

function h212_kids_admin_menu_titles() {
	$menu   = h212_kids_admin_json( 'kids-menu.json' );
	$names  = array( 'homework' => "Mike's homework" );
	$levels = array();
	foreach ( (array) ( $menu['levels'] ?? array() ) as $lv ) {
		$levels[ (string) $lv['id'] ] = $lv['english'];
		foreach ( (array) ( $lv['months'] ?? array() ) as $m ) {
			foreach ( (array) ( $m['lessons'] ?? array() ) as $l ) {
				$names[ $l['id'] ] = $m['english'] . ' ' . $l['number'] . ': ' . $l['english'];
			}
		}
	}
	foreach ( (array) ( $menu['themes'] ?? array() ) as $t ) {
		foreach ( (array) ( $t['games'] ?? array() ) as $g ) {
			$names[ $g['id'] ] = $t['english'] . ': ' . $g['english'];
		}
	}
	return array( $names, $levels );
}

function h212_kids_admin_game_title( $game_id ) {
	static $games = null;
	if ( null === $games ) {
		$games = h212_kids_admin_json( 'games.json' );
	}
	return $games['games'][ $game_id ]['english'] ?? $game_id;
}

// Every child on every account: [ { uid, family, login, roles, child, progress } ].
function h212_kids_admin_children() {
	$out   = array();
	$users = get_users( array(
		'meta_key'     => 'h212_kids_children',
		'meta_compare' => 'EXISTS',
		'orderby'      => 'display_name',
	) );
	foreach ( $users as $u ) {
		$children = get_user_meta( $u->ID, 'h212_kids_children', true );
		$progress = get_user_meta( $u->ID, 'h212_kids_progress', true );
		foreach ( (array) $children as $c ) {
			if ( ! is_array( $c ) || empty( $c['id'] ) ) {
				continue;
			}
			$out[] = array(
				'uid'      => (int) $u->ID,
				'family'   => $u->display_name,
				'login'    => $u->user_login,
				'roles'    => implode( ', ', array_map( 'ucwords', str_replace( '_', ' ', (array) $u->roles ) ) ),
				'child'    => $c,
				'progress' => is_array( $progress ) && isset( $progress[ $c['id'] ] ) && is_array( $progress[ $c['id'] ] ) ? $progress[ $c['id'] ] : array(),
			);
		}
	}
	return $out;
}

// "3 grown-up logins, last 2026-11-04 09:30"
function h212_kids_admin_logins( $uid, $with_last = false ) {
	$n    = (int) get_user_meta( $uid, 'h212_kids_login_count', true );
	$text = $n . ' grown-up ' . ( 1 === $n ? 'login' : 'logins' );
	if ( $with_last ) {
		$last  = substr( (string) get_user_meta( $uid, 'h212_kids_last_login', true ), 0, 16 );
		$text .= ', last ' . ( $last ? $last : '—' );
	}
	return $text;
}

function h212_kids_admin_dot( $color ) {
	$colors = array( 'pink' => '#FF7DA8', 'blue' => '#4DA3FF', 'green' => '#5CC98B', 'yellow' => '#FFD24D', 'orange' => '#FFB46B', 'purple' => '#C9B8FF' );
	return '<span style="display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;border:2px solid #2B2350;background:' . esc_attr( $colors[ $color ] ?? '#ccc' ) . '"></span>';
}

// The filters from the address: level, family (user id), week (a Monday "Y-m-d", or "all").
function h212_kids_admin_filters() {
	$today  = current_time( 'timestamp' );
	$monday = strtotime( 'monday this week', $today );
	$week   = isset( $_GET['week'] ) ? sanitize_text_field( wp_unslash( $_GET['week'] ) ) : gmdate( 'Y-m-d', $monday );
	if ( 'all' !== $week && ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $week ) ) {
		$week = gmdate( 'Y-m-d', $monday );
	}
	return array(
		'level'  => isset( $_GET['level'] ) ? sanitize_key( wp_unslash( $_GET['level'] ) ) : '',
		'family' => isset( $_GET['family'] ) ? (int) $_GET['family'] : 0,
		'week'   => $week,
		'from'   => 'all' === $week ? null : $week . ' 00:00:00',
		'to'     => 'all' === $week ? null : gmdate( 'Y-m-d', strtotime( $week . ' +7 days' ) ) . ' 00:00:00',
	);
}

// SQL "AND ..." for the filters, on a table with user_id, level and a date column.
function h212_kids_admin_where( $f, $date_col ) {
	global $wpdb;
	$sql = '';
	if ( $f['level'] ) {
		$sql .= $wpdb->prepare( ' AND level = %s', $f['level'] );
	}
	if ( $f['family'] ) {
		$sql .= $wpdb->prepare( ' AND user_id = %d', $f['family'] );
	}
	if ( $f['from'] ) {
		$sql .= $wpdb->prepare( " AND $date_col >= %s AND $date_col < %s", $f['from'], $f['to'] );
	}
	return $sql;
}

function h212_kids_admin_url( $args = array() ) {
	$f    = h212_kids_admin_filters();
	$keep = array_filter( array( 'level' => $f['level'], 'family' => $f['family'] ?: '', 'week' => $f['week'] ) );
	return add_query_arg( array_merge( array( 'page' => 'h212-kids' ), $keep, $args ), admin_url( 'admin.php' ) );
}

// ---------- the page ----------

function h212_kids_render_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( ! function_exists( 'h212_kids_table' ) ) {
		echo '<div class="wrap"><h1>212 Kids</h1><p>The file <code>wp-content/mu-plugins/212-kids.php</code> is missing.</p></div>';
		return;
	}
	$view  = isset( $_GET['view'] ) ? sanitize_key( wp_unslash( $_GET['view'] ) ) : 'week';
	$child = isset( $_GET['child'] ) ? sanitize_text_field( wp_unslash( $_GET['child'] ) ) : '';
	$f     = h212_kids_admin_filters();
	list( , $levels ) = h212_kids_admin_menu_titles();
	$all     = h212_kids_admin_children();
	$parents = get_users( array( 'role' => 'kids_parent', 'fields' => array( 'ID' ) ) );
	?>
	<div class="wrap h212-kids-admin">
		<style>
			.h212-kids-admin .h212-tabs { margin: 14px 0 10px; }
			.h212-kids-admin .h212-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 8px 0 14px; }
			.h212-kids-admin tr.h212-sleepy td { background: #FFF4E5; }
			.h212-kids-admin .h212-sleepy-note { color: #8A4B00; font-weight: 600; }
			.h212-kids-admin .h212-good { color: #1E7B3C; font-weight: 600; }
			.h212-kids-admin table.widefat { max-width: 1200px; }
			.h212-kids-admin .h212-foot { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ddd; max-width: 1200px; }
		</style>
		<h1>212 Kids</h1>
		<p>
			Kids area: <a href="<?php echo esc_url( home_url( '/kids/' ) ); ?>" target="_blank"><?php echo esc_html( home_url( '/kids/' ) ); ?></a>
			&nbsp;·&nbsp; Kids Parent accounts: <strong><?php echo count( $parents ); ?></strong>
			&nbsp;·&nbsp; Children: <strong><?php echo count( $all ); ?></strong>
			&nbsp;·&nbsp; <a href="<?php echo esc_url( admin_url( 'user-new.php' ) ); ?>">Add a parent account</a> (Role: <em>Kids Parent</em>)
			&nbsp;·&nbsp; <a href="<?php echo esc_url( home_url( '/kids/print.php' ) ); ?>" target="_blank">🖨 Printable worksheets</a>
		</p>

		<?php if ( isset( $_GET['hw_saved'] ) ) : ?>
			<div class="notice notice-success"><p>Homework saved.</p></div>
		<?php endif; ?>
		<?php if ( isset( $_GET['purged'] ) ) : ?>
			<div class="notice notice-success"><p>Deleted <?php echo (int) $_GET['purged']; ?> records older than 12 months.</p></div>
		<?php endif; ?>

		<?php if ( $child ) : ?>
			<?php h212_kids_admin_child_page( $child, $all, $levels ); ?>
		<?php else : ?>
			<h2 class="nav-tab-wrapper h212-tabs">
				<?php foreach ( array( 'week' => 'This week', 'homework' => 'Homework', 'words' => 'Hardest words', 'overview' => 'Overview' ) as $k => $label ) : ?>
					<a class="nav-tab<?php echo $view === $k ? ' nav-tab-active' : ''; ?>" href="<?php echo esc_url( h212_kids_admin_url( array( 'view' => $k ) ) ); ?>"><?php echo esc_html( $label ); ?></a>
				<?php endforeach; ?>
			</h2>
			<?php
			if ( 'overview' !== $view && 'homework' !== $view ) {
				h212_kids_admin_filter_form( $view, $f, $levels, $all );
			}
			if ( 'homework' === $view ) {
				h212_kids_admin_homework( $all, $levels );
			} elseif ( 'words' === $view ) {
				h212_kids_admin_words( $f, $levels );
			} elseif ( 'overview' === $view ) {
				h212_kids_admin_overview( $all, $levels );
			} else {
				h212_kids_admin_week( $f, $all, $levels );
			}
			?>
		<?php endif; ?>

		<div class="h212-foot">
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('Delete all kids records (plays, answers, logins) older than 12 months? This cannot be undone. Stars and stickers stay.');">
				<input type="hidden" name="action" value="h212_kids_purge">
				<?php wp_nonce_field( 'h212_kids_purge' ); ?>
				<button class="button">Delete records older than 12 months</button>
				<span class="description">&nbsp; Stars and stickers stay. A removed child's records are deleted straight away.</span>
			</form>
		</div>
	</div>
	<?php
}

function h212_kids_admin_filter_form( $view, $f, $levels, $all ) {
	$families = array();
	foreach ( $all as $row ) {
		$families[ $row['uid'] ] = $row['family'];
	}
	$monday = strtotime( 'monday this week', current_time( 'timestamp' ) );
	$csv    = wp_nonce_url( add_query_arg( array(
		'action' => 'h212_kids_csv',
		'level'  => $f['level'],
		'family' => $f['family'],
		'week'   => $f['week'],
	), admin_url( 'admin-post.php' ) ), 'h212_kids_csv' );
	?>
	<form class="h212-filters" method="get" action="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>">
		<input type="hidden" name="page" value="h212-kids">
		<input type="hidden" name="view" value="<?php echo esc_attr( $view ); ?>">
		<select name="week">
			<?php for ( $i = 0; $i < 12; $i++ ) : ?>
				<?php $m = gmdate( 'Y-m-d', strtotime( "-$i weeks", $monday ) ); ?>
				<option value="<?php echo esc_attr( $m ); ?>" <?php selected( $f['week'], $m ); ?>>
					<?php echo esc_html( 0 === $i ? 'This week' : ( 1 === $i ? 'Last week' : 'Week of' ) ); ?> (<?php echo esc_html( gmdate( 'M j', strtotime( $m ) ) ); ?>)
				</option>
			<?php endfor; ?>
			<option value="all" <?php selected( $f['week'], 'all' ); ?>>All time</option>
		</select>
		<select name="level">
			<option value="">All levels</option>
			<?php foreach ( $levels as $id => $name ) : ?>
				<option value="<?php echo esc_attr( $id ); ?>" <?php selected( $f['level'], (string) $id ); ?>><?php echo esc_html( $name ); ?></option>
			<?php endforeach; ?>
		</select>
		<select name="family">
			<option value="">All families</option>
			<?php foreach ( $families as $uid => $name ) : ?>
				<option value="<?php echo (int) $uid; ?>" <?php selected( $f['family'], $uid ); ?>><?php echo esc_html( $name ); ?></option>
			<?php endforeach; ?>
		</select>
		<button class="button button-primary">Show</button>
		&nbsp; Download:
		<a class="button" href="<?php echo esc_url( add_query_arg( 'type', 'plays', $csv ) ); ?>">Plays (CSV)</a>
		<a class="button" href="<?php echo esc_url( add_query_arg( 'type', 'answers', $csv ) ); ?>">Answers (CSV)</a>
	</form>
	<?php
}

// ---------- This week ----------

function h212_kids_admin_week( $f, $all, $levels ) {
	global $wpdb;
	$plays  = h212_kids_table( 'plays' );
	$events = h212_kids_table( 'events' );
	$key    = function ( $uid, $cid ) {
		return $uid . ':' . $cid;
	};

	$week_plays = array();
	foreach ( (array) $wpdb->get_results( "SELECT user_id, child_id, COUNT(*) plays, SUM(finished IS NOT NULL) finished, SUM(counted) counted, SUM(first_right) first_right FROM $plays WHERE 1=1" . h212_kids_admin_where( $f, 'started' ) . ' GROUP BY user_id, child_id' ) as $r ) {
		$week_plays[ $key( $r->user_id, $r->child_id ) ] = $r;
	}
	$f_no_level = array( 'level' => '' ) + $f;
	$week_picks = array();
	foreach ( (array) $wpdb->get_results( "SELECT user_id, child_id, COUNT(*) n, MAX(created) last FROM $events WHERE kind = 'pick'" . h212_kids_admin_where( $f_no_level, 'created' ) . ' GROUP BY user_id, child_id' ) as $r ) {
		$week_picks[ $key( $r->user_id, $r->child_id ) ] = $r;
	}
	$last_played = array();
	foreach ( (array) $wpdb->get_results( "SELECT user_id, child_id, MAX(started) last FROM $plays GROUP BY user_id, child_id" ) as $r ) {
		$last_played[ $key( $r->user_id, $r->child_id ) ] = $r->last;
	}
	$sleepy_since = gmdate( 'Y-m-d H:i:s', current_time( 'timestamp' ) - 7 * DAY_IN_SECONDS );
	$rows         = array_filter( $all, function ( $row ) use ( $f ) {
		return ( ! $f['level'] || (string) $row['child']['level'] === $f['level'] ) && ( ! $f['family'] || $row['uid'] === $f['family'] );
	} );
	?>
	<?php if ( ! $rows ) : ?>
		<p><em>No children match.</em></p>
		<?php return; ?>
	<?php endif; ?>
	<table class="widefat striped">
		<thead>
			<tr>
				<th>Child</th>
				<th>Family</th>
				<th>Level</th>
				<th>Picked to play<br><span class="description">(the child's "login")</span></th>
				<th>Plays</th>
				<th>Games finished</th>
				<th>Right on the first try</th>
				<th>Stars</th>
				<th>Last played</th>
			</tr>
		</thead>
		<tbody>
		<?php foreach ( $rows as $row ) : ?>
			<?php
			$k      = $key( $row['uid'], $row['child']['id'] );
			$wp     = $week_plays[ $k ] ?? null;
			$pick   = $week_picks[ $k ] ?? null;
			$last   = $last_played[ $k ] ?? '';
			$sleepy = ! $last || $last < $sleepy_since;
			$link   = h212_kids_admin_url( array( 'child' => $k ) );
			?>
			<tr class="<?php echo $sleepy ? 'h212-sleepy' : ''; ?>">
				<td>
					<?php echo h212_kids_admin_dot( $row['child']['color'] ); ?>
					<a href="<?php echo esc_url( $link ); ?>"><strong><?php echo esc_html( $row['child']['name'] ); ?></strong></a>
					<?php if ( $sleepy ) : ?>
						<br><span class="h212-sleepy-note">😴 <?php echo $last ? 'Not played for 7+ days' : 'Never played'; ?></span>
					<?php endif; ?>
				</td>
				<td><?php echo esc_html( $row['family'] ); ?><br><span class="description"><?php echo esc_html( h212_kids_admin_logins( $row['uid'] ) ); ?></span></td>
				<td><?php echo esc_html( $levels[ (string) $row['child']['level'] ] ?? $row['child']['level'] ); ?></td>
				<td><?php echo $pick ? '<span class="h212-good">Yes</span> × ' . (int) $pick->n . '<br><span class="description">' . esc_html( substr( $pick->last, 0, 16 ) ) . '</span>' : 'No'; ?></td>
				<td><?php echo $wp ? (int) $wp->plays : 0; ?></td>
				<td><?php echo $wp ? (int) $wp->finished : 0; ?></td>
				<td>
					<?php if ( $wp && (int) $wp->counted > 0 ) : ?>
						<strong><?php echo (int) round( 100 * $wp->first_right / $wp->counted ); ?>%</strong>
						<span class="description">(<?php echo (int) $wp->first_right; ?> of <?php echo (int) $wp->counted; ?>)</span>
					<?php else : ?>
						<span class="description">—</span>
					<?php endif; ?>
				</td>
				<td><?php echo (int) ( $row['progress']['stars'] ?? 0 ); ?> ⭐</td>
				<td><?php echo $last ? esc_html( substr( $last, 0, 16 ) ) : '<span class="description">—</span>'; ?></td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>
	<p class="description">"Right on the first try" leaves out opinion questions ("Do you like…?"). Click a child's name for their plays and the words they miss most.</p>
	<?php
}

// ---------- Homework (Batch 1C) ----------

function h212_kids_admin_homework( $all, $levels ) {
	$this_week = h212_kids_week_start();
	$week      = isset( $_GET['hw_week'] ) ? sanitize_text_field( wp_unslash( $_GET['hw_week'] ) ) : $this_week;
	if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $week ) ) {
		$week = $this_week;
	}
	$week     = h212_kids_week_start( strtotime( $week ) );
	$todo     = ! empty( $_GET['todo'] );
	$games    = h212_kids_admin_json( 'games.json' );
	$picks    = h212_kids_homework_all()[ $week ] ?? array();
	$base     = array( 'page' => 'h212-kids', 'view' => 'homework', 'hw_week' => $week );
	$sunday   = gmdate( 'M j', strtotime( $week . ' +6 days' ) );
	?>
	<form class="h212-filters" method="get" action="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>">
		<input type="hidden" name="page" value="h212-kids">
		<input type="hidden" name="view" value="homework">
		<select name="hw_week" onchange="this.form.submit()">
			<?php for ( $i = 2; $i >= -8; $i-- ) : ?>
				<?php $m = gmdate( 'Y-m-d', strtotime( ( $i >= 0 ? '+' : '' ) . $i . ' weeks', strtotime( $this_week ) ) ); ?>
				<option value="<?php echo esc_attr( $m ); ?>" <?php selected( $week, $m ); ?>>
					<?php echo esc_html( 0 === $i ? 'This week' : ( 1 === $i ? 'Next week' : ( -1 === $i ? 'Last week' : 'Week of' ) ) ); ?> (<?php echo esc_html( gmdate( 'M j', strtotime( $m ) ) ); ?>)
				</option>
			<?php endfor; ?>
		</select>
		<noscript><button class="button">Show</button></noscript>
	</form>

	<h3>1. Pick the homework for <?php echo esc_html( gmdate( 'M j', strtotime( $week ) ) . ' – ' . $sunday ); ?></h3>
	<p class="description">One game per level. The child's "Mike's homework" button opens it. It is done when the child finishes that game this week (Monday to Sunday).</p>
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<input type="hidden" name="action" value="h212_kids_homework">
		<input type="hidden" name="week" value="<?php echo esc_attr( $week ); ?>">
		<?php wp_nonce_field( 'h212_kids_homework' ); ?>
		<table class="form-table" role="presentation" style="max-width:700px">
			<?php foreach ( $levels as $lid => $lname ) : ?>
				<tr>
					<th scope="row"><label for="hw-<?php echo esc_attr( $lid ); ?>"><?php echo esc_html( $lname ); ?></label></th>
					<td>
						<select id="hw-<?php echo esc_attr( $lid ); ?>" name="hw[<?php echo esc_attr( $lid ); ?>]">
							<option value="">— No homework —</option>
							<?php foreach ( (array) ( $games['games'] ?? array() ) as $gid => $g ) : ?>
								<option value="<?php echo esc_attr( $gid ); ?>" <?php selected( $picks[ $lid ] ?? '', $gid ); ?>><?php echo esc_html( $g['english'] . ' (' . $g['japanese'] . ')' ); ?></option>
							<?php endforeach; ?>
						</select>
					</td>
				</tr>
			<?php endforeach; ?>
		</table>
		<button class="button button-primary">Save homework</button>
	</form>

	<h3 style="margin-top:28px">2. Who has done it?</h3>
	<?php if ( ! $picks ) : ?>
		<p><em>No homework picked for this week yet.</em></p>
		<?php return; ?>
	<?php endif; ?>
	<?php
	$finishes = array();
	foreach ( array_unique( array_values( $picks ) ) as $gid ) {
		$finishes[ $gid ] = h212_kids_homework_finishes( $gid, $week );
	}
	$rows    = array();
	$missing = array();
	$count   = array();
	foreach ( $all as $row ) {
		$lid = (string) $row['child']['level'];
		if ( empty( $picks[ $lid ] ) ) {
			continue;
		}
		$k    = $row['uid'] . ':' . $row['child']['id'];
		$done = $finishes[ $picks[ $lid ] ][ $k ] ?? '';
		$count[ $lid ] = $count[ $lid ] ?? array( 0, 0 );
		$count[ $lid ][1]++;
		if ( $done ) {
			$count[ $lid ][0]++;
		} else {
			$u         = get_userdata( $row['uid'] );
			$missing[] = $row['child']['name'] . ' (' . $row['family'] . ( $u ? ', ' . $u->user_email : '' ) . ') – ' . ( $levels[ $lid ] ?? $lid );
		}
		if ( ! $todo || ! $done ) {
			$rows[] = array( $row, $lid, $done, $k );
		}
	}
	// Pre-K first, then K, Grade 1 ...; in each level, who has not done it first.
	$order = array_flip( array_map( 'strval', array_keys( $levels ) ) );
	usort( $rows, function ( $a, $b ) use ( $order ) {
		return array( $order[ $a[1] ] ?? 99, $a[2] ? 1 : 0, $a[0]['child']['name'] ) <=> array( $order[ $b[1] ] ?? 99, $b[2] ? 1 : 0, $b[0]['child']['name'] );
	} );
	uksort( $count, function ( $a, $b ) use ( $order ) {
		return ( $order[ (string) $a ] ?? 99 ) <=> ( $order[ (string) $b ] ?? 99 );
	} );
	?>
	<p>
		<?php foreach ( $count as $lid => $c ) : ?>
			<strong><?php echo esc_html( $levels[ $lid ] ?? $lid ); ?>:</strong> <?php echo (int) $c[0]; ?> of <?php echo (int) $c[1]; ?> done &nbsp;·&nbsp;
		<?php endforeach; ?>
		<?php if ( $todo ) : ?>
			<a class="button" href="<?php echo esc_url( add_query_arg( $base, admin_url( 'admin.php' ) ) ); ?>">Show everyone</a>
		<?php else : ?>
			<a class="button button-primary" href="<?php echo esc_url( add_query_arg( $base + array( 'todo' => 1 ), admin_url( 'admin.php' ) ) ); ?>">Show only who has NOT done it (<?php echo count( $missing ); ?>)</a>
		<?php endif; ?>
	</p>
	<?php if ( ! $count ) : ?>
		<p><em>No children in the levels that have homework.</em></p>
		<?php return; ?>
	<?php endif; ?>
	<table class="widefat striped">
		<thead><tr><th>Child</th><th>Family</th><th>Level</th><th>Homework</th><th>Done?</th></tr></thead>
		<tbody>
		<?php foreach ( $rows as list( $row, $lid, $done, $k ) ) : ?>
			<?php $u = get_userdata( $row['uid'] ); ?>
			<tr class="<?php echo $done ? '' : 'h212-sleepy'; ?>">
				<td><?php echo h212_kids_admin_dot( $row['child']['color'] ); ?> <a href="<?php echo esc_url( h212_kids_admin_url( array( 'child' => $k ) ) ); ?>"><strong><?php echo esc_html( $row['child']['name'] ); ?></strong></a></td>
				<td><?php echo esc_html( $row['family'] ); ?><?php if ( $u ) : ?><br><a href="mailto:<?php echo esc_attr( $u->user_email ); ?>"><?php echo esc_html( $u->user_email ); ?></a><?php endif; ?></td>
				<td><?php echo esc_html( $levels[ $lid ] ?? $lid ); ?></td>
				<td><?php echo esc_html( h212_kids_admin_game_title( $picks[ $lid ] ) ); ?></td>
				<td><?php echo $done ? '<span class="h212-good">✓ Done</span><br><span class="description">' . esc_html( substr( $done, 0, 16 ) ) . '</span>' : '<span class="h212-sleepy-note">✗ Not yet</span>'; ?></td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>
	<?php if ( $missing ) : ?>
		<p style="margin-top:16px"><strong>Not done yet</strong> <span class="description">(click the box, then copy)</span></p>
		<textarea readonly rows="<?php echo min( 12, count( $missing ) + 1 ); ?>" style="width:100%;max-width:700px" onclick="this.select()"><?php echo esc_textarea( implode( "\n", $missing ) ); ?></textarea>
	<?php endif; ?>
	<?php
}

add_action( 'admin_post_h212_kids_homework', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Not allowed.' );
	}
	check_admin_referer( 'h212_kids_homework' );
	$week  = h212_kids_week_start( strtotime( sanitize_text_field( wp_unslash( $_POST['week'] ?? '' ) ) ) ?: null );
	$games = h212_kids_admin_json( 'games.json' );
	list( , $levels ) = h212_kids_admin_menu_titles();
	$picks = array();
	foreach ( (array) ( $_POST['hw'] ?? array() ) as $lid => $gid ) {
		$lid = sanitize_key( $lid );
		$gid = (string) wp_unslash( $gid );
		if ( isset( $levels[ $lid ] ) && isset( $games['games'][ $gid ] ) ) {
			$picks[ $lid ] = $gid;
		}
	}
	h212_kids_homework_save( $week, $picks );
	wp_safe_redirect( add_query_arg( array( 'page' => 'h212-kids', 'view' => 'homework', 'hw_week' => $week, 'hw_saved' => 1 ), admin_url( 'admin.php' ) ) );
	exit;
} );

// ---------- Hardest words ----------

function h212_kids_admin_words( $f, $levels ) {
	global $wpdb;
	$answers = h212_kids_table( 'answers' );
	$rows    = $wpdb->get_results( "SELECT word, COUNT(*) attempts, SUM(first_right = 0) missed, COUNT(DISTINCT user_id, child_id) children,
		SUM(first_right = 0 AND glowed = 1) glowed
		FROM $answers WHERE counted = 1 AND word <> ''" . h212_kids_admin_where( $f, 'created' ) . '
		GROUP BY word ORDER BY (SUM(first_right = 0) / COUNT(*)) DESC, attempts DESC LIMIT 40' );
	?>
	<?php if ( ! $rows ) : ?>
		<p><em>No answers yet for these filters.</em></p>
		<?php return; ?>
	<?php endif; ?>
	<table class="widefat striped" style="max-width:800px">
		<thead><tr><th>Word</th><th>Answered</th><th>Missed on the first try</th><th>Needed the glow</th><th>Children</th></tr></thead>
		<tbody>
		<?php foreach ( $rows as $r ) : ?>
			<tr>
				<td><strong><?php echo esc_html( $r->word ); ?></strong></td>
				<td><?php echo (int) $r->attempts; ?></td>
				<td><strong><?php echo (int) round( 100 * $r->missed / max( 1, $r->attempts ) ); ?>%</strong> <span class="description">(<?php echo (int) $r->missed; ?>)</span></td>
				<td><?php echo (int) $r->glowed; ?></td>
				<td><?php echo (int) $r->children; ?></td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>
	<p class="description">Words at the top are the ones to reteach. Opinion questions are not counted.</p>
	<?php
}

// ---------- Child page ----------

function h212_kids_admin_child_page( $key, $all, $levels ) {
	global $wpdb;
	list( $uid, $cid ) = array_pad( explode( ':', $key, 2 ), 2, '' );
	$uid = (int) $uid;
	$row = null;
	foreach ( $all as $r ) {
		if ( $r['uid'] === $uid && $r['child']['id'] === $cid ) {
			$row = $r;
		}
	}
	echo '<p><a href="' . esc_url( remove_query_arg( 'child', h212_kids_admin_url() ) ) . '">← Back</a></p>';
	if ( ! $row ) {
		echo '<p><em>That child was not found (maybe removed).</em></p>';
		return;
	}
	$plays   = h212_kids_table( 'plays' );
	$answers = h212_kids_table( 'answers' );
	$p       = $row['progress'];
	$list    = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $plays WHERE user_id = %d AND child_id = %s ORDER BY started DESC LIMIT 60", $uid, $cid ) );
	$games   = $wpdb->get_results( $wpdb->prepare( "SELECT game, COUNT(*) plays, SUM(finished IS NOT NULL) finished, MIN(finished) first_done FROM $plays WHERE user_id = %d AND child_id = %s GROUP BY game ORDER BY game", $uid, $cid ) );
	$missed  = $wpdb->get_results( $wpdb->prepare( "SELECT word, COUNT(*) attempts, SUM(first_right = 0) missed FROM $answers WHERE user_id = %d AND child_id = %s AND counted = 1 AND word <> '' GROUP BY word HAVING missed > 0 ORDER BY missed DESC, attempts DESC LIMIT 10", $uid, $cid ) );
	?>
	<h2><?php echo h212_kids_admin_dot( $row['child']['color'] ); ?> <?php echo esc_html( $row['child']['name'] ); ?>
		<span class="description" style="font-size:14px;font-weight:400">
			&nbsp;<?php echo esc_html( $levels[ (string) $row['child']['level'] ] ?? $row['child']['level'] ); ?>
			· family: <?php echo esc_html( $row['family'] ); ?> (<?php echo esc_html( $row['login'] ); ?>)
			· <?php echo esc_html( h212_kids_admin_logins( $uid, true ) ); ?>
		</span>
	</h2>
	<p><strong><?php echo (int) ( $p['stars'] ?? 0 ); ?> ⭐</strong>
		<?php if ( ! empty( $p['stickers'] ) ) : ?>&nbsp;· Stickers: <?php echo esc_html( implode( ', ', (array) $p['stickers'] ) ); ?><?php endif; ?>
	</p>

	<h3>Games</h3>
	<?php if ( ! $games ) : ?>
		<p><em>No games played yet.</em></p>
	<?php else : ?>
		<table class="widefat striped" style="max-width:800px">
			<thead><tr><th>Game</th><th>DONE</th><th>Started</th><th>Finished</th><th>Replays</th></tr></thead>
			<tbody>
			<?php foreach ( $games as $g ) : ?>
				<tr>
					<td><?php echo esc_html( h212_kids_admin_game_title( $g->game ) ); ?></td>
					<td><?php echo (int) $g->finished > 0 ? '<span class="h212-good">✓ ' . esc_html( substr( $g->first_done, 0, 10 ) ) . '</span>' : '—'; ?></td>
					<td><?php echo (int) $g->plays; ?></td>
					<td><?php echo (int) $g->finished; ?></td>
					<td><?php echo max( 0, (int) $g->finished - 1 ); ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
	<?php endif; ?>

	<h3>Words missed most (first try)</h3>
	<?php if ( ! $missed ) : ?>
		<p><em>None yet.</em></p>
	<?php else : ?>
		<p><?php foreach ( $missed as $m ) : ?>
			<span style="display:inline-block;margin:0 6px 6px 0;padding:3px 10px;border:1px solid #ccc;border-radius:12px;background:#fff">
				<strong><?php echo esc_html( $m->word ); ?></strong> <?php echo (int) $m->missed; ?> of <?php echo (int) $m->attempts; ?>
			</span>
		<?php endforeach; ?></p>
	<?php endif; ?>

	<h3>Plays (latest 60)</h3>
	<?php if ( ! $list ) : ?>
		<p><em>None yet.</em></p>
	<?php else : ?>
		<table class="widefat striped" style="max-width:800px">
			<thead><tr><th>Date</th><th>Game</th><th>Finished</th><th>Right on the first try</th><th>Stars</th></tr></thead>
			<tbody>
			<?php foreach ( $list as $pl ) : ?>
				<tr>
					<td><?php echo esc_html( substr( $pl->started, 0, 16 ) ); ?></td>
					<td><?php echo esc_html( h212_kids_admin_game_title( $pl->game ) ); ?></td>
					<td><?php echo $pl->finished ? '✓' : '<span class="description">stopped</span>'; ?></td>
					<td><?php echo (int) $pl->counted > 0 ? (int) $pl->first_right . ' of ' . (int) $pl->counted : '<span class="description">— (opinion only)</span>'; ?></td>
					<td><?php echo (int) $pl->stars; ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
	<?php endif; ?>
	<?php
}

// ---------- Overview (every account, stars, stickers, tiles opened) ----------

function h212_kids_admin_overview( $all, $levels ) {
	list( $tiles ) = h212_kids_admin_menu_titles();
	?>
	<?php if ( ! $all ) : ?>
		<p><em>No children added yet.</em></p>
		<?php return; ?>
	<?php endif; ?>
	<p class="description">Who can open /kids/ is set in <code>kids/inc/boot.php</code> (H212_KIDS_ROLES). Every finished game gives 3 stars and its sticker; "Opened" counts every tile a child opens.</p>
	<table class="widefat striped">
		<thead><tr><th>Account</th><th>Child</th><th>Level</th><th>Stars</th><th>Opened</th><th>Last played</th></tr></thead>
		<tbody>
		<?php $prev = 0; ?>
		<?php foreach ( $all as $row ) : ?>
			<?php
			$p      = $row['progress'];
			$played = isset( $p['played'] ) && is_array( $p['played'] ) ? $p['played'] : array();
			arsort( $played );
			?>
			<tr>
				<td>
					<?php if ( $prev !== $row['uid'] ) : ?>
						<a href="<?php echo esc_url( get_edit_user_link( $row['uid'] ) ); ?>"><strong><?php echo esc_html( $row['family'] ); ?></strong></a><br>
						<span class="description"><?php echo esc_html( $row['login'] . ' · ' . $row['roles'] ); ?></span><br>
						<span class="description"><?php echo esc_html( h212_kids_admin_logins( $row['uid'], true ) ); ?></span>
					<?php endif; ?>
				</td>
				<td><?php echo h212_kids_admin_dot( $row['child']['color'] ); ?> <a href="<?php echo esc_url( h212_kids_admin_url( array( 'child' => $row['uid'] . ':' . $row['child']['id'] ) ) ); ?>"><strong><?php echo esc_html( $row['child']['name'] ); ?></strong></a></td>
				<td><?php echo esc_html( $levels[ (string) $row['child']['level'] ] ?? $row['child']['level'] ); ?></td>
				<td>
					<?php echo (int) ( $p['stars'] ?? 0 ); ?> ⭐
					<?php if ( ! empty( $p['stickers'] ) ) : ?>
						<br><span class="description">Stickers: <?php echo esc_html( implode( ', ', (array) $p['stickers'] ) ); ?></span>
					<?php endif; ?>
				</td>
				<td>
					<?php if ( ! $played ) : ?>
						<span class="description">Nothing yet</span>
					<?php else : ?>
						<?php $times = (int) array_sum( $played ); ?>
						<strong><?php echo $times; ?></strong> <?php echo 1 === $times ? 'time' : 'times'; ?>
						<details><summary>Show</summary>
							<?php foreach ( $played as $tile => $n ) : ?>
								<?php echo esc_html( $tiles[ $tile ] ?? $tile ); ?> × <?php echo (int) $n; ?><br>
							<?php endforeach; ?>
						</details>
					<?php endif; ?>
				</td>
				<td><?php echo ! empty( $p['last'] ) ? esc_html( $p['last'] ) : '<span class="description">—</span>'; ?></td>
			</tr>
			<?php $prev = $row['uid']; ?>
		<?php endforeach; ?>
		</tbody>
	</table>
	<?php
}

// ---------- CSV download ----------

add_action( 'admin_post_h212_kids_csv', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Not allowed.' );
	}
	check_admin_referer( 'h212_kids_csv' );
	global $wpdb;
	$type  = isset( $_GET['type'] ) && 'answers' === $_GET['type'] ? 'answers' : 'plays';
	$f     = h212_kids_admin_filters();
	$names = array();
	foreach ( h212_kids_admin_children() as $row ) {
		$names[ $row['uid'] . ':' . $row['child']['id'] ] = array( $row['family'], $row['child']['name'] );
	}
	if ( 'answers' === $type ) {
		$rows   = $wpdb->get_results( 'SELECT * FROM ' . h212_kids_table( 'answers' ) . ' WHERE 1=1' . h212_kids_admin_where( $f, 'created' ) . ' ORDER BY created' );
		$header = array( 'date', 'family', 'child', 'level', 'game', 'question id', 'round type', 'word', 'counted (0 = opinion)', 'right on first try', 'tries', 'needed the glow' );
	} else {
		$rows   = $wpdb->get_results( 'SELECT * FROM ' . h212_kids_table( 'plays' ) . ' WHERE 1=1' . h212_kids_admin_where( $f, 'started' ) . ' ORDER BY started' );
		$header = array( 'started', 'finished', 'family', 'child', 'level', 'game', 'questions', 'counted (not opinion)', 'right on first try', 'stars' );
	}
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="212-kids-' . $type . '-' . $f['week'] . '.csv"' );
	$out = fopen( 'php://output', 'w' );
	fwrite( $out, "\xEF\xBB\xBF" ); // so Excel shows Japanese nicknames correctly
	fputcsv( $out, $header );
	// A cell starting with = + - @ could run as a formula in Excel: start it with ' instead.
	$safe = function ( $v ) {
		$v = (string) $v;
		return preg_match( '/^[=+\-@]/', $v ) ? "'" . $v : $v;
	};
	foreach ( (array) $rows as $r ) {
		list( $family, $child ) = $names[ $r->user_id . ':' . $r->child_id ] ?? array( '#' . $r->user_id, $r->child_id );
		if ( 'answers' === $type ) {
			$line = array( $r->created, $family, $child, $r->level, $r->game, $r->item_id, $r->round_type, $r->word, $r->counted, $r->first_right, $r->tries, $r->glowed );
		} else {
			$line = array( $r->started, $r->finished, $family, $child, $r->level, $r->game, $r->asked, $r->counted, $r->first_right, $r->stars );
		}
		fputcsv( $out, array_map( $safe, $line ) );
	}
	fclose( $out );
	exit;
} );

// ---------- delete records older than 12 months ----------

add_action( 'admin_post_h212_kids_purge', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Not allowed.' );
	}
	check_admin_referer( 'h212_kids_purge' );
	global $wpdb;
	$before = gmdate( 'Y-m-d H:i:s', strtotime( '-12 months', current_time( 'timestamp' ) ) );
	$n      = 0;
	$n     += (int) $wpdb->query( $wpdb->prepare( 'DELETE FROM ' . h212_kids_table( 'answers' ) . ' WHERE created < %s', $before ) );
	$n     += (int) $wpdb->query( $wpdb->prepare( 'DELETE FROM ' . h212_kids_table( 'plays' ) . ' WHERE started < %s', $before ) );
	$n     += (int) $wpdb->query( $wpdb->prepare( 'DELETE FROM ' . h212_kids_table( 'events' ) . ' WHERE created < %s', $before ) );
	wp_safe_redirect( admin_url( 'admin.php?page=h212-kids&purged=' . $n ) );
	exit;
} );
