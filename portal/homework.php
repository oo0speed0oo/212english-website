<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Homework</title>
<link rel="stylesheet" href="components/base.css">
<style>
  .question-card {
    background: rgba(255,252,245,0.6);
    border: 1px solid rgba(184,145,46,0.2);
    border-radius: 16px; padding: 32px; max-width: 620px;
  }
  .question-text {
    font-size: 18px; color: var(--warm-white);
    margin-bottom: 28px; line-height: 1.6;
  }
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
    margin-top: 20px;
    display: none;
    background: rgba(184,145,46,0.15);
    border: 1px solid rgba(184,145,46,0.4);
    border-radius: 8px; padding: 11px 24px;
    color: var(--gold-light); font-size: 14px;
    font-weight: 500; cursor: pointer; font-family: inherit;
    transition: all 0.2s;
  }
  .next-btn:hover { background: rgba(184,145,46,0.25); }
  .score-bar {
    font-size: 13px; color: var(--text-muted);
    margin-bottom: 20px;
  }
  .score-bar span { color: var(--gold-light); font-weight: 500; }
  .loading-msg { color: var(--text-muted); font-size: 14px; padding: 40px 0; }
  .no-content {
    color: var(--text-muted); font-size: 14px; padding: 40px 0;
    text-align: center;
  }

  /* ── Photo question image ── */
  .photo-img-wrap {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-start;
  }
  .photo-img-wrap img {
    width: 180px;
    height: 180px;
    object-fit: contain;
    border-radius: 12px;
    background: rgba(255,255,255,0.5);
    border: 1px solid rgba(184,145,46,0.3);
    padding: 10px;
  }
  .audio-wrap { margin-bottom: 20px; }
  .audio-wrap audio { width: 100%; max-width: 320px; }
  .photo-badge {
    display: inline-block;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold-light);
    background: rgba(184,145,46,0.1);
    border: 1px solid rgba(184,145,46,0.25);
    border-radius: 6px;
    padding: 3px 10px;
    margin-bottom: 14px;
  }
</style>
</head>
<body>
<?php
require __DIR__ . '/inc/nav.php';
h212_render_nav( 'homework' );
h212_js_strings( array(
	'nav.homework', 'hw.choose_level', 'hw.choose_chapter', 'hw.choose_study',
	'hw.back_levels', 'hw.back_chapters', 'hw.back', 'hw.level', 'hw.chapter',
	'hw.vocabulary', 'hw.vocab_sub', 'hw.grammar', 'hw.grammar_sub',
	'hw.listening', 'hw.listening_sub', 'hw.no_content', 'hw.question', 'hw.of',
	'hw.score', 'hw.correct_msg', 'hw.wrong_msg', 'hw.next_question',
	'hw.see_results', 'hw.results', 'hw.correct_word', 'hw.try_again',
	'hw.back_to_topics', 'hw.photo_question', 'hw.finished_badge',
	'hw.already_finished', 'hw.best_score', 'hw.start_again', 'hw.needs_review',
	'hw.locked_level', 'hw.locked_chapter',
) );
?>
<script>window.H212_NONCE = "<?php echo esc_js( wp_create_nonce( 'h212_save_score' ) ); ?>";</script>
<script>

// ── State ─────────────────────────────────────────
var allQuestions = [];
var allScores     = []; // every quiz attempt this student has ever submitted
var allSeen       = []; // ids of every individual question this student has ever answered
var allWrong      = []; // ids of questions currently answered wrong (cleared once corrected)
var currentLevel   = null;
var currentChapter = null;
var currentType    = null;
var currentQ       = [];
var currentIndex   = 0;
var score          = 0;

// Folders where your vocab photos / audio clips live on the server
var IMAGE_FOLDER = 'images/vocab/';
var AUDIO_FOLDER = 'audio/';

// ── Boot ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  Promise.all([ loadCSV(), loadScores(), loadSeen(), loadWrong() ]).then(renderLevels).catch(renderLevels);
});

// ── Load & parse CSV ──────────────────────────────
function loadCSV() {
  return fetch('homework-content.csv')
    .then(function(r) { return r.text(); })
    .then(function(text) { allQuestions = parseCSV(text); })
    .catch(function() { allQuestions = []; });
}

// ── Load this student's saved scores ──────────────
function loadScores() {
  return fetch('inc/scores.php')
    .then(function(r) { return r.json(); })
    .then(function(data) { allScores = (data && data.scores) ? data.scores : []; })
    .catch(function() { allScores = []; });
}

// ── Load which questions this student has already answered ──
function loadSeen() {
  return fetch('inc/seen.php')
    .then(function(r) { return r.json(); })
    .then(function(data) { allSeen = (data && data.seen) ? data.seen : []; })
    .catch(function() { allSeen = []; });
}
function markSeen(id) {
  if (!id || allSeen.indexOf(id) !== -1) return;
  allSeen.push(id);
  fetch('inc/seen.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: window.H212_NONCE, id: id })
  }).catch(function() {});
}

// ── Load / record wrong answers ────────────────────
function loadWrong() {
  return fetch('inc/mistakes.php')
    .then(function(r) { return r.json(); })
    .then(function(data) { allWrong = (data && data.current_wrong) ? data.current_wrong : []; })
    .catch(function() { allWrong = []; });
}
function recordMistake(q, correct, chosen) {
  if (correct) {
    var idx = allWrong.indexOf(q.id);
    if (idx !== -1) allWrong.splice(idx, 1);
  } else if (allWrong.indexOf(q.id) === -1) {
    allWrong.push(q.id);
  }
  fetch('inc/mistakes.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nonce: window.H212_NONCE, id: q.id, correct: correct,
      level: currentLevel, chapter: currentChapter, type: currentType,
      question: q.question, chosen: chosen, correct_answer: q.answer
    })
  }).catch(function() {});
}

// ── Score helpers ──────────────────────────────────
function questionsForType(level, chapter, type) {
  if (type === 'vocabulary') {
    return allQuestions.filter(function(q) {
      return q.level === level && q.chapter === chapter
        && (q.type === 'vocabulary' || q.type === 'photo');
    });
  }
  return allQuestions.filter(function(q) {
    return q.level === level && q.chapter === chapter && q.type === type;
  });
}
function unseenQuestionsForType(level, chapter, type) {
  return questionsForType(level, chapter, type).filter(function(q) {
    return allSeen.indexOf(q.id) === -1;
  });
}
function wrongQuestionsForType(level, chapter, type) {
  return questionsForType(level, chapter, type).filter(function(q) {
    return allWrong.indexOf(q.id) !== -1;
  });
}
function scoresFor(level, chapter, type) {
  return allScores.filter(function(s) {
    return s.level === level && s.chapter === chapter && s.type === type;
  });
}
function bestScore(level, chapter, type) {
  var list = scoresFor(level, chapter, type);
  if (!list.length) return null;
  var best = list[0];
  for (var i = 1; i < list.length; i++) {
    // Compare by percentage, since a resumed quiz can have a smaller
    // total than a full one and still be a better result.
    if ((list[i].score / list[i].total) > (best.score / best.total)) best = list[i];
  }
  return best;
}
function isTypeFinished(level, chapter, type) {
  var qs = questionsForType(level, chapter, type);
  return qs.length > 0
    && unseenQuestionsForType(level, chapter, type).length === 0
    && wrongQuestionsForType(level, chapter, type).length === 0;
}
function chapterFinishedCount(level, chapter) {
  var types = ['vocabulary', 'grammar', 'listening'];
  var n = 0;
  types.forEach(function(t) { if (isTypeFinished(level, chapter, t)) n++; });
  return n;
}
function isChapterFullyFinished(level, chapter) {
  return chapterFinishedCount(level, chapter) === 3;
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
function saveScore(level, chapter, type, score, total) {
  return fetch('inc/scores.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nonce: window.H212_NONCE, level: level, chapter: chapter,
      type: type, score: score, total: total
    })
  })
    .then(function(r) { return r.json(); })
    .then(function(data) { if (data && data.scores) allScores = data.scores; })
    .catch(function() {});
}

// Splits one CSV line into fields, respecting "quoted, fields" (with ""
// as an escaped quote inside one) - a plain split(',') breaks the
// moment any field contains a comma or a quote mark.
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
      id:       get('id'),
      level:    parseInt(get('level')),
      chapter:  parseInt(get('chapter')),
      type:     get('type').toLowerCase(),
      question: get('question'),
      choice_a: get('choice_a'),
      choice_b: get('choice_b'),
      choice_c: get('choice_c'),
      answer:   get('answer'),
      image:    get('image'),
      audio:    get('audio')
    });
  }
  return rows;
}

// ── Navigation ────────────────────────────────────
function getPC() { return document.getElementById('page-content'); }

function typeLabel(type) {
  if (type === 'vocabulary') return H212_T['hw.vocabulary'];
  if (type === 'grammar')    return H212_T['hw.grammar'];
  if (type === 'listening')  return H212_T['hw.listening'];
  return type;
}

function renderLevels() {
  currentLevel = null; currentChapter = null; currentType = null;
  var html = '<div class="section-header"><h2>' + H212_T['nav.homework'] + '</h2><p>' + H212_T['hw.choose_level'] + '</p></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.homework'] + '</span></div>'
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
  currentLevel = lvl; currentChapter = null; currentType = null;
  var html = '<div class="section-header"><h2>' + H212_T['nav.homework'] + '</h2><p>' + H212_T['hw.choose_chapter'] + '</p></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.homework'] + '</span><span class="sep">›</span><span>' + H212_T['hw.level'] + ' ' + lvl + '</span></div>'
    + '<button class="back-btn" onclick="renderLevels()">' + H212_T['hw.back_levels'] + '</button>'
    + '<div class="chapter-grid">';
  for (var c = 1; c <= 16; c++) {
    if (isChapterUnlocked(lvl, c)) {
      var done = chapterFinishedCount(lvl, c);
      var badge = done > 0
        ? '<span class="chapter-progress' + (done === 3 ? ' done' : '') + '">' + done + '/3</span>'
        : '';
      html += '<div class="chapter-btn" onclick="renderTypes(' + c + ')">'
        + badge
        + '<span class="num">' + c + '</span><span class="lbl">' + H212_T['hw.chapter'] + ' ' + c + '</span></div>';
    } else {
      html += '<div class="chapter-btn locked" title="' + H212_T['hw.locked_chapter'] + '">'
        + '<span class="lock-icon">🔒</span><span class="num">' + c + '</span><span class="lbl">' + H212_T['hw.chapter'] + ' ' + c + '</span></div>';
    }
  }
  html += '</div>';
  getPC().innerHTML = html;
}

function renderTypes(ch) {
  if (!isChapterUnlocked(currentLevel, ch)) { renderChapters(currentLevel); return; }
  currentChapter = ch; currentType = null;
  var html = '<div class="section-header"><h2>' + H212_T['nav.homework'] + '</h2><p>' + H212_T['hw.choose_study'] + '</p></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.homework'] + '</span><span class="sep">›</span><span>' + H212_T['hw.level'] + ' ' + currentLevel + '</span><span class="sep">›</span><span>' + H212_T['hw.chapter'] + ' ' + ch + '</span></div>'
    + '<button class="back-btn" onclick="renderChapters(' + currentLevel + ')">' + H212_T['hw.back_chapters'] + '</button>'
    + '<div class="type-grid">'
    + '<div class="type-btn" onclick="startQuiz(\'vocabulary\')">'
    +   '<span class="icon">📖</span><span class="lbl">' + H212_T['hw.vocabulary'] + '</span><span class="sub">' + H212_T['hw.vocab_sub'] + '</span>' + typeStatusHtml(currentLevel, ch, 'vocabulary') + '</div>'
    + '<div class="type-btn" onclick="startQuiz(\'grammar\')">'
    +   '<span class="icon">✏️</span><span class="lbl">' + H212_T['hw.grammar'] + '</span><span class="sub">' + H212_T['hw.grammar_sub'] + '</span>' + typeStatusHtml(currentLevel, ch, 'grammar') + '</div>'
    + '<div class="type-btn" onclick="startQuiz(\'listening\')">'
    +   '<span class="icon">🎧</span><span class="lbl">' + H212_T['hw.listening'] + '</span><span class="sub">' + H212_T['hw.listening_sub'] + '</span>' + typeStatusHtml(currentLevel, ch, 'listening') + '</div>'
    + '</div>';
  getPC().innerHTML = html;
}

function typeStatusHtml(level, chapter, type) {
  if (isTypeFinished(level, chapter, type)) {
    var best = bestScore(level, chapter, type);
    if (!best) return '';
    return '<span class="status">✓ ' + H212_T['hw.finished_badge'] + ' · ' + best.score + '/' + best.total + '</span>';
  }
  var wrongCount = wrongQuestionsForType(level, chapter, type).length;
  if (wrongCount > 0 && unseenQuestionsForType(level, chapter, type).length === 0) {
    return '<span class="status wrong">⚠ ' + wrongCount + ' ' + H212_T['hw.needs_review'] + '</span>';
  }
  return '';
}

// ── Quiz ──────────────────────────────────────────
function startQuiz(type) {
  if (isTypeFinished(currentLevel, currentChapter, type)) {
    showRetakeConfirm(type);
  } else {
    beginQuiz(type);
  }
}

function showRetakeConfirm(type) {
  var best     = bestScore(currentLevel, currentChapter, type);
  var typeName = typeLabel(type);
  var html = '<div class="section-header"><h2>' + typeName + '</h2></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.homework'] + '</span><span class="sep">›</span>'
    + '<span>' + H212_T['hw.level'] + ' ' + currentLevel + '</span><span class="sep">›</span>'
    + '<span>' + H212_T['hw.chapter'] + ' ' + currentChapter + '</span><span class="sep">›</span>'
    + '<span>' + typeName + '</span></div>'
    + '<button class="back-btn" onclick="renderTypes(' + currentChapter + ')">' + H212_T['hw.back'] + '</button>'
    + '<div class="question-card" style="text-align:center">'
    + '<div style="font-size:40px;margin-bottom:16px">✅</div>'
    + '<div style="font-size:18px;color:var(--warm-white);margin-bottom:8px;font-weight:500">' + H212_T['hw.already_finished'] + '</div>'
    + (best ? '<div style="font-size:14px;color:var(--text-muted);margin-bottom:28px">' + H212_T['hw.best_score'] + ' ' + best.score + '/' + best.total + '</div>' : '')
    + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button class="next-btn" style="display:inline-flex" onclick="beginQuiz(\'' + type + '\')">' + H212_T['hw.start_again'] + '</button>'
    + '<button class="next-btn" style="display:inline-flex" onclick="renderTypes(' + currentChapter + ')">' + H212_T['hw.back_to_topics'] + '</button>'
    + '</div></div>';
  getPC().innerHTML = html;
}

function beginQuiz(type) {
  currentType  = type;
  currentIndex = 0;
  score        = 0;

  // Priority order: anything never seen before, then anything currently
  // answered wrong (so mistakes get another try), and only once both of
  // those are cleared does a retake bring back the full set.
  var unseen = unseenQuestionsForType(currentLevel, currentChapter, type);
  var wrong  = wrongQuestionsForType(currentLevel, currentChapter, type);

  if (unseen.length > 0) {
    currentQ = unseen;
  } else if (wrong.length > 0) {
    currentQ = wrong;
  } else {
    currentQ = questionsForType(currentLevel, currentChapter, type);
  }

  showQuestion();
}

function showQuestion() {
  var typeName = typeLabel(currentType);
  var html = '<div class="section-header"><h2>' + typeName + '</h2></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.homework'] + '</span><span class="sep">›</span>'
    + '<span>' + H212_T['hw.level'] + ' ' + currentLevel + '</span><span class="sep">›</span>'
    + '<span>' + H212_T['hw.chapter'] + ' ' + currentChapter + '</span><span class="sep">›</span>'
    + '<span>' + typeName + '</span></div>'
    + '<button class="back-btn" onclick="renderTypes(' + currentChapter + ')">' + H212_T['hw.back'] + '</button>';

  if (currentQ.length === 0) {
    html += '<div class="no-content">' + H212_T['hw.no_content'] + '</div>';
    getPC().innerHTML = html;
    return;
  }

  var q     = currentQ[currentIndex];
  var total = currentQ.length;

  // A question shows a picture/audio only if its "image"/"audio" column
  // is filled in - this is independent of the question type, so any
  // mix (some vocab questions with a photo, some listening ones with
  // audio, some with nothing at all) is fine.
  var imgFile = q.image;
  if (!imgFile && q.type === 'photo') {
    // Old rows with no image column filled in yet: guess from the answer word
    imgFile = q.answer.toLowerCase().replace(/\s+/g, '-') + '.png';
  }

  html += '<div class="score-bar">' + H212_T['hw.question'] + ' <span>' + (currentIndex + 1) + ' ' + H212_T['hw.of'] + ' ' + total + '</span>'
    + ' &nbsp;·&nbsp; ' + H212_T['hw.score'] + ' <span>' + score + '</span></div>'
    + '<div class="question-card">';

  if (imgFile) {
    if (q.type === 'photo') {
      html += '<div class="photo-badge">' + H212_T['hw.photo_question'] + '</div>';
    }
    html += '<div class="photo-img-wrap">'
      + '<img src="' + IMAGE_FOLDER + imgFile + '" alt="' + esc(q.answer) + '"'
      + ' onerror="this.style.opacity=\'0.3\';this.title=\'Image not found: ' + imgFile + '\'" />'
      + '</div>';
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
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function checkAnswer(btn, chosen, answer) {
  var q = currentQ[currentIndex];
  var isCorrect = (chosen === answer);
  markSeen(q.id);
  recordMistake(q, isCorrect, chosen);

  var btns = document.querySelectorAll('.choice-btn');
  btns.forEach(function(b) { b.disabled = true; });

  var msg  = document.getElementById('result-msg');
  var next = document.getElementById('next-btn');

  if (isCorrect) {
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
  var total    = currentQ.length;
  var typeName = typeLabel(currentType);
  var pct      = Math.round((score / total) * 100);

  saveScore(currentLevel, currentChapter, currentType, score, total);
  var emoji    = pct === 100 ? '🏆' : pct >= 70 ? '😊' : '💪';

  var html = '<div class="section-header"><h2>' + H212_T['hw.results'] + '</h2></div>'
    + '<div class="question-card" style="text-align:center">'
    + '<div style="font-size:48px;margin-bottom:16px">' + emoji + '</div>'
    + '<div style="font-size:22px;color:var(--warm-white);margin-bottom:8px;font-weight:500">'
    + score + ' / ' + total + ' ' + H212_T['hw.correct_word'] + '</div>'
    + '<div style="font-size:14px;color:var(--text-muted);margin-bottom:28px">'
    + typeName + ' · ' + H212_T['hw.level'] + ' ' + currentLevel + ' · ' + H212_T['hw.chapter'] + ' ' + currentChapter + '</div>'
    + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button class="next-btn" style="display:inline-flex" onclick="beginQuiz(\'' + currentType + '\')">' + H212_T['hw.try_again'] + '</button>'
    + '<button class="next-btn" style="display:inline-flex" onclick="renderTypes(' + currentChapter + ')">' + H212_T['hw.back_to_topics'] + '</button>'
    + '</div></div>';

  getPC().innerHTML = html;
}
</script>
</main>
</div>
</body>
</html>
