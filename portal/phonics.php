<?php
/**
 * Phonics: Steps -> Lessons -> the parts of a lesson (Sound Board first).
 * components/phonics.js builds the screens from the lists in portal/phonics/*.csv
 * (read by inc/phonics-data.php). Practice only: it never changes unlocks or Grades.
 */
require __DIR__ . '/inc/auth.php';
require_once __DIR__ . '/inc/phonics-data.php';
?>
<!DOCTYPE html>
<html lang="en" data-theme="<?php echo esc_attr( h212_current_theme() ); ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – <?php echo esc_html( t( 'nav.phonics' ) ); ?></title>
<link rel="stylesheet" href="components/base.css?v=<?php echo (int) filemtime( __DIR__ . '/components/base.css' ); ?>">
</head>
<body>
<?php
require_once __DIR__ . '/inc/nav.php';
h212_render_nav( 'phonics' );
h212_js_strings( array(
	'nav.phonics', 'phonics.subtitle', 'phonics.choose_step', 'phonics.choose_lesson', 'phonics.choose_part',
	'phonics.step', 'phonics.lesson', 'phonics.review', 'phonics.bonus', 'phonics.sounds_in_step', 'phonics.lessons_done',
	'phonics.recommended', 'phonics.new', 'phonics.done', 'phonics.back_steps', 'phonics.back_lessons', 'phonics.back_parts',
	'phonics.coming', 'phonics.part_board', 'phonics.part_board_sub', 'phonics.part_blend', 'phonics.part_blend_sub',
	'phonics.part_listen', 'phonics.part_listen_sub', 'phonics.part_read', 'phonics.part_read_sub',
	'phonics.part_sentences', 'phonics.part_sentences_sub', 'phonics.board_hint', 'phonics.board_new',
	'phonics.board_before', 'phonics.board_none', 'phonics.sound_second', 'phonics.words_n', 'phonics.silent_hint',
	'listen.silent_hint', 'listen.iframe', 'listen.play', 'listen.button', 'hw.next_question', 'hw.see_results',
	'phonics.choose_game', 'phonics.back_games', 'phonics.game_sound', 'phonics.game_sound_sub', 'phonics.game_word', 'phonics.game_word_sub',
	'phonics.game_begin', 'phonics.game_begin_sub', 'phonics.game_locked', 'phonics.q_sound', 'phonics.q_word', 'phonics.q_begin',
	'phonics.right', 'phonics.wrong_is', 'phonics.finish_title', 'phonics.finish_sub', 'phonics.again', 'phonics.best',
	'phonics.choose_read', 'phonics.read_words', 'phonics.read_words_sub', 'phonics.read_challenge', 'phonics.read_challenge_sub', 'phonics.read_challenge_intro',
	'phonics.read_inst', 'phonics.read_said', 'phonics.read_try', 'phonics.read_type_hint', 'phonics.read_type_ph', 'phonics.read_done_sub', 'phonics.read_more',
	'speak.mic', 'speak.mic_stop', 'speak.listening', 'speak.no_speech', 'speak.mic_blocked', 'speak.error', 'speak.great', 'speak.try_again', 'speak.type_check', 'speak.type_empty',
	'speak.help_works', 'speak.help_no_sr', 'speak.help_blocked', 'speak.help_privacy', 'speak.heard', 'speak.you_wrote',
	'phonics.print_btn', 'phonics.ws_print', 'phonics.ws_again', 'phonics.ws_hint', 'phonics.ws_name', 'phonics.ws_date', 'phonics.ws_s1', 'phonics.ws_s2', 'phonics.ws_s2c',
	'phonics.ws_s3', 'phonics.ws_s4', 'phonics.ws_key', 'phonics.ws_say', 'phonics.ws_say_sounds',
	'phonics.q_sentence', 'phonics.sentence_was',
	'phonics.blend_hint', 'phonics.blend_btn', 'phonics.blend_next', 'phonics.blend_say', 'phonics.blend_done_sub', 'phonics.blend_more',
) );
echo '<script>window.H212_PHONICS = ' . wp_json_encode( h212_phonics_for_js( $h212_user->ID ) ) . ';</script>' . "\n";
echo '<script>window.H212_NONCE = "' . esc_js( wp_create_nonce( 'h212_phonics' ) ) . '";</script>' . "\n";
?>
<script src="components/listen.js?v=<?php echo (int) filemtime( __DIR__ . '/components/listen.js' ); ?>"></script>
<script src="components/ui.js?v=<?php echo (int) filemtime( __DIR__ . '/components/ui.js' ); ?>"></script>
<script src="components/phonics.js?v=<?php echo (int) filemtime( __DIR__ . '/components/phonics.js' ); ?>"></script>
</main>
</div>
</body>
</html>
