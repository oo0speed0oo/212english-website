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

/*
 * How many questions one play asks: per_play for the child's level (games.json "per_play"),
 * or the round's own per_play. Always 6 to 10, and never more than the pool has.
 * A game with "split": true shares that number across its rounds (e.g. two rounds of 4).
 */
$game      = $games['games'][ $game_id ];
$level     = (string) $child['level'];
$per_level = isset( $games['per_play'][ $level ] ) ? (int) $games['per_play'][ $level ] : 8;
$n_rounds  = max( 1, count( (array) $game['rounds'] ) );

// Send the browser only what this game needs: its rounds with their items and words filled in.
$rounds = array();
foreach ( (array) $game['rounds'] as $round ) {
	// A round can borrow a shared question pool: { "pool": "fruits-what" }.
	if ( isset( $round['pool'] ) && isset( $games['pools'][ $round['pool'] ] ) ) {
		$round = $round + $games['pools'][ $round['pool'] ];
	}
	$items = array();
	foreach ( (array) $round['items'] as $item_id ) {
		if ( ! isset( $games['items'][ $item_id ] ) ) {
			continue;
		}
		$item = $games['items'][ $item_id ];
		// A question can be kept for some levels only: "levels": ["k", "1"]. Default: every level.
		if ( isset( $item['levels'] ) && ! in_array( $level, (array) $item['levels'], true ) ) {
			continue;
		}
		$items[] = array( 'id' => (string) $item_id ) + $item;
	}
	$per_play = isset( $round['per_play'] ) ? (int) $round['per_play'] : $per_level;
	$per_play = max( 6, min( 10, $per_play ) );
	if ( ! empty( $game['split'] ) ) {
		$per_play = (int) ceil( $per_play / $n_rounds );
	}
	$round['items']    = $items;
	$round['per_play'] = min( $per_play, count( $items ) );
	unset( $round['pool'] );
	$rounds[] = $round;
}

$h212_kids_game = array(
	'id'       => $game_id,
	'english'  => $game['english'],
	'japanese' => $game['japanese'],
	'sticker'  => $game['sticker'] ?? '',
	// false turns off the stand-up / sit-down avatar for this game's "Do you like…?" questions.
	'avatar_pose' => $game['avatar_pose'] ?? true,
	'rounds'   => $rounds,
	'words'    => $games['words'],
	'colors'   => $games['colors'] ?? array(),
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
