<?php
/**
 * 212 Kids - grown-ups log in here (Kids Parent, student or admin accounts; see H212_KIDS_ROLES).
 */
require_once __DIR__ . '/inc/boot.php';

if ( h212_kids_can_open() ) {
	wp_safe_redirect( h212_kids_url() );
	exit;
}

$error = '';
if ( 'POST' === $_SERVER['REQUEST_METHOD'] ) {
	if ( ! wp_verify_nonce( $_POST['h212_kids_login_nonce'] ?? '', 'h212_kids_login' ) ) {
		$error = 'Please try again. もういちど おためしください。';
	} else {
		$user = wp_signon( array(
			'user_login'    => sanitize_text_field( wp_unslash( $_POST['username'] ?? '' ) ),
			'user_password' => $_POST['password'] ?? '',
			'remember'      => true,
		), is_ssl() );

		if ( is_wp_error( $user ) ) {
			$error = 'Wrong username or password. ユーザー名かパスワードがちがいます。';
		} elseif ( ! h212_kids_can_open( $user ) ) {
			wp_logout();
			$error = 'This account can\'t open 212 Kids yet. このアカウントでは まだ つかえません。';
		} else {
			wp_safe_redirect( h212_kids_url() );
			exit;
		}
	}
}
$username = isset( $_POST['username'] ) ? sanitize_text_field( wp_unslash( $_POST['username'] ) ) : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>212 Kids – Log in</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=M+PLUS+Rounded+1c:wght@500;700&display=swap">
<link rel="stylesheet" href="kids.css?v=<?php echo h212_kids_asset_v( 'kids.css' ); ?>">
</head>
<body class="k-sky">
<main class="k-center">
	<div class="k-logo"><span>212</span><span class="k-logo-pill">Kids</span></div>
	<form class="k-sheet k-login" method="post" action="">
		<img class="k-login-lion" src="lion.svg" alt="Teacher Mike the lion">
		<h1 class="k-title">Grown-ups</h1>
		<p class="k-sub">おとなのかた：ログイン</p>
		<?php wp_nonce_field( 'h212_kids_login', 'h212_kids_login_nonce' ); ?>
		<div class="k-field">
			<label class="k-field-label" for="k-user">Username <small>ユーザー名</small></label>
			<input class="k-input" id="k-user" name="username" autocomplete="username" autocapitalize="none" required value="<?php echo esc_attr( $username ); ?>">
		</div>
		<div class="k-field">
			<label class="k-field-label" for="k-pass">Password <small>パスワード</small></label>
			<input class="k-input" id="k-pass" name="password" type="password" autocomplete="current-password" required>
		</div>
		<p class="k-error" role="alert"><?php echo esc_html( $error ); ?></p>
		<div class="k-sheet-btns">
			<button type="submit" class="k-big-btn k-green k-press"><span class="k-two"><b>Log in</b><small>ログイン</small></span></button>
		</div>
		<p class="k-gate-note"><a href="<?php echo esc_url( wp_lostpassword_url( h212_kids_url( 'login.php' ) ) ); ?>">Forgot password? パスワードをわすれた</a></p>
	</form>
</main>
</body>
</html>
