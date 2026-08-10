<?php
/**
 * Lightweight bilingual (EN/JA) support for the portal interface.
 * Covers nav, buttons, labels, and messages - not the actual homework/test
 * question content, which stays as authored in the CSV for now.
 */

function h212_get_lang() {
	if ( isset( $_GET['lang'] ) && in_array( $_GET['lang'], array( 'en', 'ja' ), true ) ) {
		setcookie( 'h212_lang', $_GET['lang'], time() + YEAR_IN_SECONDS, '/portal/' );
		return $_GET['lang'];
	}
	if ( isset( $_COOKIE['h212_lang'] ) && in_array( $_COOKIE['h212_lang'], array( 'en', 'ja' ), true ) ) {
		return $_COOKIE['h212_lang'];
	}
	return 'en';
}

$GLOBALS['h212_lang'] = h212_get_lang();

$GLOBALS['h212_strings'] = array(
	// Nav
	'nav.dashboard'   => array( 'en' => 'Dashboard',       'ja' => 'ダッシュボード' ),
	'nav.profile'     => array( 'en' => 'My Profile',      'ja' => 'マイプロフィール' ),
	'nav.homework'    => array( 'en' => 'Homework',        'ja' => '宿題' ),
	'nav.tests'       => array( 'en' => 'Tests',           'ja' => 'テスト' ),
	'nav.videos'      => array( 'en' => 'Videos',          'ja' => '動画' ),
	'nav.grades'      => array( 'en' => 'Grades',          'ja' => '成績' ),
	'nav.logout'      => array( 'en' => 'Log out',         'ja' => 'ログアウト' ),
	'nav.group_menu'  => array( 'en' => 'Menu',            'ja' => 'メニュー' ),
	'nav.group_study' => array( 'en' => 'Study',           'ja' => '学習' ),

	// Login
	'login.welcome'       => array( 'en' => 'Welcome back',                              'ja' => 'おかえりなさい' ),
	'login.subtitle'      => array( 'en' => 'Log in to access your student portal.',     'ja' => '生徒用ポータルにログインしてください。' ),
	'login.username'      => array( 'en' => 'Username',                                  'ja' => 'ユーザー名' ),
	'login.username_ph'   => array( 'en' => 'Enter your username',                       'ja' => 'ユーザー名を入力してください' ),
	'login.password'      => array( 'en' => 'Password',                                  'ja' => 'パスワード' ),
	'login.password_ph'   => array( 'en' => 'Enter your password',                       'ja' => 'パスワードを入力してください' ),
	'login.button'        => array( 'en' => 'Log in',                                    'ja' => 'ログイン' ),
	'login.error_generic' => array( 'en' => 'Incorrect username or password.',           'ja' => 'ユーザー名またはパスワードが正しくありません。' ),
	'login.error_role'    => array( 'en' => 'This account is not set up as a student account.', 'ja' => 'このアカウントは生徒用に設定されていません。' ),

	// Dashboard
	'dash.welcome'       => array( 'en' => 'Welcome back,',                    'ja' => 'おかえりなさい、' ),
	'dash.subtitle'      => array( 'en' => 'What would you like to study today?', 'ja' => '今日は何を勉強しますか?' ),
	'dash.homework_sub'  => array( 'en' => '5 levels · 16 chapters each',      'ja' => '5レベル・各16チャプター' ),
	'dash.start_study'   => array( 'en' => 'Start studying',                  'ja' => '学習を始める' ),
	'dash.videos_sub'    => array( 'en' => 'Latest YouTube lessons',          'ja' => '最新のYouTubeレッスン' ),
	'dash.start_watch'   => array( 'en' => 'Start watching',                  'ja' => '視聴を始める' ),
	'dash.grades_sub'    => array( 'en' => 'Your progress & results',         'ja' => 'あなたの進捗と結果' ),
	'dash.coming_soon'   => array( 'en' => 'Coming soon',                     'ja' => '近日公開' ),

	// Profile
	'profile.subtitle'    => array( 'en' => 'Your personal information.',      'ja' => 'あなたの個人情報。' ),
	'profile.updated'     => array( 'en' => '✅ Profile updated.',             'ja' => '✅ プロフィールが更新されました。' ),
	'profile.school_role' => array( 'en' => '212 English School Student',     'ja' => '212イングリッシュスクール 生徒' ),
	'profile.first_name'  => array( 'en' => 'First Name',                     'ja' => '名' ),
	'profile.last_name'   => array( 'en' => 'Last Name',                      'ja' => '姓' ),
	'profile.birthday'    => array( 'en' => 'Birthday',                       'ja' => '誕生日' ),
	'profile.location'    => array( 'en' => 'Location (Prefecture)',          'ja' => '住所(都道府県)' ),
	'profile.save'        => array( 'en' => '💾 Save Profile',                'ja' => '💾 プロフィールを保存' ),

	// Homework / Tests (also used by JS)
	'hw.choose_level'    => array( 'en' => 'Choose your level to begin.',        'ja' => 'レベルを選んで始めましょう。' ),
	'hw.choose_chapter'  => array( 'en' => 'Choose your chapter.',               'ja' => 'チャプターを選んでください。' ),
	'hw.choose_study'    => array( 'en' => 'What would you like to study?',      'ja' => '何を勉強しますか?' ),
	'hw.back_levels'     => array( 'en' => '← Back to Levels',                   'ja' => '← レベルに戻る' ),
	'hw.back_chapters'   => array( 'en' => '← Back to Chapters',                 'ja' => '← チャプターに戻る' ),
	'hw.back'            => array( 'en' => '← Back',                            'ja' => '← 戻る' ),
	'hw.level'           => array( 'en' => 'Level',                             'ja' => 'レベル' ),
	'hw.chapter'         => array( 'en' => 'Chapter',                           'ja' => 'チャプター' ),
	'hw.vocabulary'      => array( 'en' => 'Vocabulary',                        'ja' => '単語' ),
	'hw.vocab_sub'       => array( 'en' => 'Words & meanings',                  'ja' => '単語と意味' ),
	'hw.grammar'         => array( 'en' => 'Grammar',                           'ja' => '文法' ),
	'hw.grammar_sub'     => array( 'en' => 'Rules & practice',                  'ja' => 'ルールと練習' ),
	'hw.listening'       => array( 'en' => 'Listening',                         'ja' => 'リスニング' ),
	'hw.listening_sub'   => array( 'en' => 'Audio exercises',                   'ja' => '音声練習' ),
	'hw.no_content'      => array( 'en' => '🚧 No questions yet for this section.<br>Check back soon!', 'ja' => '🚧 このセクションにはまだ問題がありません。<br>また後で確認してください!' ),
	'hw.question'        => array( 'en' => 'Question',                         'ja' => '問題' ),
	'hw.of'               => array( 'en' => 'of',                               'ja' => '/' ),
	'hw.score'           => array( 'en' => 'Score:',                           'ja' => 'スコア:' ),
	'hw.correct_msg'     => array( 'en' => '✅ Correct! Well done!',            'ja' => '✅ 正解です!よくできました!' ),
	'hw.wrong_msg'       => array( 'en' => '❌ Not quite. The correct answer is:', 'ja' => '❌ 残念、正解は:' ),
	'hw.next_question'   => array( 'en' => 'Next Question →',                  'ja' => '次の問題 →' ),
	'hw.see_results'     => array( 'en' => 'See Results 🎉',                   'ja' => '結果を見る 🎉' ),
	'hw.results'         => array( 'en' => 'Results',                          'ja' => '結果' ),
	'hw.correct_word'    => array( 'en' => 'correct',                          'ja' => '正解' ),
	'hw.try_again'       => array( 'en' => 'Try Again',                        'ja' => 'もう一度挑戦' ),
	'hw.back_to_topics'  => array( 'en' => 'Back to Topics',                   'ja' => 'トピックに戻る' ),
	'hw.photo_question'  => array( 'en' => '📸 Photo Question',                'ja' => '📸 写真問題' ),
	'hw.finished_badge'  => array( 'en' => 'Finished',                         'ja' => '完了' ),
	'hw.already_finished'=> array( 'en' => "You've already finished this quiz.", 'ja' => 'このクイズはすでに完了しています。' ),
	'hw.best_score'      => array( 'en' => 'Your best score:',                 'ja' => '最高スコア:' ),
	'hw.start_again'     => array( 'en' => 'Start Again',                      'ja' => 'もう一度挑戦' ),
	'hw.needs_review'    => array( 'en' => 'to review',                       'ja' => '復習が必要' ),

	'tests.choose_level_chapter' => array( 'en' => 'Choose your level then chapter.', 'ja' => 'レベルとチャプターを選んでください。' ),
	'tests.preparing'            => array( 'en' => 'This test is being prepared. Check back soon!', 'ja' => 'このテストは準備中です。また後で確認してください!' ),
	'tests.test_label'           => array( 'en' => 'Test',                     'ja' => 'テスト' ),

	// Grades
	'grades.subtitle'     => array( 'en' => 'Your results and progress tracking.', 'ja' => 'あなたの結果と進捗状況。' ),
	'grades.soon_title'   => array( 'en' => 'Grades coming soon',              'ja' => '成績は近日公開' ),
	'grades.soon_body'    => array( 'en' => 'Your test results and progress will appear here once tests are live.', 'ja' => 'テストが公開されると、ここに結果と進捗が表示されます。' ),

	// Videos
	'videos.subtitle'     => array( 'en' => 'Latest lessons from the 212 English School YouTube channel.', 'ja' => '212イングリッシュスクールのYouTubeチャンネルの最新レッスン。' ),
	'videos.loading'      => array( 'en' => '⏳ Loading videos...',            'ja' => '⏳ 動画を読み込み中...' ),
	'videos.error'        => array( 'en' => '⚠️ Could not load videos.',       'ja' => '⚠️ 動画を読み込めませんでした。' ),
	'videos.visit_yt'     => array( 'en' => 'Visit YouTube ↗',                 'ja' => 'YouTubeで見る ↗' ),
);

function t( $key ) {
	$lang = $GLOBALS['h212_lang'];
	if ( isset( $GLOBALS['h212_strings'][ $key ][ $lang ] ) ) {
		return $GLOBALS['h212_strings'][ $key ][ $lang ];
	}
	return $GLOBALS['h212_strings'][ $key ]['en'] ?? $key;
}

/**
 * Returns the subset of strings needed client-side by a page's JS, as a
 * ready-to-echo <script> block defining window.H212_T.
 */
function h212_js_strings( $keys ) {
	$out = array();
	foreach ( $keys as $key ) {
		$out[ $key ] = t( $key );
	}
	echo '<script>window.H212_T = ' . wp_json_encode( $out ) . ';</script>';
}
