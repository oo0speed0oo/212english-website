<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Dashboard</title>
<link rel="stylesheet" href="components/base.css">
<style>
  .welcome-banner { margin-bottom:32px; padding-bottom:24px; border-bottom:1px solid rgba(184,145,46,0.15); }
  .welcome-banner h1 { font-family:'Playfair Display',serif; font-size:28px; font-weight:400; color:var(--warm-white); margin-bottom:6px; }
  .welcome-banner h1 em { color:var(--gold); font-style:italic; }
  .welcome-banner p { font-size:14px; color:var(--text-muted); }
  .dash-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; }
  .dash-card { background:rgba(255,252,245,0.6); border:1px solid rgba(184,145,46,0.2); border-radius:14px; padding:24px 20px; cursor:pointer; transition:all 0.3s; text-align:left; text-decoration:none; display:block; }
  .dash-card:hover { background:rgba(255,252,245,0.9); border-color:rgba(184,145,46,0.45); transform:translateY(-3px); box-shadow:0 12px 40px rgba(120,90,20,0.12); }
  .dash-card-icon  { font-size:28px; margin-bottom:14px; }
  .dash-card-title { font-size:16px; font-weight:500; color:var(--warm-white); margin-bottom:4px; }
  .dash-card-sub   { font-size:12px; color:var(--text-muted); }
  .dash-card-badge { display:inline-block; margin-top:12px; font-size:11px; padding:3px 10px; border-radius:100px; background:rgba(184,145,46,0.12); color:var(--gold-light); border:1px solid rgba(184,145,46,0.25); }
</style>
</head>
<body>
<?php
require __DIR__ . '/inc/nav.php';
h212_render_nav( 'home' );

$first = get_user_meta( $h212_user->ID, 'first_name', true );
if ( '' === $first ) {
	$first = 'Student';
}
?>
<div class="welcome-banner">
  <h1><?php echo esc_html( t( 'dash.welcome' ) ); ?> <em><?php echo esc_html( $first ); ?></em> 👋</h1>
  <p><?php echo esc_html( t( 'dash.subtitle' ) ); ?></p>
</div>
<div class="dash-grid">
  <a class="dash-card" href="homework.php"><div class="dash-card-icon">📚</div><div class="dash-card-title"><?php echo esc_html( t( 'nav.homework' ) ); ?></div><div class="dash-card-sub"><?php echo esc_html( t( 'dash.homework_sub' ) ); ?></div><div class="dash-card-badge"><?php echo esc_html( t( 'dash.start_study' ) ); ?></div></a>
  <a class="dash-card" href="tests.php"><div class="dash-card-icon">📝</div><div class="dash-card-title"><?php echo esc_html( t( 'nav.tests' ) ); ?></div><div class="dash-card-sub"><?php echo esc_html( t( 'dash.homework_sub' ) ); ?></div><div class="dash-card-badge"><?php echo esc_html( t( 'dash.start_study' ) ); ?></div></a>
  <a class="dash-card" href="videos.php"><div class="dash-card-icon">🎬</div><div class="dash-card-title"><?php echo esc_html( t( 'nav.videos' ) ); ?></div><div class="dash-card-sub"><?php echo esc_html( t( 'dash.videos_sub' ) ); ?></div><div class="dash-card-badge"><?php echo esc_html( t( 'dash.start_watch' ) ); ?></div></a>
  <a class="dash-card" href="grades.php"><div class="dash-card-icon">📊</div><div class="dash-card-title"><?php echo esc_html( t( 'nav.grades' ) ); ?></div><div class="dash-card-sub"><?php echo esc_html( t( 'dash.grades_sub' ) ); ?></div><div class="dash-card-badge"><?php echo esc_html( t( 'dash.coming_soon' ) ); ?></div></a>
</div>
</main>
</div>
</body>
</html>
