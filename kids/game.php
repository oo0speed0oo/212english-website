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
 * or the round's own per_play (1 to 10). Never more than the pool has.
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
		// Counting: numbers bigger than this level counts to are skipped ("count_max": Pre-K 5, K 7 ...).
		if ( 'count' === $item['type'] && isset( $games['count_max'][ $level ] ) && (int) $item['count'] > (int) $games['count_max'][ $level ] ) {
			continue;
		}
		$items[] = array( 'id' => (string) $item_id ) + $item;
	}
	// A round's own per_play may be smaller (word games: 5, or 2 puzzles); the level's per_play is 6 to 10.
	$per_play = isset( $round['per_play'] ) ? max( 1, min( 10, (int) $round['per_play'] ) ) : max( 6, min( 10, $per_level ) );
	if ( ! empty( $game['split'] ) ) {
		$per_play = (int) ceil( $per_play / $n_rounds );
	}
	$round['items']    = $items;
	$round['per_play'] = min( $per_play, count( $items ) );
	unset( $round['pool'] );
	$rounds[] = $round;
}

/*
 * ABC phonics (sounds, listen, blend, letter bubbles): the letters, key words and sound files of Mike's phonics
 * order, read from the adult phonics files (portal/phonics/phonics-sounds.csv, portal/audio/phonics/).
 * Only what this game uses is sent; a file that is missing makes the game use the browser voice instead.
 */
$phonics = null;
$need_sounds = array();
$need_words  = array();
foreach ( $rounds as $round ) {
	foreach ( $round['items'] as $item ) {
		foreach ( (array) ( $item['sounds'] ?? array() ) as $no ) {
			$need_sounds[] = (int) $no;
		}
		if ( isset( $item['sound'] ) ) {
			$need_sounds[] = (int) $item['sound'];
		}
		if ( 'blend' === $item['type'] ) {
			$need_words[] = (string) $item['word'];
			foreach ( (array) $item['tiles'] as $t ) {
				$need_sounds[] = (int) $t[1];
			}
		}
	}
}
if ( $need_sounds || $need_words ) {
	$portal = dirname( __DIR__ ) . '/portal';
	$letters = array();
	$csv = $portal . '/phonics/phonics-sounds.csv';
	if ( is_readable( $csv ) && ( $h = fopen( $csv, 'r' ) ) ) {
		fgetcsv( $h );
		while ( ( $r = fgetcsv( $h ) ) !== false ) {
			if ( isset( $r[2] ) && (int) $r[0] > 0 ) {
				$letters[ (int) $r[0] ] = array( trim( $r[1] ), trim( explode( '/', $r[2] )[0] ) );
			}
		}
		fclose( $h );
	}
	$audio   = $portal . '/audio/phonics/';
	$phonics = array(
		'base'   => '../portal/audio/phonics/',
		'v'      => is_dir( $audio ) ? (int) filemtime( $audio ) : 0,
		'sounds' => array(),
		'words'  => array(),
	);
	foreach ( array_unique( $need_sounds ) as $no ) {
		$phonics['sounds'][ $no ] = array(
			'letter' => $letters[ $no ][0] ?? '',
			'key'    => $letters[ $no ][1] ?? '',
			'file'   => is_file( $audio . 'sounds/' . $no . '.m4a' ),
			'alone'  => is_file( $audio . 'alone/' . $no . '.m4a' ),
		);
	}
	foreach ( array_unique( $need_words ) as $w ) {
		if ( preg_match( '/^[a-z-]+$/', $w ) && is_file( $audio . 'words/' . $w . '.m4a' ) ) {
			$phonics['words'][ $w ] = true;
		}
	}
	$phonics['sounds'] = (object) $phonics['sounds'];
	$phonics['words']  = (object) $phonics['words'];
}

/*
 * Voices: audio/voices.json says which recorded file (Kokoro now, Mike's own later) says which line:
 * { "lion": { "great job": "ui_praise_1", ... }, "girl": { ... } }. game.js plays the file and uses the
 * browser voice only for a line that has no file. Made by _work/kids/audio/kids-voices/build_voice_list.py.
 */
$voices  = array();
$voice_v = 0;
$vfile   = __DIR__ . '/audio/voices.json';
if ( is_readable( $vfile ) ) {
	$voices  = json_decode( (string) file_get_contents( $vfile ), true );
	$voices  = is_array( $voices ) ? $voices : array();
	$voice_v = (int) filemtime( $vfile );
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
	// Pizza Shop, for this child's level: toppings the shopkeeper sees, toppings one customer orders.
	'pizza'    => array(
		'choices' => (int) ( $games['pizza']['choices'][ $level ] ?? 3 ),
		'order'   => (int) ( $games['pizza']['order'][ $level ] ?? 1 ),
	),
	// Memory cards for this level: picture-picture or picture-word (a game's own card_type wins).
	'memory_cards' => (string) ( $games['memory_cards'][ $level ] ?? 'picture-picture' ),
	'voices'   => (object) $voices,
	'voice_v'  => $voice_v,
	// Freeze Dance, for this child's level: how many fruit dance, and how long each dance lasts.
	'freeze'   => array(
		'dancers' => (int) ( $games['freeze']['dancers'][ $level ] ?? 3 ),
		'seconds' => $games['freeze']['dance_seconds'] ?? array( 5, 9 ),
	),
	// Board games (memory, bubble, match, sort, hidden, elf, wish, present): how big a board is for this child's level.
	// read_choices: 1 = the lion reads the written answers aloud (Pick the answer, Pass the Present) for this level.
	'boards'   => array_map(
		function ( $by_level ) use ( $level ) {
			return (int) ( is_array( $by_level ) ? ( $by_level[ $level ] ?? 0 ) : $by_level );
		},
		(array) ( $games['boards'] ?? array() )
	),
	'phonics'  => $phonics,
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
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="robots" content="noindex">
<title><?php echo esc_html( $game['english'] ); ?> – 212 Kids</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=M+PLUS+Rounded+1c:wght@500;700&display=swap">
<link rel="stylesheet" href="kids.css?v=<?php echo h212_kids_asset_v( 'kids.css' ); ?>">
</head>
<body class="k-sky">
<div id="kids-game" aria-live="polite"></div>
<script>window.H212_KIDS_GAME = <?php echo wp_json_encode( $h212_kids_game ); ?>;</script>
<script src="music.js?v=<?php echo h212_kids_asset_v( 'music.js' ); ?>"></script>
<script src="pictures.js?v=<?php echo h212_kids_asset_v( 'pictures.js' ); ?>"></script>
<script src="puzzles.js?v=<?php echo h212_kids_asset_v( 'puzzles.js' ); ?>"></script>
<script src="game.js?v=<?php echo h212_kids_asset_v( 'game.js' ); ?>"></script>
</body>
</html>
