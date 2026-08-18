<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Tests</title>
<link rel="stylesheet" href="components/base.css">
<style>
  .question-card {
    background: rgba(255,252,245,0.6);
    border: 1px solid rgba(184,145,46,0.2);
    border-radius: 16px; padding: 32px; max-width: 620px;
  }
  .question-text { font-size: 18px; color: var(--warm-white); margin-bottom: 28px; line-height: 1.6; }
  .choices { display: flex; flex-direction: column; gap: 12px; }
  .choice-btn {
    background: rgba(255,255,255,0.5);
    border: 1px solid rgba(184,145,46,0.3);
    border-radius: 10px; padding: 14px 18px;
    color: var(--text-main); font-size: 15px;
    font-family: inherit; text-align: left;
    cursor: pointer; transition: all 0.2s;
  }
  .choice-btn:hover { background: rgba(184,145,46,0.12); border-color: rgba(184,145,46,0.5); }
  .choice-btn.correct { background: rgba(47,122,79,0.15); border-color: rgba(47,122,79,0.5); color: #2f7a4f; }
  .choice-btn.wrong   { background: rgba(179,38,30,0.12); border-color: rgba(179,38,30,0.5); color: #b3261e; }
  .choice-btn:disabled { cursor: default; }
  .result-msg {
    margin-top: 20px; padding: 14px 18px;
    border-radius: 10px; font-size: 15px; font-weight: 500;
    display: none;
  }
  .result-msg.correct { background: rgba(47,122,79,0.1); color: #2f7a4f; border: 1px solid rgba(47,122,79,0.3); }
  .result-msg.wrong   { background: rgba(179,38,30,0.08); color: #b3261e; border: 1px solid rgba(179,38,30,0.3); }
  .next-btn {
    margin-top: 20px; display: none;
    background: rgba(184,145,46,0.15);
    border: 1px solid rgba(184,145,46,0.4);
    border-radius: 8px; padding: 11px 24px;
    color: var(--gold-light); font-size: 14px;
    font-weight: 500; cursor: pointer; font-family: inherit;
    transition: all 0.2s;
  }
  .next-btn:hover { background: rgba(184,145,46,0.25); }
  .score-bar { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
  .score-bar span { color: var(--gold-light); font-weight: 500; }
  .no-content { color: var(--text-muted); font-size: 14px; padding: 40px 0; text-align: center; }
  .chapter-btn .status { display: block; margin-top: 8px; font-size: 11px; font-weight: 600; color: #2f7a4f; }
  .chapter-btn .status.take  { color: var(--gold-light); }
  .chapter-btn .status.muted { color: var(--text-dim); font-weight: 400; }
</style>
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
) );
?>
<script>
// ── State ─────────────────────────────────────────
var allBank        = []; // every row (homework + test), used for lock calc AND test content
var allSeen        = [];
var allWrong       = [];
var allTestScores   = [];
var currentLevel   = null;
var currentChapter = null;
var currentQ       = [];
var currentIndex   = 0;
var score          = 0;

var IMAGE_FOLDER = 'images/vocab/';
var AUDIO_FOLDER = 'audio/';

window.addEventListener('DOMContentLoaded', function() {
  Promise.all([ loadCSV(), loadSeen(), loadWrong(), loadTestScores() ]).then(renderLevels).catch(renderLevels);
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
function loadSeen() {
  return fetch('inc/seen.php')
    .then(function(r) { return r.json(); })
    .then(function(data) { allSeen = (data && data.seen) ? data.seen : []; })
    .catch(function() { allSeen = []; });
}
function loadWrong() {
  return fetch('inc/mistakes.php')
    .then(function(r) { return r.json(); })
    .then(function(data) { allWrong = (data && data.current_wrong) ? data.current_wrong : []; })
    .catch(function() { allWrong = []; });
}
function loadTestScores() {
  return fetch('inc/test-scores.php')
    .then(function(r) { return r.json(); })
    .then(function(data) { allTestScores = (data && data.scores) ? data.scores : []; })
    .catch(function() { allTestScores = []; });
}

// ── Lock status (mirrors homework.php exactly - a chapter/level's
// lock state is driven by Homework progress, not Test progress) ──
function homeworkQuestionsForType(level, chapter, type) {
  if (type === 'vocabulary') {
    return allBank.filter(function(q) {
      return q.mode === 'homework' && q.level === level && q.chapter === chapter
        && (q.type === 'vocabulary' || q.type === 'photo');
    });
  }
  return allBank.filter(function(q) {
    return q.mode === 'homework' && q.level === level && q.chapter === chapter && q.type === type;
  });
}
function isHomeworkTypeFinished(level, chapter, type) {
  var qs = homeworkQuestionsForType(level, chapter, type);
  if (!qs.length) return false;
  return qs.every(function(q) {
    return allSeen.indexOf(q.id) !== -1 && allWrong.indexOf(q.id) === -1;
  });
}
function isChapterFullyFinished(level, chapter) {
  var types = ['vocabulary', 'grammar', 'listening'];
  var n = 0;
  types.forEach(function(t) { if (isHomeworkTypeFinished(level, chapter, t)) n++; });
  return n === 3;
}
function isLevelUnlocked(level) {
  if (level <= 1) return true;
  for (var c = 1; c <= 16; c++) {
    if (!isChapterFullyFinished(level - 1, c)) return false;
  }
  return true;
}
function isChapterUnlocked(level, chapter) {
  if (!isLevelUnlocked(level)) return false;
  if (chapter <= 1) return true;
  return isChapterFullyFinished(level, chapter - 1);
}

// ── Test content & scores ──────────────────────────
function testQuestionsForChapter(level, chapter) {
  return allBank.filter(function(q) {
    return q.mode === 'test' && q.level === level && q.chapter === chapter;
  });
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
  for (var c = 1; c <= 16; c++) {
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
  currentQ     = testQuestionsForChapter(currentLevel, currentChapter);
  currentIndex = 0;
  score        = 0;
  showQuestion();
}

function showQuestion() {
  var total = currentQ.length;
  var html = '<div class="section-header"><h2>' + H212_T['tests.test_label'] + '</h2></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.tests'] + '</span><span class="sep">›</span>'
    + '<span>' + H212_T['hw.level'] + ' ' + currentLevel + '</span><span class="sep">›</span>'
    + '<span>' + H212_T['hw.chapter'] + ' ' + currentChapter + '</span></div>'
    + '<button class="back-btn" onclick="renderChapters(' + currentLevel + ')">' + H212_T['hw.back'] + '</button>';

  if (!total) {
    html += '<div class="no-content">' + H212_T['tests.no_content'] + '</div>';
    getPC().innerHTML = html;
    return;
  }

  var q = currentQ[currentIndex];

  html += '<div class="score-bar">' + H212_T['hw.question'] + ' <span>' + (currentIndex + 1) + ' ' + H212_T['hw.of'] + ' ' + total + '</span>'
    + ' &nbsp;·&nbsp; ' + H212_T['hw.score'] + ' <span>' + score + '</span></div>'
    + '<div class="question-card">';

  if (q.image) {
    html += '<div class="photo-img-wrap"><img src="' + IMAGE_FOLDER + q.image + '" alt="' + esc(q.answer) + '"'
      + ' onerror="this.style.opacity=\'0.3\';" /></div>';
  }
  if (q.audio) {
    html += '<div class="audio-wrap"><audio controls preload="none" src="' + AUDIO_FOLDER + q.audio + '"></audio></div>';
  }

  html += '<div class="question-text">' + q.question + '</div>'
    + '<div class="choices">'
    + '<button class="choice-btn" onclick="checkAnswer(this, \'' + esc(q.choice_a) + '\', \'' + esc(q.answer) + '\')">' + q.choice_a + '</button>'
    + '<button class="choice-btn" onclick="checkAnswer(this, \'' + esc(q.choice_b) + '\', \'' + esc(q.answer) + '\')">' + q.choice_b + '</button>'
    + '<button class="choice-btn" onclick="checkAnswer(this, \'' + esc(q.choice_c) + '\', \'' + esc(q.answer) + '\')">' + q.choice_c + '</button>'
    + '</div>'
    + '<div class="result-msg" id="result-msg"></div>';

  if (currentIndex + 1 < total) {
    html += '<button class="next-btn" id="next-btn" onclick="nextQuestion()">' + H212_T['hw.next_question'] + '</button>';
  } else {
    html += '<button class="next-btn" id="next-btn" onclick="showFinish()">' + H212_T['hw.see_results'] + '</button>';
  }

  html += '</div>';
  getPC().innerHTML = html;
}

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
    + '</div></div>';

  getPC().innerHTML = html;
}
</script>
</main>
</div>
</body>
</html>
