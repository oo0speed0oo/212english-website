<?php
/**
 * 212 Kids - printable worksheets for grown-ups (K4): Missing Letters, Word Search, Crossword, with answer pages.
 * Address: print.php?set=fruits   (the sets are "worksheets" in games.json)
 * Opened from the Grown-ups screen (behind the parent gate) and from the teacher screen in wp-admin.
 * The sheets are drawn by print.js; every "New puzzle" makes new random puzzles. Nothing is saved.
 */
require __DIR__ . '/inc/auth.php';

$games = h212_kids_games();
$sets  = isset( $games['worksheets'] ) && is_array( $games['worksheets'] ) ? $games['worksheets'] : array();
$set   = isset( $_GET['set'] ) ? sanitize_key( wp_unslash( $_GET['set'] ) ) : '';
if ( ! isset( $sets[ $set ] ) ) {
	$set = (string) key( $sets );
}
if ( '' === $set ) {
	wp_safe_redirect( h212_kids_url() );
	exit;
}

// Send only what the sheets need: the set, its words, and the list of sets (to switch).
$words = array();
foreach ( (array) $sets[ $set ]['words'] as $w ) {
	if ( isset( $games['words'][ $w ] ) ) {
		$words[ $w ] = $games['words'][ $w ];
	}
}
$list = array();
foreach ( $sets as $id => $s ) {
	$list[] = array( 'id' => $id, 'english' => $s['english'], 'japanese' => $s['japanese'] );
}
$h212_kids_print = array(
	'set'   => array( 'id' => $set ) + $sets[ $set ],
	'words' => $words,
	'sets'  => $list,
	'back'  => './',
);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title><?php echo esc_html( $sets[ $set ]['english'] ); ?> worksheets – 212 Kids</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=M+PLUS+Rounded+1c:wght@500;700&display=swap">
<link rel="stylesheet" href="print.css?v=<?php echo h212_kids_asset_v( 'print.css' ); ?>">
</head>
<body>
<div id="kids-print"></div>
<script>window.H212_KIDS_PRINT = <?php echo wp_json_encode( $h212_kids_print ); ?>;</script>
<script src="pictures.js?v=<?php echo h212_kids_asset_v( 'pictures.js' ); ?>"></script>
<script src="puzzles.js?v=<?php echo h212_kids_asset_v( 'puzzles.js' ); ?>"></script>
<script src="print.js?v=<?php echo h212_kids_asset_v( 'print.js' ); ?>"></script>
</body>
</html>
