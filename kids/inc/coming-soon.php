<?php
/**
 * 212 Kids - shown to everyone who may not open /kids/ yet (see H212_KIDS_WHO in auth.php).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$h212_kids_base = home_url( '/kids/' );
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>212 Kids – Coming soon</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=M+PLUS+Rounded+1c:wght@500;700&display=swap">
<link rel="stylesheet" href="<?php echo esc_url( $h212_kids_base . 'kids.css?v=' . (int) filemtime( __DIR__ . '/../kids.css' ) ); ?>">
</head>
<body class="k-sky">
<main class="k-center">
	<div class="k-logo"><span>212</span><span class="k-logo-pill">Kids</span></div>
	<img class="k-lion-big" src="<?php echo esc_url( $h212_kids_base . 'lion.svg' ); ?>" alt="Teacher Mike the lion">
	<h1 class="k-title">Coming soon!</h1>
	<p class="k-sub">もうすぐ はじまるよ！</p>
	<?php if ( ! is_user_logged_in() ) : ?>
		<a class="k-pill-btn" href="<?php echo esc_url( wp_login_url( $h212_kids_base ) ); ?>">
			<span class="k-two"><b>Grown-ups: log in</b><small>おとなのかた：ログイン</small></span>
		</a>
	<?php else : ?>
		<?php // Logged in, but this account may not open /kids/ yet: offer to switch to another account. ?>
		<p class="k-gate-note jp">Logged in as <?php echo esc_html( wp_get_current_user()->user_login ); ?></p>
		<a class="k-pill-btn" href="<?php echo esc_url( wp_logout_url( wp_login_url( $h212_kids_base ) ) ); ?>">
			<span class="k-two"><b>Grown-ups: use another account</b><small>おとなのかた：べつのアカウントでログイン</small></span>
		</a>
	<?php endif; ?>
</main>
</body>
</html>
