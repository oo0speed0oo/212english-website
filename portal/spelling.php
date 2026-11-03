<?php
/**
 * Spelling: word games for all the vocabulary (Missing Letters first; Word Search, Crossword and Print follow).
 * components/spelling.js builds the screens from the list in portal/spelling/spelling-words.csv
 * (read by inc/spelling-data.php); components/wordgames.js plays the games.
 * Practice only: it never changes unlocks or Grades.
 */
require __DIR__ . '/inc/auth.php';
require_once __DIR__ . '/inc/spelling-data.php';
?>
<!DOCTYPE html>
<html lang="en" data-theme="<?php echo esc_attr( h212_current_theme() ); ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – <?php echo esc_html( t( 'nav.spelling' ) ); ?></title>
<link rel="stylesheet" href="components/base.css?v=<?php echo (int) filemtime( __DIR__ . '/components/base.css' ); ?>">
</head>
<body>
<?php
require_once __DIR__ . '/inc/nav.php';
h212_render_nav( 'spelling' );
h212_js_strings( array(
	'nav.spelling', 'spell.subtitle', 'spell.level', 'spell.easy', 'spell.normal', 'spell.choose_group', 'spell.choose_set', 'spell.choose_game',
	'spell.group_L1', 'spell.group_L2', 'spell.group_OPP', 'spell.sets_n', 'spell.words_n', 'spell.chapter', 'spell.set', 'spell.done', 'spell.new', 'spell.best',
	'spell.back_groups', 'spell.back_sets', 'spell.coming',
	'spell.game_missing', 'spell.game_missing_sub', 'spell.game_search', 'spell.game_search_sub', 'spell.game_cross', 'spell.game_cross_sub', 'spell.game_print',
	'wg.game_search', 'wg.inst_search_easy', 'wg.inst_search_normal', 'wg.hint', 'wg.found', 'wg.left', 'wg.finish_search',
	'wg.game_cross', 'wg.inst_cross_easy', 'wg.inst_cross_normal', 'wg.finish_cross',
	'wg.game_missing', 'wg.inst_easy', 'wg.inst_normal', 'wg.right', 'wg.next', 'wg.see_results', 'wg.back', 'wg.again', 'wg.finish_title', 'wg.finish_sub',
	'listen.button', 'listen.silent_hint', 'listen.iframe', 'listen.play',
) );
echo '<script>window.H212_SPELLING = ' . wp_json_encode( h212_spelling_for_js( $h212_user->ID ) ) . ';</script>' . "\n";
echo '<script>window.H212_NONCE = "' . esc_js( wp_create_nonce( 'h212_spelling' ) ) . '";</script>' . "\n";
?>
<script src="components/listen.js?v=<?php echo (int) filemtime( __DIR__ . '/components/listen.js' ); ?>"></script>
<script src="components/ui.js?v=<?php echo (int) filemtime( __DIR__ . '/components/ui.js' ); ?>"></script>
<script src="components/wordgames.js?v=<?php echo (int) filemtime( __DIR__ . '/components/wordgames.js' ); ?>"></script>
<script src="components/spelling.js?v=<?php echo (int) filemtime( __DIR__ . '/components/spelling.js' ); ?>"></script>
</main>
</div>
</body>
</html>
