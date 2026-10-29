<?php
/**
 * The page for one practice section (Opposites, Idioms): the shared look, then
 * components/practice.js builds the screens. Content comes from the section's CSV
 * (see h212_practice_sections() in wp-content/mu-plugins/212-progress.php).
 * Needs auth.php to have run first.
 */
function h212_practice_page( $section ) {
	$defs = h212_practice_sections();
	if ( ! isset( $defs[ $section ] ) ) {
		wp_die( 'Unknown section.' );
	}
	$def = $defs[ $section ];
	// Version numbers on the question files, so a browser never shows an old copy after an upload
	$ver = array();
	foreach ( array( 'file', 'modes_file' ) as $k ) {
		$f = empty( $def[ $k ] ) ? '' : __DIR__ . '/../' . $def[ $k ];
		$ver[ $k ] = ( $f && file_exists( $f ) ) ? filemtime( $f ) . '-' . filesize( $f ) : '0';
	}
	?>
<!DOCTYPE html>
<html lang="en" data-theme="<?php echo esc_attr( h212_current_theme() ); ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – <?php echo esc_html( $def['label'] ); ?></title>
<link rel="stylesheet" href="components/base.css?v=<?php echo (int) filemtime( __DIR__ . '/../components/base.css' ); ?>">
</head>
<body>
<?php
	require_once __DIR__ . '/nav.php';
	require_once __DIR__ . '/mike.php';
	h212_render_nav( $section );
	h212_js_strings( array(
		'nav.' . $section, 'practice.' . $section . '_subtitle',
		'practice.loading', 'practice.choose_set', 'practice.set', 'practice.done', 'practice.no_questions',
		'practice.back_sets', 'practice.use_words', 'practice.write_ph', 'practice.check', 'practice.skip',
		'practice.empty', 'practice.saved', 'practice.example', 'practice.short', 'practice.missing', 'practice.error_save',
		'practice.finish_title', 'practice.finish_sub', 'practice.again',
		'practice.kind_choice', 'practice.kind_blank', 'practice.kind_meaning', 'practice.kind_write',
		'practice.choose_mode', 'practice.back_modes', 'practice.finish_sub2',
		'practice.line_heard', 'practice.line_said', 'practice.line_best',
		'practice.mode_choice', 'practice.mode_blank', 'practice.mode_builder', 'practice.mode_listen', 'practice.mode_convo',
		'practice.mode_choice_alt', 'practice.mode_blank_alt', 'practice.mode_builder_alt', 'practice.mode_listen_alt', 'practice.mode_convo_alt',
		'practice.mode_choice_sub', 'practice.mode_blank_sub', 'practice.mode_builder_sub', 'practice.mode_listen_sub', 'practice.mode_convo_sub',
		'builder.instruction', 'builder.empty', 'builder.check', 'builder.clear', 'builder.wrong_msg', 'conv.prompt',
		'hw.coming_parts', 'hw.status_new', 'hw.correct_msg', 'hw.wrong_msg', 'hw.next_question', 'hw.see_results', 'listen.button', 'listen.play',
		'listen.silent_hint', 'listen.iframe',
	) );
	require_once __DIR__ . '/voices.php';
	h212_voice_script();   // which recorded clips exist (audio/modes/<id>.m4a); the robot voice is used for the rest
	h212_mike_for_js();
	$config = array(
		'section' => $section,
		'csv'      => $def['file'] . '?v=' . $ver['file'],
		'csvModes' => ( empty( $def['modes_file'] ) ? '' : $def['modes_file'] . '?v=' . $ver['modes_file'] ),
		'mode'    => $def['pair'] ? 'pair' : 'item',
		'kinds'   => $def['kinds'],
		'fields'  => array( 'item' => $def['item'], 'item_ja' => $def['item_ja'], 'pair' => $def['pair'], 'pair_ja' => $def['pair_ja'] ),
	);
	echo '<script>window.H212_PRACTICE = ' . wp_json_encode( $config ) . ';</script>' . "\n";
	?>
<script src="components/listen.js?v=<?php echo (int) filemtime( __DIR__ . '/../components/listen.js' ); ?>"></script>
<script src="components/mike.js?v=<?php echo (int) filemtime( __DIR__ . '/../components/mike.js' ); ?>"></script>
<script src="components/ui.js?v=<?php echo (int) filemtime( __DIR__ . '/../components/ui.js' ); ?>"></script>
<script src="components/builder.js?v=<?php echo (int) filemtime( __DIR__ . '/../components/builder.js' ); ?>"></script>
<script>window.H212_NONCE = "<?php echo esc_js( wp_create_nonce( 'h212_practice' ) ); ?>";</script>
<script src="components/practice.js?v=<?php echo (int) filemtime( __DIR__ . '/../components/practice.js' ); ?>"></script>
</main>
</div>
</body>
</html>
	<?php
}
