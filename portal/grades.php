<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Grades</title>
<link rel="stylesheet" href="components/base.css">
</head>
<body>
<?php
require __DIR__ . '/inc/nav.php';
h212_render_nav( 'grades' );
?>
<div class="section-header"><h2><?php echo esc_html( t( 'nav.grades' ) ); ?></h2><p><?php echo esc_html( t( 'grades.subtitle' ) ); ?></p></div>
<div class="coming-soon"><div class="cs-icon">📊</div>
<h3><?php echo esc_html( t( 'grades.soon_title' ) ); ?></h3>
<p><?php echo esc_html( t( 'grades.soon_body' ) ); ?></p></div>
</main>
</div>
</body>
</html>
