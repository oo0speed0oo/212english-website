<?php
require_once __DIR__ . '/../wp-load.php';
require_once __DIR__ . '/inc/i18n.php';

if ( is_user_logged_in() && current_user_can( 'student' ) ) {
	wp_safe_redirect( home_url( '/portal/dashboard.php' ) );
	exit;
}

$error = '';
if ( 'POST' === $_SERVER['REQUEST_METHOD'] && ! wp_verify_nonce( $_POST['h212_login_nonce'] ?? '', 'h212_login' ) ) {
	$error = 'DEBUG: nonce check failed (this points to page caching serving a stale form).';
}
if ( 'POST' === $_SERVER['REQUEST_METHOD'] && wp_verify_nonce( $_POST['h212_login_nonce'] ?? '', 'h212_login' ) ) {
	$creds = array(
		'user_login'    => sanitize_text_field( wp_unslash( $_POST['username'] ?? '' ) ),
		'user_password' => $_POST['password'] ?? '',
		'remember'      => true,
	);
	$user = wp_signon( $creds, is_ssl() );

	if ( is_wp_error( $user ) ) {
		$error = t( 'login.error_generic' );
	} elseif ( ! in_array( 'student', (array) $user->roles, true ) ) {
		wp_logout();
		$error = t( 'login.error_role' );
	} else {
		wp_safe_redirect( home_url( '/portal/dashboard.php' ) );
		exit;
	}
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English School – Login</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Serif+JP:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --gold: #b8912e; --gold-light: #8a6a1a; --ink: #2a1f05;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background-color: #f0ead8;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh; display: flex;
    align-items: center; justify-content: center; padding: 1.5rem;
  }
  .card {
    background: rgba(255,252,245,0.85);
    border: 1px solid rgba(184,145,46,0.25);
    border-radius: 20px; padding: 2.5rem 2rem;
    width: 100%; max-width: 400px;
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 60px rgba(120,90,20,0.1), inset 0 1px 0 rgba(255,255,255,0.8);
  }
  .logo-text {
    font-family: 'Playfair Display', serif; font-size: 18px; color: var(--ink);
    margin-bottom: 2rem; text-align: center;
  }
  .logo-text em { color: var(--gold); font-style: italic; }
  h2 { font-family:'Playfair Display',serif; font-size:22px; font-weight:400; color:var(--ink); margin-bottom:6px; }
  .subtitle { font-size:14px; color:rgba(30,20,0,0.55); margin-bottom:1.75rem; }
  .field { margin-bottom:1.1rem; }
  label { display:block; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:rgba(184,145,46,0.8); margin-bottom:6px; }
  input {
    width:100%; padding:10px 13px; font-size:14px; font-family:inherit;
    background:rgba(255,255,255,0.6); border:1px solid rgba(184,145,46,0.3);
    border-radius:8px; color:var(--ink); outline:none;
    transition:border-color 0.15s, box-shadow 0.15s;
  }
  input::placeholder { color:rgba(30,20,0,0.3); }
  input:focus { border-color:rgba(184,145,46,0.6); box-shadow:0 0 0 3px rgba(184,145,46,0.1); }
  .btn {
    width:100%; padding:11px; font-size:14px; font-weight:500; font-family:inherit;
    background:rgba(184,145,46,0.15); color:var(--gold-light);
    border:1px solid rgba(184,145,46,0.5); border-radius:8px;
    cursor:pointer; margin-top:0.4rem; transition:all 0.2s;
  }
  .btn:hover { background:rgba(184,145,46,0.25); border-color:rgba(184,145,46,0.7); color:#4a3500; }
  .error {
    font-size:13px; color:#b3261e;
    background:rgba(179,38,30,0.08); border:1px solid rgba(179,38,30,0.25);
    border-radius:8px; padding:9px 12px; margin-bottom:1rem;
  }
  .lang-switch-wrap { text-align: right; margin-bottom: 0.75rem; }
  .lang-switch {
    font-size: 12px; color: var(--gold-light);
    border: 1px solid rgba(184,145,46,0.3); border-radius: 6px;
    padding: 5px 12px; text-decoration: none; transition: all 0.2s;
  }
  .lang-switch:hover { background: rgba(184,145,46,0.1); border-color: rgba(184,145,46,0.5); }
</style>
</head>
<body>
<div class="card">
  <?php
  $other_lang       = ( 'en' === $GLOBALS['h212_lang'] ) ? 'ja' : 'en';
  $other_lang_label = ( 'en' === $GLOBALS['h212_lang'] ) ? '🇯🇵 日本語' : '🇺🇸 EN';
  ?>
  <div class="lang-switch-wrap">
    <a class="lang-switch" href="<?php echo esc_url( add_query_arg( 'lang', $other_lang ) ); ?>"><?php echo esc_html( $other_lang_label ); ?></a>
  </div>
  <div class="logo-text"><em>212</em> English School</div>
  <h2><?php echo esc_html( t( 'login.welcome' ) ); ?></h2>
  <p class="subtitle"><?php echo esc_html( t( 'login.subtitle' ) ); ?></p>

  <?php if ( $error ) : ?>
    <div class="error"><?php echo esc_html( $error ); ?></div>
  <?php endif; ?>

  <form method="post">
    <?php wp_nonce_field( 'h212_login', 'h212_login_nonce' ); ?>
    <div class="field">
      <label><?php echo esc_html( t( 'login.username' ) ); ?></label>
      <input type="text" name="username" placeholder="<?php echo esc_attr( t( 'login.username_ph' ) ); ?>" autocomplete="username" autofocus />
    </div>
    <div class="field">
      <label><?php echo esc_html( t( 'login.password' ) ); ?></label>
      <input type="password" name="password" placeholder="<?php echo esc_attr( t( 'login.password_ph' ) ); ?>" autocomplete="current-password" />
    </div>
    <button type="submit" class="btn"><?php echo esc_html( t( 'login.button' ) ); ?></button>
  </form>
</div>
</body>
</html>
