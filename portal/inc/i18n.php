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
	'nav.menu'        => array( 'en' => 'Menu',            'ja' => 'メニュー' ),

	// Report a problem
	'report.button'        => array( 'en' => '⚠️ Report a Problem',                          'ja' => '⚠️ 問題を報告' ),
	'report.title'         => array( 'en' => 'Report a Problem',                             'ja' => '問題を報告' ),
	'report.description'   => array( 'en' => "Something not working right? Let us know and we'll take a look.", 'ja' => '何か不具合がありましたか？お知らせいただければ確認いたします。' ),
	'report.placeholder'   => array( 'en' => 'What happened?',                               'ja' => '何が起きましたか？' ),
	'report.send'          => array( 'en' => 'Send Report',                                  'ja' => '送信する' ),
	'report.sending'       => array( 'en' => 'Sending...',                                   'ja' => '送信中...' ),
	'report.thanks'        => array( 'en' => 'Thanks! We got your report.',                  'ja' => 'ありがとうございます！報告を受け取りました。' ),
	'report.error_generic' => array( 'en' => 'Something went wrong. Please try again.',      'ja' => 'エラーが発生しました。もう一度お試しください。' ),
	'report.error_empty'   => array( 'en' => 'Please describe what happened.',               'ja' => '何が起きたか説明してください。' ),

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
	'dash.homework_sub'  => array( 'en' => '6 parts per chapter',              'ja' => '1チャプターに6つのパート' ),
	'dash.tests_sub'     => array( 'en' => 'Check what you learned',           'ja' => '学んだことを確認' ),
	'dash.start_study'   => array( 'en' => 'Start studying',                  'ja' => '学習を始める' ),
	'dash.videos_sub'    => array( 'en' => 'Latest YouTube lessons',          'ja' => '最新のYouTubeレッスン' ),
	'dash.start_watch'   => array( 'en' => 'Start watching',                  'ja' => '視聴を始める' ),
	'dash.grades_sub'    => array( 'en' => 'Your progress & results',         'ja' => 'あなたの進捗と結果' ),
	'dash.coming_soon'   => array( 'en' => 'Coming soon',                     'ja' => '近日公開' ),
	'dash.teacher'       => array( 'en' => 'Teacher Mike',                    'ja' => 'マイク先生' ),
	'dash.your_study'    => array( 'en' => 'Your study',                      'ja' => 'あなたの学習' ),
	'dash.continue'      => array( 'en' => 'Continue',                        'ja' => '続きから' ),
	'dash.next_part'     => array( 'en' => 'Next: {part}',                    'ja' => '次は：{part}' ),
	'dash.all_done'      => array( 'en' => 'All parts finished - nice work!', 'ja' => 'すべてのパートが完了しました！' ),
	'dash.greet_new'     => array( 'en' => 'Welcome, {name}! Ready to start Chapter {n}?', 'ja' => 'ようこそ、{name}さん！チャプター{n}を始めましょう。' ),
	'dash.greet_back'    => array( 'en' => "Welcome back, {name}! You're {pct}% through Chapter {n}. Let's finish {part} today.", 'ja' => 'おかえり、{name}さん！チャプター{n}は{pct}%まで来ました。今日は{part}を終わらせよう。' ),
	'dash.greet_done'    => array( 'en' => 'Welcome back, {name}! You finished Chapter {n}. Great job!', 'ja' => 'おかえり、{name}さん！チャプター{n}を完了しました。よくできました！' ),

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
	'hw.locked_level'    => array( 'en' => 'Finish 70% of the last chapter in the previous level to unlock this.', 'ja' => '前のレベルの最後のチャプターで70%に達すると開放されます。' ),
	'hw.locked_chapter'  => array( 'en' => 'Finish 70% of the previous chapter to unlock this.', 'ja' => '前のチャプターで70%に達すると開放されます。' ),

	// Homework parts (6 per chapter, in 3 groups)
	'hw.part_photo'        => array( 'en' => 'Photos',            'ja' => '写真' ),
	'hw.part_vocabulary'   => array( 'en' => 'Words',             'ja' => '単語' ),
	'hw.part_grammar'      => array( 'en' => 'Fill in the blank', 'ja' => '穴うめ' ),
	'hw.part_builder'      => array( 'en' => 'Sentence Builder',  'ja' => '並べ替え' ),
	'hw.part_listening'    => array( 'en' => 'Listen',            'ja' => '聞き取り' ),
	'hw.part_conversation' => array( 'en' => 'Conversation',      'ja' => '会話' ),
	'hw.part_photo_sub'        => array( 'en' => 'Look and choose',         'ja' => '写真を見て選ぶ' ),
	'hw.part_vocabulary_sub'   => array( 'en' => 'Words & meanings',        'ja' => '単語と意味' ),
	'hw.part_grammar_sub'      => array( 'en' => 'Pick the right word',     'ja' => '正しい語を選ぶ' ),
	'hw.part_builder_sub'      => array( 'en' => 'Put the words in order',  'ja' => '語を正しい順に' ),
	'hw.part_listening_sub'    => array( 'en' => 'Hear and answer',         'ja' => '聞いて答える' ),
	'hw.part_conversation_sub' => array( 'en' => 'Choose the best reply',   'ja' => '最適な返事を選ぶ' ),
	'hw.group_alt_vocabulary' => array( 'en' => '語彙',         'ja' => 'Vocabulary' ),
	'hw.group_alt_grammar'    => array( 'en' => '文法',         'ja' => 'Grammar' ),
	'hw.group_alt_listening'  => array( 'en' => 'リスニング',   'ja' => 'Listening' ),
	'hw.part_alt_photo'        => array( 'en' => '写真',       'ja' => 'Photos' ),
	'hw.part_alt_vocabulary'   => array( 'en' => '単語',       'ja' => 'Words' ),
	'hw.part_alt_grammar'      => array( 'en' => '穴うめ',     'ja' => 'Fill in the blank' ),
	'hw.part_alt_builder'      => array( 'en' => '並べ替え',   'ja' => 'Sentence Builder' ),
	'hw.part_alt_listening'    => array( 'en' => '聞き取り',   'ja' => 'Listen' ),
	'hw.part_alt_conversation' => array( 'en' => '会話',       'ja' => 'Conversation' ),
	'hw.coming_parts'      => array( 'en' => 'Coming with new lessons', 'ja' => '新しいレッスンで追加予定' ),
	'hw.status_done'       => array( 'en' => 'Done',               'ja' => '完了' ),
	'hw.status_new'        => array( 'en' => 'New',                'ja' => '新規' ),
	'hw.chapter_progress'  => array( 'en' => 'Chapter progress',   'ja' => 'チャプターの進捗' ),
	'hw.next_open'         => array( 'en' => 'Chapter {n} is open', 'ja' => 'チャプター{n}が開いています' ),
	'hw.next_locked'       => array( 'en' => 'Reach 70% to open Chapter {n}', 'ja' => '70%に達するとチャプター{n}が開きます' ),
	'hw.next_level_open'   => array( 'en' => 'Level {n} is open',  'ja' => 'レベル{n}が開いています' ),
	'hw.next_level_locked' => array( 'en' => 'Reach 70% to open Level {n}', 'ja' => '70%に達するとレベル{n}が開きます' ),
	'hw.just_unlocked'     => array( 'en' => '🎉 You opened Chapter {n}!', 'ja' => '🎉 チャプター{n}が開きました！' ),
	'hw.just_unlocked_level' => array( 'en' => '🎉 You opened Level {n}!', 'ja' => '🎉 レベル{n}が開きました！' ),

	// Teacher Mike's reactions
	'mike.correct_1' => array( 'en' => 'Great job!',                         'ja' => 'よくできました！' ),
	'mike.correct_2' => array( 'en' => "That's right!",                      'ja' => '正解です！' ),
	'mike.correct_3' => array( 'en' => 'Nice one!',                          'ja' => 'いいね！' ),
	'mike.correct_4' => array( 'en' => 'Perfect - keep going!',              'ja' => '完璧！その調子！' ),
	'mike.wrong_1'   => array( 'en' => "Not quite - you'll get it next time.", 'ja' => 'おしい！次はできるよ。' ),
	'mike.wrong_2'   => array( 'en' => 'Good try! Check the answer and move on.', 'ja' => 'いい挑戦！答えを確認して次へ進もう。' ),
	'mike.wrong_3'   => array( 'en' => 'Mistakes help us learn.',            'ja' => '間違いは学びのチャンス。' ),
	'mike.finish_perfect' => array( 'en' => 'Perfect score! Amazing!',       'ja' => '満点！すばらしい！' ),
	'mike.finish_good'    => array( 'en' => 'Well done! Keep it up.',        'ja' => 'よくできました！この調子。' ),
	'mike.finish_try'     => array( 'en' => 'Good effort! Try again to do even better.', 'ja' => 'よく頑張りました！もう一度挑戦しよう。' ),
	'mike.hint_photo'        => array( 'en' => 'Look at the picture first, then read the choices.', 'ja' => 'まず写真を見て、選択肢を読もう。' ),
	'mike.hint_vocabulary'   => array( 'en' => 'Read all three choices before you pick.', 'ja' => '3つの選択肢をすべて読んでから選ぼう。' ),
	'mike.hint_grammar'      => array( 'en' => 'Look at the words around the blank.', 'ja' => '空欄のまわりの語に注目しよう。' ),
	'mike.hint_builder'      => array( 'en' => 'Start with who is doing it - find the subject.', 'ja' => 'まず「だれが」を探そう。主語から始めよう。' ),
	'mike.hint_listening'    => array( 'en' => 'Tap Listen as many times as you like.', 'ja' => '「聞く」は何回でも押してOK。' ),
	'mike.hint_conversation' => array( 'en' => 'Think about what a friend would say back.', 'ja' => '友だちならどう返すか考えてみよう。' ),
	'mike.hint_test'         => array( 'en' => 'Take your time. You can do it!', 'ja' => 'ゆっくりでOK。きっとできるよ！' ),

	// Sentence Builder and Conversation
	'builder.instruction' => array( 'en' => 'Put the words in order to say this in English.', 'ja' => '英語で言えるように、語を正しい順に並べましょう。' ),
	'builder.empty'       => array( 'en' => 'Tap the words below',  'ja' => '下の語をタップ' ),
	'builder.check'       => array( 'en' => 'Check',                'ja' => '答え合わせ' ),
	'builder.clear'       => array( 'en' => 'Clear',                'ja' => 'クリア' ),
	'builder.wrong_msg'   => array( 'en' => '❌ Not quite. The correct sentence is:', 'ja' => '❌ 惜しい！正しい文は：' ),
	'conv.prompt'         => array( 'en' => 'Choose the best reply.', 'ja' => '一番よい返事を選んでください。' ),

	// Robot voice (Listening questions)
	'listen.who'      => array( 'en' => 'Who do you want to hear?',  'ja' => '誰の声で聞きますか？' ),
	'listen.robot'    => array( 'en' => 'Robot',                     'ja' => 'ロボット' ),
	'listen.mix'      => array( 'en' => 'Mix',                       'ja' => 'ミックス' ),
	'listen.us_woman' => array( 'en' => 'American woman',            'ja' => 'アメリカ 女性' ),
	'listen.us_man'   => array( 'en' => 'American man',              'ja' => 'アメリカ 男性' ),
	'listen.uk_woman' => array( 'en' => 'British woman',             'ja' => 'イギリス 女性' ),
	'listen.uk_man'   => array( 'en' => 'British man',               'ja' => 'イギリス 男性' ),
	'listen.button'   => array( 'en' => '🔊 Listen',                 'ja' => '🔊 聞く' ),
	'listen.playing'  => array( 'en' => '🔊 Playing…',               'ja' => '🔊 再生中…' ),
	'listen.no_voice' => array( 'en' => 'No English voice found on this device, so the sentence is shown here instead.', 'ja' => 'この端末に英語の音声がないため、代わりに文を表示しています。' ),

	'tests.choose_level_chapter' => array( 'en' => 'Choose your level then chapter.', 'ja' => 'レベルとチャプターを選んでください。' ),
	'tests.preparing'            => array( 'en' => 'This test is being prepared. Check back soon!', 'ja' => 'このテストは準備中です。また後で確認してください!' ),
	'tests.test_label'           => array( 'en' => 'Test',                     'ja' => 'テスト' ),
	'tests.no_content'           => array( 'en' => 'No test yet',              'ja' => 'テストはまだありません' ),
	'tests.take'                 => array( 'en' => 'Take Test',                'ja' => 'テストを受ける' ),
	'tests.already_taken'        => array( 'en' => "You've already taken this test.", 'ja' => 'このテストはすでに受けています。' ),

	// Grades
	'grades.subtitle'      => array( 'en' => 'Your progress, level by level.',   'ja' => 'あなたの進捗状況、レベルごとに。' ),
	'grades.current_level' => array( 'en' => 'Currently on',                    'ja' => '現在のレベル' ),
	'grades.mastered_of'   => array( 'en' => 'chapters mastered',               'ja' => 'チャプターを習得' ),
	'grades.go_homework'   => array( 'en' => 'Go to Homework →',                'ja' => '宿題へ →' ),
	'grades.status_mastered'    => array( 'en' => 'Mastered',                   'ja' => '習得済み' ),
	'grades.status_progress'    => array( 'en' => 'Needs Practice',             'ja' => '練習が必要' ),
	'grades.status_not_started' => array( 'en' => 'Not Started',                'ja' => '未着手' ),
	'grades.coming_soon_level'  => array( 'en' => 'Content coming soon for this level.', 'ja' => 'このレベルのコンテンツは近日公開予定です。' ),
	'grades.msg_start'    => array( 'en' => "Let's get started! 🌱",            'ja' => '始めましょう！🌱' ),
	'grades.msg_progress' => array( 'en' => "Nice work - keep it up! 💪",       'ja' => 'いい調子です、その調子で！💪' ),
	'grades.msg_great'    => array( 'en' => "You're doing great! 🎉",           'ja' => 'よくできています！🎉' ),

	// Videos
	'videos.subtitle'     => array( 'en' => 'Latest lessons from the 212 English School YouTube channel.', 'ja' => '212イングリッシュスクールのYouTubeチャンネルの最新レッスン。' ),
	'videos.loading'      => array( 'en' => '⏳ Loading videos...',            'ja' => '⏳ 動画を読み込み中...' ),
	'videos.error'        => array( 'en' => '⚠️ Could not load videos.',       'ja' => '⚠️ 動画を読み込めませんでした。' ),
	'videos.visit_yt'     => array( 'en' => 'Visit YouTube ↗',                 'ja' => 'YouTubeで見る ↗' ),
);

/** The same text in the OTHER language (used for small bilingual labels). */
function t_other( $key ) {
	$other = ( 'en' === $GLOBALS['h212_lang'] ) ? 'ja' : 'en';
	return $GLOBALS['h212_strings'][ $key ][ $other ] ?? $key;
}

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
