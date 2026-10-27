<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en" data-theme="<?php echo esc_attr( h212_current_theme() ); ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Dashboard</title>
<link rel="stylesheet" href="components/base.css?v=<?php echo (int) filemtime( __DIR__ . '/components/base.css' ); ?>">
</head>
<body>
<?php
require __DIR__ . '/inc/nav.php';
require __DIR__ . '/inc/mike.php';
h212_render_nav( 'home' );

$first = get_user_meta( $h212_user->ID, 'first_name', true );
if ( '' === $first ) {
	$first = 'Student';
}

// Where the student is: the furthest open chapter that has questions.
// (All the progress rules live in wp-content/mu-plugins/212-progress.php.)
$state = function_exists( 'h212_progress_state' ) ? h212_progress_state( $h212_user->ID, true ) : array( 'chapters' => array() );
$cur   = null;
foreach ( $state['chapters'] as $key => $ch ) {
	if ( $ch['u'] && $ch['t'] > 0 ) {
		list( $l, $c ) = array_map( 'intval', explode( '-', $key ) );
		$cur = array( 'level' => $l, 'chapter' => $c, 'total' => $ch['t'], 'finished' => $ch['f'], 'parts' => $ch['parts'] );
	}
}
// Next part to work on = first part (in on-screen order) that has questions and isn't finished.
$next_part = '';
if ( $cur ) {
	foreach ( h212_all_parts() as $part ) {
		$p = isset( $cur['parts'][ $part ] ) ? $cur['parts'][ $part ] : array( 'total' => 0, 'finished' => 0 );
		if ( $p['total'] > 0 && $p['finished'] < $p['total'] ) {
			$next_part = $part;
			break;
		}
	}
}
$pct = $cur ? (int) floor( $cur['finished'] * 100 / $cur['total'] ) : 0;

function h212_fill( $text, $vars ) {
	foreach ( $vars as $k => $v ) {
		$text = str_replace( '{' . $k . '}', $v, $text );
	}
	return $text;
}
$part_name_cur = $next_part ? t( 'hw.part_' . $next_part ) : '';
$part_name_alt = $next_part ? t_other( 'hw.part_' . $next_part ) : '';
if ( ! $cur ) {
	$cur = array( 'level' => 1, 'chapter' => 1 );
}
if ( $next_part && $pct > 0 ) {
	$greet_key = 'dash.greet_back';
} elseif ( $next_part ) {
	$greet_key = 'dash.greet_new';
} else {
	$greet_key = 'dash.greet_done';
}
$vars_cur = array( 'name' => $first, 'n' => $cur['chapter'], 'pct' => $pct, 'part' => $part_name_cur );
$vars_alt = array( 'name' => $first, 'n' => $cur['chapter'], 'pct' => $pct, 'part' => $part_name_alt );
?>
<div class="hero">
  <div class="hero-mike"><?php echo h212_mike_svg( 120, 'talking' ); // phpcs:ignore ?></div>
  <div class="hero-text">
    <div class="hero-kicker"><?php echo esc_html( t( 'dash.teacher' ) ); ?></div>
    <div class="hero-line" id="mike-line"><?php echo esc_html( h212_fill( t( $greet_key ), $vars_cur ) ); ?></div>
    <div class="hero-line-ja"><?php echo esc_html( h212_fill( t_other( $greet_key ), $vars_alt ) ); ?></div>
  </div>
</div>

<a class="continue-card" href="homework.php?level=<?php echo (int) $cur['level']; ?>&amp;chapter=<?php echo (int) $cur['chapter']; ?>">
  <div class="ring" style="background: conic-gradient(var(--gold) 0 <?php echo (int) $pct; ?>%, var(--sand) <?php echo (int) $pct; ?>% 100%)"><div class="ring-inner"><?php echo (int) $pct; ?>%</div></div>
  <div class="continue-text">
    <div class="continue-kicker"><?php echo esc_html( t( 'dash.continue' ) ); ?> · <?php echo esc_html( t( 'hw.level' ) ); ?> <?php echo (int) $cur['level']; ?></div>
    <div class="continue-title"><?php echo esc_html( t( 'hw.chapter' ) ); ?> <?php echo (int) $cur['chapter']; ?></div>
    <div class="continue-next"><?php echo esc_html( $next_part ? h212_fill( t( 'dash.next_part' ), array( 'part' => $part_name_cur ) ) : t( 'dash.all_done' ) ); ?></div>
  </div>
  <svg class="continue-arrow" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
</a>

<div class="dash-label"><?php echo esc_html( t( 'dash.your_study' ) ); ?></div>
<div class="dash-grid">
  <a class="dash-card dash-homework" href="homework.php">
    <div class="dash-card-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h11a3 3 0 013 3v11H7a3 3 0 01-3-3z"></path><path d="M8 9h6M8 13h4"></path></svg></div>
    <div class="dash-card-title"><?php echo esc_html( t( 'nav.homework' ) ); ?></div>
    <div class="dash-card-sub"><?php echo esc_html( t_other( 'nav.homework' ) . ' · ' . t( 'dash.homework_sub' ) ); ?></div>
  </a>
  <a class="dash-card dash-tests" href="tests.php">
    <div class="dash-card-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2.5"></rect><path d="M9 4V3h6v1M9 11l2 2 4-4M9 17h6"></path></svg></div>
    <div class="dash-card-title"><?php echo esc_html( t( 'nav.tests' ) ); ?></div>
    <div class="dash-card-sub"><?php echo esc_html( t_other( 'nav.tests' ) . ' · ' . t( 'dash.tests_sub' ) ); ?></div>
  </a>
  <a class="dash-card dash-grades" href="grades.php">
    <div class="dash-card-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V10M12 20V4M19 20v-7"></path></svg></div>
    <div class="dash-card-title"><?php echo esc_html( t( 'nav.grades' ) ); ?></div>
    <div class="dash-card-sub"><?php echo esc_html( t_other( 'nav.grades' ) . ' · ' . t( 'dash.grades_sub' ) ); ?></div>
  </a>
  <a class="dash-card dash-videos" href="videos.php">
    <div class="dash-card-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"></rect><path d="M10 9.5v5l4.5-2.5z"></path></svg></div>
    <div class="dash-card-title"><?php echo esc_html( t( 'nav.videos' ) ); ?></div>
    <div class="dash-card-sub"><?php echo esc_html( t_other( 'nav.videos' ) . ' · ' . t( 'dash.videos_sub' ) ); ?></div>
  </a>
  <a class="dash-card dash-opposites" href="opposites.php">
    <div class="dash-card-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14M14 4l4 4-4 4"></path><path d="M20 16H6M10 12l-4 4 4 4"></path></svg></div>
    <div class="dash-card-title"><?php echo esc_html( t( 'nav.opposites' ) ); ?></div>
    <div class="dash-card-sub"><?php echo esc_html( t_other( 'nav.opposites' ) . ' · ' . t( 'dash.opposites_sub' ) ); ?></div>
  </a>
  <a class="dash-card dash-idioms" href="idioms.php">
    <div class="dash-card-icon"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2h-7l-5 4v-4H5a2 2 0 01-2-2V7a2 2 0 012-2z"></path><path d="M8 10h8M8 13h5"></path></svg></div>
    <div class="dash-card-title"><?php echo esc_html( t( 'nav.idioms' ) ); ?></div>
    <div class="dash-card-sub"><?php echo esc_html( t_other( 'nav.idioms' ) . ' · ' . t( 'dash.idioms_sub' ) ); ?></div>
  </a>
</div>
<?php h212_theme_picker(); ?>
</main>
</div>
</body>
</html>
