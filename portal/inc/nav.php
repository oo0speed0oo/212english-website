<?php
/**
 * Renders the top nav + sidebar and opens the <main id="page-content"> wrapper.
 * Every page that includes this must close with </main></div> before </body>.
 * Requires auth.php to have run first ($h212_user must be set).
 */

function h212_render_nav( $active ) {
	global $h212_user;

	$first = get_user_meta( $h212_user->ID, 'first_name', true );
	$last  = get_user_meta( $h212_user->ID, 'last_name', true );
	$full  = trim( $first . ' ' . $last );
	if ( '' === $full ) {
		$full = $h212_user->display_name;
	}
	$initials = strtoupper( substr( $first, 0, 1 ) . substr( $last, 0, 1 ) );
	if ( '' === $initials ) {
		$initials = '?';
	}

	$pages = array(
		array( 'id' => 'home',     'icon' => '🏠', 'label' => t( 'nav.dashboard' ), 'href' => 'dashboard.php', 'group' => t( 'nav.group_menu' ) ),
		array( 'id' => 'profile',  'icon' => '👤', 'label' => t( 'nav.profile' ),   'href' => 'profile.php',   'group' => t( 'nav.group_menu' ) ),
		array( 'id' => 'homework', 'icon' => '📚', 'label' => t( 'nav.homework' ),  'href' => 'homework.php',  'group' => t( 'nav.group_study' ) ),
		array( 'id' => 'tests',    'icon' => '📝', 'label' => t( 'nav.tests' ),     'href' => 'tests.php',     'group' => t( 'nav.group_study' ) ),
		array( 'id' => 'videos',   'icon' => '🎬', 'label' => t( 'nav.videos' ),    'href' => 'videos.php',    'group' => t( 'nav.group_study' ) ),
		array( 'id' => 'grades',   'icon' => '📊', 'label' => t( 'nav.grades' ),    'href' => 'grades.php',    'group' => t( 'nav.group_study' ) ),
	);
	$other_lang        = ( 'en' === $GLOBALS['h212_lang'] ) ? 'ja' : 'en';
	$other_lang_label  = ( 'en' === $GLOBALS['h212_lang'] ) ? '🇯🇵 日本語' : '🇺🇸 EN';
	$current_url      = esc_url( add_query_arg( 'lang', $other_lang ) );
	?>
	<nav class="topnav">
		<div class="nav-logo"><em>212</em> English School</div>
		<div class="nav-right">
			<a class="lang-switch" href="<?php echo $current_url; ?>"><?php echo esc_html( $other_lang_label ); ?></a>
			<a class="nav-student" href="profile.php">
				<div class="nav-avatar"><?php echo esc_html( $initials ); ?></div>
				<span class="nav-name"><?php echo esc_html( $full ); ?></span>
			</a>
			<a class="logout-btn" href="logout.php"><?php echo esc_html( t( 'nav.logout' ) ); ?></a>
		</div>
	</nav>

	<div class="main">
		<aside class="sidebar">
			<?php
			$last_group = '';
			foreach ( $pages as $p ) {
				if ( $p['group'] !== $last_group ) {
					$last_group = $p['group'];
					echo '<span class="sidebar-label">' . esc_html( $p['group'] ) . '</span>';
				}
				$cls = ( $p['id'] === $active ) ? 'sidebar-item active' : 'sidebar-item';
				echo '<a class="' . esc_attr( $cls ) . '" href="' . esc_url( $p['href'] ) . '">'
					. '<span class="sidebar-icon">' . $p['icon'] . '</span> ' . esc_html( $p['label'] )
					. '</a>';
			}
			?>
		</aside>
		<main class="content" id="page-content">
	<?php
}
