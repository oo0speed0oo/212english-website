<?php
/**
 * 212 Kids - shown to a logged-in account whose role may not open /kids/ (see H212_KIDS_ROLES in boot.php).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
<link rel="stylesheet" href="<?php echo esc_url( h212_kids_url( 'kids.css?v=' . h212_kids_asset_v( 'kids.css' ) ) ); ?>">
</head>
<body class="k-sky">
<main class="k-center">
	<div class="k-logo"><span>212</span><span class="k-logo-pill">Kids</span></div>
	<img class="k-lion-big" src="<?php echo esc_url( h212_kids_url( 'lion.svg' ) ); ?>" alt="Teacher Mike the lion">
	<h1 class="k-title">Coming soon!</h1>
	<p class="k-sub">もうすぐ はじまるよ！</p>
	<p class="k-gate-note jp">Logged in as <?php echo esc_html( wp_get_current_user()->user_login ); ?></p>
	<a class="k-pill-btn" href="<?php echo esc_url( wp_logout_url( h212_kids_url( 'login.php' ) ) ); ?>">
		<span class="k-two"><b>Grown-ups: use another account</b><small>おとなのかた：べつのアカウントでログイン</small></span>
	</a>
</main>
</body>
</html>
