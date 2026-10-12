<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en" data-theme="<?php echo esc_attr( h212_current_theme() ); ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Videos</title>
<link rel="stylesheet" href="components/base.css?v=<?php echo (int) filemtime( __DIR__ . '/components/base.css' ); ?>">
</head>
<body>
<?php
// Video lessons: the list comes from portal/video-content.csv (read by the
// shared code in wp-content/mu-plugins/212-progress.php). ?v=<video_id> opens
// one lesson: the video, 5 questions, then "Your turn" (write a sentence).
require __DIR__ . '/inc/nav.php';
h212_render_nav( 'videos' );

$videos   = function_exists( 'h212_video_list' ) ? h212_video_list() : array();
$progress = function_exists( 'h212_video_progress' ) ? h212_video_progress( $h212_user->ID ) : array();
$lesson   = null;
if ( isset( $_GET['v'] ) ) {
	$lesson = function_exists( 'h212_video_get' ) ? h212_video_get( sanitize_text_field( wp_unslash( $_GET['v'] ) ) ) : null;
}
$yt_channel = 'UC-gtB79-gCRtneuBLGwpbgg';

if ( ! $lesson ) :
	// ───────────────────────── LIST ─────────────────────────
	?>
<div class="section-header"><h2><?php echo esc_html( t( 'nav.videos' ) ); ?></h2><p><?php echo esc_html( t( 'videos.subtitle' ) ); ?></p></div>
	<?php if ( ! $videos ) : ?>
<div class="video-msg"><?php echo esc_html( t( 'videos.empty' ) ); ?></div>
	<?php else : ?>
<div class="video-grid">
		<?php foreach ( $videos as $v ) :
			$p = isset( $progress[ $v['video_id'] ] ) ? $progress[ $v['video_id'] ] : array( 'done' => 0, 'total' => 5, 'sentence' => false, 'finished' => false );
			$parts_done = $p['done'] + ( $p['sentence'] ? 1 : 0 );
			$parts_all  = $p['total'] + 1;
			?>
  <a class="video-card<?php echo $p['finished'] ? ' is-done' : ''; ?>" href="videos.php?v=<?php echo esc_attr( $v['video_id'] ); ?>">
    <div class="video-thumb">
      <img src="https://img.youtube.com/vi/<?php echo esc_attr( $v['video_id'] ); ?>/mqdefault.jpg" loading="lazy" alt="">
      <div class="play-overlay" aria-hidden="true">▶</div>
      <?php if ( $p['finished'] ) : ?>
        <span class="video-badge done">✓ <?php echo esc_html( t( 'videos.done' ) ); ?></span>
      <?php elseif ( $parts_done > 0 ) : ?>
        <span class="video-badge part"><?php echo (int) $parts_done; ?>/<?php echo (int) $parts_all; ?></span>
      <?php endif; ?>
    </div>
    <div class="video-info"><div class="video-title"><?php echo esc_html( $v['title'] ); ?></div></div>
  </a>
		<?php endforeach; ?>
</div>
	<?php endif; ?>
<p class="video-more"><a href="https://www.youtube.com/channel/<?php echo esc_attr( $yt_channel ); ?>" target="_blank" rel="noopener"><?php echo esc_html( t( 'videos.visit_yt' ) ); ?></a></p>
	<?php
else :
	// ───────────────────────── ONE LESSON ─────────────────────────
	h212_js_strings( array(
		'hw.correct_msg', 'hw.wrong_msg', 'hw.next_question', 'hw.back', 'hw.score',
		'videos.start', 'videos.practice', 'videos.go_turn', 'videos.intro', 'videos.questions_label',
		'videos.your_turn', 'videos.turn_intro', 'videos.placeholder', 'videos.check', 'videos.checking',
		'videos.sent', 'videos.example', 'videos.last', 'videos.save_error', 'videos.done_msg', 'videos.back_lesson',
	) );
	require_once __DIR__ . '/inc/mike.php';
	h212_mike_for_js();

	$last_sentence = '';
	foreach ( h212_video_sentences( $h212_user->ID ) as $s ) {
		if ( $s['video_id'] === $lesson['video_id'] ) {
			$last_sentence = $s['text'];
		}
	}
	$both = function ( $key ) {
		return array( t( $key ), t_other( $key ) );
	};
	$data = array(
		'video_id'  => $lesson['video_id'],
		'title'     => $lesson['title'],
		'questions' => $lesson['questions'],
		'required'  => $lesson['write'] ? $lesson['write']['required'] : array(),
		'example'   => $lesson['write'] ? $lesson['write']['example'] : '',
		'last'      => $last_sentence,
		'nonce'     => wp_create_nonce( 'h212_video_sentence' ),
		'both'      => array(
			'need_words' => $both( 'videos.need_words' ),
			'need_five'  => $both( 'videos.need_five' ),
			'sent'       => $both( 'videos.sent' ),
		),
	);
	$p = isset( $progress[ $lesson['video_id'] ] ) ? $progress[ $lesson['video_id'] ] : array( 'done' => 0, 'total' => 5, 'sentence' => false );
	?>
<script>window.H212_NONCE = "<?php echo esc_js( wp_create_nonce( 'h212_save_score' ) ); ?>";</script>
<script>window.H212_VIDEO = <?php echo wp_json_encode( $data ); ?>;</script>
<script src="components/mike.js?v=<?php echo (int) filemtime( __DIR__ . '/components/mike.js' ); ?>"></script>
<script src="components/ui.js?v=<?php echo (int) filemtime( __DIR__ . '/components/ui.js' ); ?>"></script>

<a class="back-btn" href="videos.php"><?php echo esc_html( t( 'videos.back' ) ); ?></a>
<h2 class="lesson-title"><?php echo esc_html( $lesson['title'] ); ?></h2>
<div class="video-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/<?php echo esc_attr( $lesson['video_id'] ); ?>?rel=0" title="<?php echo esc_attr( $lesson['title'] ); ?>" loading="lazy"
    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
</div>
<div id="lesson-area"></div>

<script>
// ── Video lesson: 5 questions, then "Your turn" ─────────────
var V = window.H212_VIDEO;
var T = window.H212_T;
var allSeen = [], allWrong = [];
var currentQ = [], currentIndex = 0, score = 0;

function h(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function area() { return document.getElementById('lesson-area'); }
function fill(tpl, vars) { Object.keys(vars).forEach(function(k) { tpl = tpl.replace('{' + k + '}', vars[k]); }); return tpl; }

window.addEventListener('DOMContentLoaded', function() {
  Promise.all([
    fetch('inc/seen.php').then(function(r) { return r.json(); }).then(function(d) { allSeen = (d && d.seen) || []; }).catch(function() {}),
    fetch('inc/mistakes.php').then(function(r) { return r.json(); }).then(function(d) { allWrong = (d && d.current_wrong) || []; }).catch(function() {})
  ]).then(showIntro);
});

function isFinished(q) { return allSeen.indexOf(q.id) !== -1 && allWrong.indexOf(q.id) === -1; }
function finishedCount() { return V.questions.filter(isFinished).length; }

function showIntro() {
  var done = finishedCount(), total = V.questions.length;
  var allDone = done === total;
  var html = '<div class="question-card lesson-intro">'
    + '<div class="q-label">' + h(T['videos.questions_label']) + ' · ' + done + ' / ' + total + '</div>'
    + '<p class="lesson-intro-text">' + h(T['videos.intro']) + '</p>'
    + '<div class="lesson-buttons">'
    + '<button type="button" class="next-btn" style="display:inline-flex" onclick="beginQuestions()">' + h(allDone ? T['videos.practice'] : T['videos.start']) + '</button>'
    + '<button type="button" class="builder-clear" onclick="showTurn()">' + h(T['videos.go_turn']) + '</button>'
    + '</div></div>';
  area().innerHTML = html;
}

function beginQuestions() {
  // Same order as Homework: never-answered first, then ones still wrong, then all of them again
  var unseen = V.questions.filter(function(q) { return allSeen.indexOf(q.id) === -1; });
  var wrong  = V.questions.filter(function(q) { return allWrong.indexOf(q.id) !== -1; });
  currentQ = unseen.length ? unseen : (wrong.length ? wrong : V.questions.slice());
  currentIndex = 0; score = 0;
  showQuestion();
}

function showQuestion() {
  var q = currentQ[currentIndex], total = currentQ.length;
  var html = H212UI.qTop({ onclose: 'showIntro()', label: T['hw.back'], index: currentIndex, total: total, score: score, scoreWord: T['hw.score'].replace(/:$/, '') })
    + '<div class="q-label">' + h(T['videos.questions_label']) + '</div>'
    + '<div class="question-card"><div class="question-text">' + h(q.question) + '</div><div class="choices">';
  q.choices.forEach(function(c, i) {
    html += '<button type="button" class="choice-btn" onclick="pick(this,' + i + ')">' + h(c) + '</button>';
  });
  html += '</div><div class="result-msg" id="result-msg"></div>'
    + '<button type="button" class="next-btn" id="next-btn" onclick="nextQuestion()">' + h(currentIndex + 1 < total ? T['hw.next_question'] : T['videos.go_turn']) + '</button>'
    + '</div>' + H212Mike.row();
  area().innerHTML = html;
}

function markSeen(id) {
  if (allSeen.indexOf(id) === -1) allSeen.push(id);
  fetch('inc/seen.php', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: window.H212_NONCE, id: id }) }).catch(function() {});
}
function recordMistake(q, correct, chosen) {
  var i = allWrong.indexOf(q.id);
  if (correct) { if (i !== -1) allWrong.splice(i, 1); } else if (i === -1) { allWrong.push(q.id); }
  fetch('inc/mistakes.php', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: window.H212_NONCE, id: q.id, correct: correct, level: 0, chapter: 0, type: 'video',
      question: q.question, chosen: chosen, correct_answer: q.answer }) }).catch(function() {});
}

function pick(btn, i) {
  var q = currentQ[currentIndex];
  var chosen = q.choices[i], ok = (chosen === q.answer);
  markSeen(q.id);
  recordMistake(q, ok, chosen);
  var btns = document.querySelectorAll('.choice-btn');
  btns.forEach(function(b) { b.disabled = true; });
  var msg = document.getElementById('result-msg');
  if (ok) {
    btn.classList.add('correct'); score++;
    msg.textContent = T['hw.correct_msg']; msg.className = 'result-msg correct';
  } else {
    btn.classList.add('wrong');
    msg.textContent = T['hw.wrong_msg'] + ' ' + q.answer; msg.className = 'result-msg wrong';
    btns.forEach(function(b, k) { if (q.choices[k] === q.answer) b.classList.add('correct'); });
  }
  msg.style.display = 'block';
  document.getElementById('next-btn').style.display = 'inline-flex';
  H212Mike.say(ok ? 'correct' : 'wrong');
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex < currentQ.length) showQuestion(); else showTurn();
}

// ── Your turn ───────────────────────────────────────────
function showTurn() {
  var chips = V.required.map(function(w) { return '<span class="word-chip">' + h(w) + '</span>'; }).join('');
  var html = '<div class="question-card lesson-turn">'
    + '<div class="q-label">' + h(T['videos.your_turn']) + '</div>'
    + '<p class="lesson-intro-text">' + h(T['videos.turn_intro']) + '</p>'
    + '<div class="word-chips">' + chips + '</div>'
    + '<textarea id="turn-text" class="turn-text" rows="3" maxlength="500" placeholder="' + h(T['videos.placeholder']) + '" autocapitalize="sentences"></textarea>'
    + '<div class="turn-msg" id="turn-msg" role="status"></div>'
    + '<div class="lesson-buttons"><button type="button" class="next-btn" id="turn-btn" style="display:inline-flex" onclick="submitSentence()">' + h(T['videos.check']) + '</button>'
    + '<button type="button" class="builder-clear" onclick="showIntro()">' + h(T['videos.back_lesson']) + '</button></div>'
    + (V.last ? '<p class="turn-last"><strong>' + h(T['videos.last']) + '</strong> ' + h(V.last) + '</p>' : '')
    + '</div>' + H212Mike.row();
  area().innerHTML = html;
}

function twoLines(pair, vars) {
  return '<div>' + h(fill(pair[0], vars || {})) + '</div><div class="turn-msg-sub">' + h(fill(pair[1], vars || {})) + '</div>';
}

function submitSentence() {
  var box = document.getElementById('turn-text'), msg = document.getElementById('turn-msg'), btn = document.getElementById('turn-btn');
  var text = box.value.trim();
  msg.className = 'turn-msg'; msg.innerHTML = '';
  if (!text) { box.focus(); return; }
  btn.disabled = true; btn.textContent = T['videos.checking'];
  fetch('inc/video-sentence.php', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: V.nonce, video_id: V.video_id, text: text }) })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      btn.disabled = false; btn.textContent = T['videos.check'];
      if (d && d.ok) {
        V.last = text;
        box.disabled = true; btn.style.display = 'none';
        msg.className = 'turn-msg ok';
        msg.innerHTML = twoLines(V.both.sent)
          + (d.example ? '<div class="turn-example"><strong>' + h(T['videos.example']) + '</strong> ' + h(d.example) + '</div>' : '');
        H212Mike.say('correct');
      } else if (d && d.missing) {
        msg.className = 'turn-msg bad';
        var html = '';
        if (d.missing.length) html += twoLines(V.both.need_words, { words: d.missing.join(', ') });
        if (d.short) html += twoLines(V.both.need_five);
        msg.innerHTML = html;
      } else {
        msg.className = 'turn-msg bad'; msg.textContent = (d && d.error) || T['videos.save_error'];
      }
    })
    .catch(function() { btn.disabled = false; btn.textContent = T['videos.check']; msg.className = 'turn-msg bad'; msg.textContent = T['videos.save_error']; });
}
</script>
<?php endif; ?>
</main>
</div>
</body>
</html>
