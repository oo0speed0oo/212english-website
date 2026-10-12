<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Tests</title>
<link rel="stylesheet" href="components/base.css?v=<?php echo (int) filemtime( __DIR__ . '/components/base.css' ); ?>">
</head>
<body>
<?php
require __DIR__ . '/inc/nav.php';
h212_render_nav( 'tests' );
h212_js_strings( array(
	'nav.tests', 'tests.choose_level_chapter', 'hw.back_levels', 'hw.back_chapters', 'hw.back',
	'hw.level', 'hw.chapter', 'tests.test_label', 'tests.no_content', 'tests.take', 'tests.already_taken',
	'hw.locked_level', 'hw.locked_chapter', 'hw.question', 'hw.of', 'hw.score', 'hw.correct_msg',
	'hw.wrong_msg', 'hw.next_question', 'hw.see_results', 'hw.results', 'hw.correct_word',
	'hw.start_again', 'hw.back_to_topics', 'hw.best_score',
	'builder.instruction', 'builder.empty', 'builder.check', 'builder.clear', 'builder.wrong_msg', 'conv.prompt',
	'listen.who', 'listen.robot', 'listen.button', 'listen.playing', 'listen.no_voice',
	'listen.mix', 'listen.us_woman', 'listen.us_man', 'listen.uk_woman', 'listen.uk_man',
) );
require_once __DIR__ . '/inc/voices.php';
h212_voice_script();
require_once __DIR__ . '/inc/mike.php';
h212_mike_for_js();
?>
<script src="components/listen.js?v=<?php echo (int) filemtime( __DIR__ . '/components/listen.js' ); ?>"></script>
<script src="components/mike.js?v=<?php echo (int) filemtime( __DIR__ . '/components/mike.js' ); ?>"></script>
<script src="components/ui.js?v=<?php echo (int) filemtime( __DIR__ . '/components/ui.js' ); ?>"></script>
<script src="components/builder.js?v=<?php echo (int) filemtime( __DIR__ . '/components/builder.js' ); ?>"></script>
<script>window.H212_NONCE = "<?php echo esc_js( wp_create_nonce( 'h212_save_score' ) ); ?>";</script>
<script>
// ── State ─────────────────────────────────────────
var allBank        = []; // every row (homework + test) - test rows make up the tests
var builderTests   = []; // Sentence Builder rows marked mode=test (3 random ones are added to each test)
var progress       = null; // unlock state from inc/progress.php (rules live in one place, on the server)
var allTestScores   = [];
var currentLevel   = null;
var currentChapter = null;
var currentQ       = [];
var currentIndex   = 0;
var score          = 0;

var IMAGE_FOLDER = 'images/vocab/';
var AUDIO_FOLDER = 'audio/';

window.addEventListener('DOMContentLoaded', function() {
  Promise.all([ loadCSV(), loadBuilderTests(), loadProgress(), loadTestScores() ]).then(renderLevels).catch(renderLevels);
});

// ── Load & parse CSV (same robust parser as homework.php) ──
function splitCSVLine(line) {
  var result = [];
  var cur = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}
function parseCSV(text) {
  var lines  = text.trim().split('\n');
  var header = splitCSVLine(lines[0]).map(function(h) { return h.trim().toLowerCase(); });
  var rows   = [];
  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    var cols = splitCSVLine(lines[i]);
    var get = function(name) {
      var idx = header.indexOf(name);
      return (idx === -1 || cols[idx] === undefined) ? '' : cols[idx].trim();
    };
    if (get('level') === '' || get('type') === '') continue;
    rows.push({
      id: get('id'), level: parseInt(get('level')), chapter: parseInt(get('chapter')),
      type: get('type').toLowerCase(), question: get('question'),
      choice_a: get('choice_a'), choice_b: get('choice_b'), choice_c: get('choice_c'),
      answer: get('answer'), image: get('image'), audio: get('audio'),
      mode: get('mode') === 'test' ? 'test' : 'homework'
    });
  }
  return rows;
}
function loadCSV() {
  return fetch('homework-content.csv')
    .then(function(r) { return r.text(); })
    .then(function(text) { allBank = parseCSV(text); })
    .catch(function() { allBank = []; });
}
function loadBuilderTests() {
  return fetch('build-content.csv')
    .then(function(r) { return r.ok ? r.text() : ''; })
    .then(function(text) {
      builderTests = text ? H212Builder.parse(text).filter(function(q) { return q.mode === 'test'; }) : [];
    })
    .catch(function() { builderTests = []; });
}
function loadProgress() {
  return fetch('inc/progress.php', { cache: 'no-store' })
    .then(function(r) { return r.json(); })
    .then(function(data) { progress = (data && data.chapters) ? data.chapters : null; })
    .catch(function() { progress = null; });
}
function loadTestScores() {
  return fetch('inc/test-scores.php')
    .then(function(r) { return r.json(); })
    .then(function(data) { allTestScores = (data && data.scores) ? data.scores : []; })
    .catch(function() { allTestScores = []; });
}

// ── Lock status: same as Homework - a chapter's test opens when its
// Homework chapter is open (the rule is on the server, see inc/progress.php).
// If the progress file could not be loaded, nothing is locked.
function isChapterUnlocked(level, chapter) {
  if (!progress) return true;
  var p = progress[level + '-' + chapter];
  return p ? !!p.u : false;
}
function isLevelUnlocked(level) {
  return isChapterUnlocked(level, 1);
}

// ── Test content & scores ──────────────────────────
function testQuestionsForChapter(level, chapter) {
  return allBank.filter(function(q) {
    return q.mode === 'test' && q.level === level && q.chapter === chapter;
  });
}
// 3 random Sentence Builder test questions for a chapter (fewer if it has fewer)
function pickBuilderTests(level, chapter) {
  var pool = builderTests.filter(function(q) { return q.level === level && q.chapter === chapter; });
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  return pool.slice(0, 3);
}
function testScoresFor(level, chapter) {
  return allTestScores.filter(function(s) { return s.level === level && s.chapter === chapter; });
}
function bestTestScore(level, chapter) {
  var list = testScoresFor(level, chapter);
  if (!list.length) return null;
  var best = list[0];
  for (var i = 1; i < list.length; i++) {
    if ((list[i].score / list[i].total) > (best.score / best.total)) best = list[i];
  }
  return best;
}
function isTestTaken(level, chapter) {
  return testScoresFor(level, chapter).length > 0;
}
function saveTestScore(level, chapter, score, total) {
  return fetch('inc/test-scores.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: window.H212_NONCE, level: level, chapter: chapter, score: score, total: total })
  })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data && data.scores) allTestScores = data.scores; })
    .catch(function() {});
}

// ── Navigation ────────────────────────────────────
function getPC() { return document.getElementById('page-content'); }

function renderLevels() {
  currentLevel = null; currentChapter = null;
  var html = '<div class="section-header"><h2>' + H212_T['nav.tests'] + '</h2><p>' + H212_T['tests.choose_level_chapter'] + '</p></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.tests'] + '</span></div>'
    + '<div class="level-grid">';
  for (var i = 1; i <= 5; i++) {
    if (isLevelUnlocked(i)) {
      html += '<div class="level-btn" onclick="renderChapters(' + i + ')">'
        + '<span class="num">' + i + '</span><span class="lbl">' + H212_T['hw.level'] + ' ' + i + '</span></div>';
    } else {
      html += '<div class="level-btn locked" title="' + H212_T['hw.locked_level'] + '">'
        + '<span class="lock-icon">🔒</span><span class="num">' + i + '</span><span class="lbl">' + H212_T['hw.level'] + ' ' + i + '</span></div>';
    }
  }
  html += '</div>';
  getPC().innerHTML = html;
}

function renderChapters(lvl) {
  if (!isLevelUnlocked(lvl)) { renderLevels(); return; }
  currentLevel = lvl; currentChapter = null;
  var html = '<div class="section-header"><h2>' + H212_T['nav.tests'] + '</h2></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.tests'] + '</span><span class="sep">›</span><span>' + H212_T['hw.level'] + ' ' + lvl + '</span></div>'
    + '<button class="back-btn" onclick="renderLevels()">' + H212_T['hw.back_levels'] + '</button>'
    + '<div class="chapter-grid">';
  for (var c = 1; c <= 17; c++) {
    if (!isChapterUnlocked(lvl, c)) {
      html += '<div class="chapter-btn locked" title="' + H212_T['hw.locked_chapter'] + '">'
        + '<span class="lock-icon">🔒</span><span class="num">' + c + '</span><span class="lbl">' + H212_T['hw.chapter'] + ' ' + c + '</span></div>';
      continue;
    }
    var qs = testQuestionsForChapter(lvl, c);
    if (!qs.length) {
      html += '<div class="chapter-btn" style="opacity:0.6;cursor:default;">'
        + '<span class="num">' + c + '</span><span class="lbl">' + H212_T['hw.chapter'] + ' ' + c + '</span>'
        + '<span class="status muted">' + H212_T['tests.no_content'] + '</span></div>';
      continue;
    }
    var best = bestTestScore(lvl, c);
    var statusHtml = best
      ? '<span class="status">✓ ' + best.score + '/' + best.total + '</span>'
      : '<span class="status take">' + H212_T['tests.take'] + '</span>';
    html += '<div class="chapter-btn" onclick="openTest(' + c + ')">'
      + '<span class="num">' + c + '</span><span class="lbl">' + H212_T['hw.chapter'] + ' ' + c + '</span>' + statusHtml + '</div>';
  }
  html += '</div>';
  getPC().innerHTML = html;
}

// ── Taking a test ───────────────────────────────────
function openTest(ch) {
  if (!isChapterUnlocked(currentLevel, ch) || !testQuestionsForChapter(currentLevel, ch).length) {
    renderChapters(currentLevel);
    return;
  }
  currentChapter = ch;
  if (isTestTaken(currentLevel, ch)) {
    showRetakeConfirm();
  } else {
    beginTest();
  }
}

function showRetakeConfirm() {
  var best = bestTestScore(currentLevel, currentChapter);
  var html = '<div class="section-header"><h2>' + H212_T['tests.test_label'] + '</h2></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.tests'] + '</span><span class="sep">›</span>'
    + '<span>' + H212_T['hw.level'] + ' ' + currentLevel + '</span><span class="sep">›</span>'
    + '<span>' + H212_T['hw.chapter'] + ' ' + currentChapter + '</span></div>'
    + '<button class="back-btn" onclick="renderChapters(' + currentLevel + ')">' + H212_T['hw.back_chapters'] + '</button>'
    + '<div class="question-card" style="text-align:center">'
    + '<div style="font-size:40px;margin-bottom:16px">✅</div>'
    + '<div style="font-size:18px;color:var(--warm-white);margin-bottom:8px;font-weight:500">' + H212_T['tests.already_taken'] + '</div>'
    + (best ? '<div style="font-size:14px;color:var(--text-muted);margin-bottom:28px">' + H212_T['hw.best_score'] + ' ' + best.score + '/' + best.total + '</div>' : '')
    + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button class="next-btn" style="display:inline-flex" onclick="beginTest()">' + H212_T['hw.start_again'] + '</button>'
    + '<button class="next-btn" style="display:inline-flex" onclick="renderChapters(' + currentLevel + ')">' + H212_T['hw.back_to_topics'] + '</button>'
    + '</div></div>';
  getPC().innerHTML = html;
}

function beginTest() {
  currentQ     = testQuestionsForChapter(currentLevel, currentChapter)
    .concat(pickBuilderTests(currentLevel, currentChapter));
  currentIndex = 0;
  score        = 0;
  showQuestion();
}

function showQuestion() {
  var total = currentQ.length;
  var html = '';

  if (!total) {
    html += '<button class="back-btn" onclick="renderChapters(' + currentLevel + ')">' + H212_T['hw.back'] + '</button>'
      + '<div class="no-content">' + H212_T['tests.no_content'] + '</div>';
    getPC().innerHTML = html;
    return;
  }

  var q = currentQ[currentIndex];

  html += H212UI.qTop({ onclose: 'renderChapters(' + currentLevel + ')', label: H212_T['hw.back'], index: currentIndex, total: total, score: score, scoreWord: H212_T['hw.score'].replace(/:$/, '') })
    + '<div class="q-label">' + H212_T['tests.test_label'] + ' · ' + H212_T['hw.level'] + ' ' + currentLevel + ' · ' + H212_T['hw.chapter'] + ' ' + currentChapter + '</div>'
    + '<div class="question-card">';

  if (q.image) {
    html += '<div class="photo-img-wrap"><img src="' + IMAGE_FOLDER + q.image + '" alt="' + esc(q.answer) + '"'
      + ' onerror="this.style.opacity=\'0.3\';" /></div>';
  }
  if (q.audio) {
    html += '<div class="audio-wrap"><audio controls preload="none" src="' + AUDIO_FOLDER + q.audio + '"></audio></div>';
  }

  if (q.type === 'builder') {
    // Sentence Builder: tap word tiles into order (checked by H212Builder)
    html += H212Builder.render(q);
  } else {
    // Listening / Conversation questions with a spoken line: hide the line, show a Listen button instead
    var listenHtml = (typeof H212Listen !== 'undefined') ? H212Listen.render(q) : null;
    html += (listenHtml !== null ? listenHtml : '<div class="question-text">' + q.question + '</div>')
      + '<div class="choices">'
      + '<button class="choice-btn" onclick="checkAnswer(this, \'' + esc(q.choice_a) + '\', \'' + esc(q.answer) + '\')">' + q.choice_a + '</button>'
      + '<button class="choice-btn" onclick="checkAnswer(this, \'' + esc(q.choice_b) + '\', \'' + esc(q.answer) + '\')">' + q.choice_b + '</button>'
      + '<button class="choice-btn" onclick="checkAnswer(this, \'' + esc(q.choice_c) + '\', \'' + esc(q.answer) + '\')">' + q.choice_c + '</button>'
      + '</div>'
      + '<div class="result-msg" id="result-msg"></div>';
  }

  if (currentIndex + 1 < total) {
    html += '<button class="next-btn" id="next-btn" onclick="nextQuestion()">' + H212_T['hw.next_question'] + '</button>';
  } else {
    html += '<button class="next-btn" id="next-btn" onclick="showFinish()">' + H212_T['hw.see_results'] + '</button>';
  }

  html += '</div>' + H212Mike.row();
  getPC().innerHTML = html;
  if (q.type === 'builder') H212Builder.afterRender();
  // Mike gives a short hint (his mouth moves only on the first question)
  H212Mike.say('hint_test', currentIndex === 0);
}

// Sentence Builder was checked (tests only count the score)
H212Builder.onChecked = function(res) {
  if (res.correct) score++;
  document.getElementById('next-btn').style.display = 'inline-flex';
  H212Mike.say(res.correct ? 'correct' : 'wrong');
};

function esc(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function checkAnswer(btn, chosen, answer) {
  var btns = document.querySelectorAll('.choice-btn');
  btns.forEach(function(b) { b.disabled = true; });

  var msg  = document.getElementById('result-msg');
  var next = document.getElementById('next-btn');

  if (chosen === answer) {
    btn.classList.add('correct');
    msg.textContent = H212_T['hw.correct_msg'];
    msg.className = 'result-msg correct';
    score++;
  } else {
    btn.classList.add('wrong');
    msg.textContent = H212_T['hw.wrong_msg'] + ' ' + answer;
    msg.className = 'result-msg wrong';
    btns.forEach(function(b) {
      if (b.textContent.trim() === answer) b.classList.add('correct');
    });
  }

  msg.style.display  = 'block';
  next.style.display = 'inline-flex';
  H212Mike.say(chosen === answer ? 'correct' : 'wrong');
}

function nextQuestion() {
  currentIndex++;
  showQuestion();
}

function showFinish() {
  var total = currentQ.length;
  var pct   = Math.round((score / total) * 100);
  var emoji = pct === 100 ? '🏆' : pct >= 70 ? '😊' : '💪';

  saveTestScore(currentLevel, currentChapter, score, total);

  var html = '<div class="section-header"><h2>' + H212_T['hw.results'] + '</h2></div>'
    + '<div class="question-card" style="text-align:center">'
    + '<div style="font-size:48px;margin-bottom:16px">' + emoji + '</div>'
    + '<div style="font-size:22px;color:var(--warm-white);margin-bottom:8px;font-weight:500">'
    + score + ' / ' + total + ' ' + H212_T['hw.correct_word'] + '</div>'
    + '<div style="font-size:14px;color:var(--text-muted);margin-bottom:28px">'
    + H212_T['tests.test_label'] + ' · ' + H212_T['hw.level'] + ' ' + currentLevel + ' · ' + H212_T['hw.chapter'] + ' ' + currentChapter + '</div>'
    + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button class="next-btn" style="display:inline-flex" onclick="beginTest()">' + H212_T['hw.start_again'] + '</button>'
    + '<button class="next-btn" style="display:inline-flex" onclick="renderChapters(' + currentLevel + ')">' + H212_T['hw.back_to_topics'] + '</button>'
    + '</div></div>' + H212Mike.row();

  getPC().innerHTML = html;
  H212Mike.say(pct === 100 ? 'finish_perfect' : (pct >= 70 ? 'finish_good' : 'finish_try'));
}
</script>
</main>
</div>
</body>
</html>
