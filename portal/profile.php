<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – My Profile</title>
<link rel="stylesheet" href="components/base.css">
<style>
  .profile-card { background:rgba(255,252,245,0.6); border:1px solid rgba(184,145,46,0.2); border-radius:16px; padding:32px; max-width:620px; }
  .avatar-row { display:flex; align-items:center; gap:20px; margin-bottom:32px; padding-bottom:24px; border-bottom:1px solid rgba(184,145,46,0.15); }
  .avatar-big { width:72px; height:72px; border-radius:50%; background:rgba(184,145,46,0.15); border:2px solid rgba(184,145,46,0.35); display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:500; color:var(--gold-light); flex-shrink:0; }
  .avatar-info h3 { font-size:18px; font-weight:500; color:var(--warm-white); margin-bottom:4px; }
  .avatar-info p  { font-size:13px; color:var(--text-muted); }
  .save-success {
    font-size:13px; color:#2f7a4f; background:rgba(47,122,79,0.08);
    border:1px solid rgba(47,122,79,0.3); border-radius:8px;
    padding:9px 12px; margin-bottom:1rem;
  }
</style>
</head>
<body>
<?php
require __DIR__ . '/inc/nav.php';
h212_render_nav( 'profile' );

$success = false;
if ( 'POST' === $_SERVER['REQUEST_METHOD']
	&& wp_verify_nonce( $_POST['h212_profile_nonce'] ?? '', 'h212_profile_' . $h212_user->ID ) ) {

	wp_update_user( array(
		'ID'         => $h212_user->ID,
		'first_name' => sanitize_text_field( wp_unslash( $_POST['fn'] ?? '' ) ),
		'last_name'  => sanitize_text_field( wp_unslash( $_POST['ln'] ?? '' ) ),
	) );
	update_user_meta( $h212_user->ID, 'h212_birthday', sanitize_text_field( wp_unslash( $_POST['bd'] ?? '' ) ) );
	update_user_meta( $h212_user->ID, 'h212_location', sanitize_text_field( wp_unslash( $_POST['loc'] ?? '' ) ) );

	$h212_user = get_userdata( $h212_user->ID );
	$success   = true;
}

$first    = get_user_meta( $h212_user->ID, 'first_name', true );
$last     = get_user_meta( $h212_user->ID, 'last_name', true );
$birthday = get_user_meta( $h212_user->ID, 'h212_birthday', true );
$location = get_user_meta( $h212_user->ID, 'h212_location', true );

$initials = strtoupper( substr( $first, 0, 1 ) . substr( $last, 0, 1 ) );
if ( '' === $initials ) {
	$initials = '?';
}
$fullname = trim( $first . ' ' . $last );
if ( '' === $fullname ) {
	$fullname = $h212_user->display_name;
}
?>
<div class="section-header"><h2><?php echo esc_html( t( 'nav.profile' ) ); ?></h2><p><?php echo esc_html( t( 'profile.subtitle' ) ); ?></p></div>

<?php if ( $success ) : ?>
  <div class="save-success"><?php echo esc_html( t( 'profile.updated' ) ); ?></div>
<?php endif; ?>

<div class="profile-card">
  <div class="avatar-row">
    <div class="avatar-big"><?php echo esc_html( $initials ); ?></div>
    <div class="avatar-info">
      <h3><?php echo esc_html( $fullname ); ?></h3>
      <p><?php echo esc_html( t( 'profile.school_role' ) ); ?></p>
    </div>
  </div>

  <form method="post">
    <?php wp_nonce_field( 'h212_profile_' . $h212_user->ID, 'h212_profile_nonce' ); ?>
    <div class="form-grid">
      <div class="form-group">
        <label><?php echo esc_html( t( 'profile.first_name' ) ); ?></label>
        <input type="text" name="fn" value="<?php echo esc_attr( $first ); ?>" placeholder="e.g. Miho" />
      </div>
      <div class="form-group">
        <label><?php echo esc_html( t( 'profile.last_name' ) ); ?></label>
        <input type="text" name="ln" value="<?php echo esc_attr( $last ); ?>" placeholder="e.g. Iwasaki" />
      </div>
      <div class="form-group">
        <label><?php echo esc_html( t( 'profile.birthday' ) ); ?></label>
        <input type="date" name="bd" value="<?php echo esc_attr( $birthday ); ?>" />
      </div>
      <div class="form-group full">
        <label><?php echo esc_html( t( 'profile.location' ) ); ?></label>
        <input type="text" name="loc" value="<?php echo esc_attr( $location ); ?>" placeholder="e.g. Tokyo" />
      </div>
    </div>
    <button type="submit" class="save-btn"><?php echo esc_html( t( 'profile.save' ) ); ?></button>
  </form>
</div>
</main>
</div>
</body>
</html>
