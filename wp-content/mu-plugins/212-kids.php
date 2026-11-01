<?php
/**
 * 212 Kids - the WordPress side of the kids area (/kids/).
 *
 * - Adds the "Kids Parent" role: make one in wp-admin > Users > Add New, Role "Kids Parent".
 *   Kids Parents can open /kids/ only (not the adult portal, not wp-admin).
 * - Adds wp-admin > 212 English > 212 Kids: every account's children and their progress.
 *
 * What is saved (user meta on the grown-up's account, nothing else about a child):
 *   h212_kids_children  list of { id, name (nickname), color, level }
 *   h212_kids_progress  { child id: { stars, played: { tile id: times }, best: { game id: stars }, stickers, last } }
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

// ---------- wp-admin > 212 English > 212 Kids ----------

add_action( 'admin_menu', function () {
	global $admin_page_hooks;
	// Sits under the "212 English" menu (212-teacher-results.php); stands alone if that menu is missing.
	if ( isset( $admin_page_hooks['h212-student-results'] ) ) {
		add_submenu_page( 'h212-student-results', '212 Kids', '212 Kids', 'manage_options', 'h212-kids', 'h212_kids_render_admin_page' );
	} else {
		add_menu_page( '212 Kids', '212 Kids', 'manage_options', 'h212-kids', 'h212_kids_render_admin_page', 'dashicons-smiley', 27 );
	}
}, 20 );

function h212_kids_admin_menu_titles() {
	$file  = ABSPATH . 'kids/kids-menu.json';
	$menu  = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null;
	$names = array( 'homework' => "Mike's homework" );
	$levels = array();
	if ( is_array( $menu ) ) {
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
	}
	return array( $names, $levels );
}

function h212_kids_render_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	list( $tiles, $levels ) = h212_kids_admin_menu_titles();
	$colors = array( 'pink' => '#FF7DA8', 'blue' => '#4DA3FF', 'green' => '#5CC98B', 'yellow' => '#FFD24D', 'orange' => '#FFB46B', 'purple' => '#C9B8FF' );

	$users = get_users( array(
		'meta_key'     => 'h212_kids_children',
		'meta_compare' => 'EXISTS',
		'orderby'      => 'display_name',
	) );
	$parents = get_users( array( 'role' => 'kids_parent', 'fields' => array( 'ID' ) ) );
	?>
	<div class="wrap">
		<h1>212 Kids</h1>
		<p>
			Kids area: <a href="<?php echo esc_url( home_url( '/kids/' ) ); ?>" target="_blank"><?php echo esc_html( home_url( '/kids/' ) ); ?></a>
			&nbsp;·&nbsp; Kids Parent accounts: <strong><?php echo count( $parents ); ?></strong>
			&nbsp;·&nbsp; <a href="<?php echo esc_url( admin_url( 'user-new.php' ) ); ?>">Add a parent account</a> (Role: <em>Kids Parent</em>)
		</p>
		<p class="description">Who can open /kids/ is set in <code>kids/inc/boot.php</code> (H212_KIDS_ROLES). Every finished game gives 3 stars and its sticker; "Played" counts every tile a child opens.</p>

		<?php if ( ! $users ) : ?>
			<p><em>No children added yet.</em></p>
		<?php else : ?>
		<table class="widefat striped" style="max-width:1200px">
			<thead>
				<tr>
					<th>Account</th>
					<th>Child</th>
					<th>Level</th>
					<th>Stars</th>
					<th>Played</th>
					<th>Last played</th>
				</tr>
			</thead>
			<tbody>
			<?php
			foreach ( $users as $u ) :
				$children = get_user_meta( $u->ID, 'h212_kids_children', true );
				$progress = get_user_meta( $u->ID, 'h212_kids_progress', true );
				$children = is_array( $children ) ? $children : array();
				$progress = is_array( $progress ) ? $progress : array();
				$role     = implode( ', ', array_map( 'ucwords', str_replace( '_', ' ', (array) $u->roles ) ) );
				$first    = true;
				if ( ! $children ) {
					continue;
				}
				foreach ( $children as $c ) :
					$p      = isset( $progress[ $c['id'] ] ) && is_array( $progress[ $c['id'] ] ) ? $progress[ $c['id'] ] : array();
					$played = isset( $p['played'] ) && is_array( $p['played'] ) ? $p['played'] : array();
					arsort( $played );
					?>
					<tr>
						<td>
							<?php if ( $first ) : ?>
								<a href="<?php echo esc_url( get_edit_user_link( $u->ID ) ); ?>"><strong><?php echo esc_html( $u->display_name ); ?></strong></a><br>
								<span class="description"><?php echo esc_html( $u->user_login . ' · ' . $role ); ?></span>
							<?php endif; ?>
						</td>
						<td>
							<span style="display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;border:2px solid #2B2350;background:<?php echo esc_attr( $colors[ $c['color'] ] ?? '#ccc' ); ?>"></span>
							<strong><?php echo esc_html( $c['name'] ); ?></strong>
						</td>
						<td><?php echo esc_html( $levels[ (string) $c['level'] ] ?? $c['level'] ); ?></td>
						<td>
							<?php echo (int) ( $p['stars'] ?? 0 ); ?> ⭐
							<?php $stickers = isset( $p['stickers'] ) && is_array( $p['stickers'] ) ? $p['stickers'] : array(); ?>
							<?php if ( $stickers ) : ?>
								<br><span class="description">Stickers: <?php echo esc_html( implode( ', ', $stickers ) ); ?></span>
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
					<?php
					$first = false;
				endforeach;
			endforeach;
			?>
			</tbody>
		</table>
		<?php endif; ?>
	</div>
	<?php
}
