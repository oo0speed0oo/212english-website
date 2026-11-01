<?php
/**
 * 212 Kids - plays one game from games.json for one child.
 * Address: game.php?g=GAME ID&c=CHILD ID&from=MENU ADDRESS
 * The game itself is drawn by game.js.
 */
require __DIR__ . '/inc/auth.php';

$game_id  = isset( $_GET['g'] ) ? (string) wp_unslash( $_GET['g'] ) : '';
$child_id = isset( $_GET['c'] ) ? sanitize_key( wp_unslash( $_GET['c'] ) ) : '';
$from     = isset( $_GET['from'] ) ? (string) wp_unslash( $_GET['from'] ) : '';
if ( ! preg_match( '#^/[a-z0-9/_-]{0,80}$#', $from ) ) {
	$from = '/';
}

$games = h212_kids_games();
$child = h212_kids_find_child( $h212_user->ID, $child_id );
if ( ! $child || ! isset( $games['games'][ $game_id ] ) ) {
	wp_safe_redirect( h212_kids_url() );
	exit;
}

// Send the browser only what this game needs: its rounds with their items and words filled in.
$game   = $games['games'][ $game_id ];
$rounds = array();
foreach ( (array) $game['rounds'] as $round ) {
	$items = array();
	foreach ( (array) $round['items'] as $item_id ) {
		if ( isset( $games['items'][ $item_id ] ) ) {
			$items[] = array( 'id' => (string) $item_id ) + $games['items'][ $item_id ];
		}
	}
	$round['items'] = $items;
	$rounds[]       = $round;
}

$h212_kids_game = array(
	'id'       => $game_id,
	'english'  => $game['english'],
	'japanese' => $game['japanese'],
	'sticker'  => $game['sticker'] ?? '',
	'rounds'   => $rounds,
	'words'    => $games['words'],
	'answers'  => $games['answers'],
	'praise'   => $games['praise'],
	'child'    => $child,
	'nonce'    => wp_create_nonce( 'h212_kids_children' ),
	'back'     => './#' . $from,
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title><?php echo esc_html( $game['english'] ); ?> – 212 Kids</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=M+PLUS+Rounded+1c:wght@500;700&display=swap">
<link rel="stylesheet" href="kids.css?v=<?php echo h212_kids_asset_v( 'kids.css' ); ?>">
</head>
<body class="k-sky">
<div id="kids-game" aria-live="polite"></div>
<script>window.H212_KIDS_GAME = <?php echo wp_json_encode( $h212_kids_game ); ?>;</script>
<script src="game.js?v=<?php echo h212_kids_asset_v( 'game.js' ); ?>"></script>
</body>
</html>
