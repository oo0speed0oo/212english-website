<?php
/**
 * 212 Kids - the whole kids area on one page: "Who is playing?", the menu and the grown-ups screen.
 * The screens are drawn by kids.js; all menu content comes from kids-menu.json.
 */
require __DIR__ . '/inc/auth.php';

$h212_kids_progress = array();
$h212_kids_all      = h212_kids_get_progress( $h212_user->ID );
foreach ( h212_kids_get_children( $h212_user->ID ) as $c ) {
	$h212_kids_progress[ $c['id'] ] = h212_kids_child_progress( $h212_kids_all, $c['id'] );
}
$h212_kids_boot = array(
	'nonce'     => wp_create_nonce( 'h212_kids_children' ),
	'children'  => h212_kids_get_children( $h212_user->ID ),
	'progress'  => (object) $h212_kids_progress,
	'menuUrl'   => 'kids-menu.json?v=' . h212_kids_asset_v( 'kids-menu.json' ),
	'logoutUrl' => wp_logout_url( h212_kids_url( 'login.php' ) ),
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>212 Kids</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=M+PLUS+Rounded+1c:wght@500;700&display=swap">
<link rel="stylesheet" href="kids.css?v=<?php echo h212_kids_asset_v( 'kids.css' ); ?>">
</head>
<body>
<div id="kids-app" aria-live="polite"></div>
<script>window.H212_KIDS = <?php echo wp_json_encode( $h212_kids_boot ); ?>;</script>
<script src="kids.js?v=<?php echo h212_kids_asset_v( 'kids.js' ); ?>"></script>
</body>
</html>
