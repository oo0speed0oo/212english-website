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
// For the parents' "How is my child doing?" screen: each child's latest plays (needs the records in 212-kids.php).
$h212_kids_recent = array();
if ( function_exists( 'h212_kids_recent_plays' ) ) {
	$h212_kids_games = h212_kids_games();
	foreach ( h212_kids_recent_plays( $h212_user->ID ) as $cid => $plays ) {
		foreach ( $plays as $r ) {
			$g     = $h212_kids_games['games'][ $r->game ] ?? array();
			$entry = array(
				'date'     => substr( (string) $r->started, 0, 16 ),
				'english'  => $g['english'] ?? $r->game,
				'japanese' => $g['japanese'] ?? '',
				'done'     => ! empty( $r->finished ),
				'stars'    => (int) $r->stars,
			);
			// Right answers are shown to parents only if H212_KIDS_PARENTS_SEE_RIGHT is switched on (boot.php).
			if ( H212_KIDS_PARENTS_SEE_RIGHT ) {
				$entry['right']   = (int) $r->first_right;
				$entry['counted'] = (int) $r->counted;
			}
			$h212_kids_recent[ $cid ][] = $entry;
		}
	}
}

// This week's homework for each child (Batch 1C, needs 212-kids.php): the game for their level, and DONE if
// they finished it this week (Monday to Sunday).
$h212_kids_homework = array();
if ( function_exists( 'h212_kids_homework_game' ) ) {
	$h212_kids_games = h212_kids_games();
	$h212_kids_week  = h212_kids_week_start();
	$h212_kids_done  = array();
	foreach ( h212_kids_get_children( $h212_user->ID ) as $c ) {
		$gid = h212_kids_homework_game( $c['level'], $h212_kids_week );
		if ( '' === $gid || ! isset( $h212_kids_games['games'][ $gid ] ) ) {
			continue;
		}
		if ( ! isset( $h212_kids_done[ $gid ] ) ) {
			$h212_kids_done[ $gid ] = h212_kids_homework_finishes( $gid, $h212_kids_week, $h212_user->ID );
		}
		$h212_kids_homework[ $c['id'] ] = array(
			'game'     => $gid,
			'english'  => $h212_kids_games['games'][ $gid ]['english'],
			'japanese' => $h212_kids_games['games'][ $gid ]['japanese'],
			'done'     => isset( $h212_kids_done[ $gid ][ $h212_user->ID . ':' . $c['id'] ] ),
		);
	}
}

$h212_kids_boot = array(
	'nonce'     => wp_create_nonce( 'h212_kids_children' ),
	'children'  => h212_kids_get_children( $h212_user->ID ),
	'progress'  => (object) $h212_kids_progress,
	'recent'    => (object) $h212_kids_recent,
	'homework'  => (object) $h212_kids_homework,
	'menuUrl'   => 'kids-menu.json?v=' . h212_kids_asset_v( 'kids-menu.json' ),
	// wp_logout_url() returns "&amp;" for HTML; kids.js escapes the link itself, so give it plain "&".
	'logoutUrl' => html_entity_decode( wp_logout_url( h212_kids_url( 'login.php' ) ) ),
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
<script src="music.js?v=<?php echo h212_kids_asset_v( 'music.js' ); ?>"></script>
<script src="pictures.js?v=<?php echo h212_kids_asset_v( 'pictures.js' ); ?>"></script>
<script src="kids.js?v=<?php echo h212_kids_asset_v( 'kids.js' ); ?>"></script>
</body>
</html>
