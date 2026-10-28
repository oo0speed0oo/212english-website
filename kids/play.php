<?php
/**
 * ==========================  TEMPORARY - FOR TESTING ONLY  ==========================
 * Every menu tile opens this page until its real game exists.
 * /kids/ is admin-only while this page is used, so children never see it.
 * DELETE this file (and the link to it in kids.js: TEMP_PLAY_PAGE) when the games are built.
 * =====================================================================================
 */
require __DIR__ . '/inc/auth.php';

// Where "Back" returns to: a menu address inside the kids app only (letters, numbers, / and -).
$from = isset( $_GET['from'] ) ? (string) wp_unslash( $_GET['from'] ) : '';
if ( ! preg_match( '#^/[a-z0-9/_-]{0,80}$#', $from ) ) {
	$from = '/';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>212 Kids – Coming soon</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=M+PLUS+Rounded+1c:wght@500;700&display=swap">
<link rel="stylesheet" href="kids.css?v=<?php echo (int) filemtime( __DIR__ . '/kids.css' ); ?>">
</head>
<body class="k-sky">
<main class="k-center">
	<img class="k-lion-big" src="lion.svg" alt="Teacher Mike the lion">
	<h1 class="k-title">This game is being made!</h1>
	<p class="k-sub">このゲームは いま つくっているよ！</p>
	<a class="k-big-btn k-green" href="./#<?php echo esc_attr( $from ); ?>">
		<svg width="30" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M22 3 L3 15 L22 27Z" fill="#2B2350" stroke="#2B2350" stroke-width="4" stroke-linejoin="round"/></svg>
		<span class="k-two"><b>Back</b><small>もどる</small></span>
	</a>
</main>
</body>
</html>
