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
	'hw.back_to_topics', 'hw.photo_question',
) );
?>
<script>

// ── State ─────────────────────────────────────────
var allQuestions = [];
var currentLevel   = null;
var currentChapter = null;
var currentType    = null;
var currentQ       = [];
var currentIndex   = 0;
var score          = 0;

// Folder where your vocab photos live on the server
var IMAGE_FOLDER = 'images/vocab/';

// ── Boot ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  loadCSV();
});

// ── Load & parse CSV ──────────────────────────────
function loadCSV() {
  fetch('homework-content.csv')
    .then(function(r) { return r.text(); })
    .then(function(text) {
      allQuestions = parseCSV(text);
      renderLevels();
    })
    .catch(function() {
      renderLevels();
    });
}

function parseCSV(text) {
  var lines  = text.trim().split('\n');
  var rows   = [];
  for (var i = 1; i < lines.length; i++) {
    var cols = lines[i].split(',');
    if (cols.length < 8) continue;
    var type = cols[2].trim().toLowerCase();
    rows.push({
      level:    parseInt(cols[0]),
      chapter:  parseInt(cols[1]),
      type:     type,
      question: cols[3].trim(),
      choice_a: cols[4].trim(),
      choice_b: cols[5].trim(),
      choice_c: cols[6].trim(),
      answer:   cols[7].trim()
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
    html += '<div class="level-btn" onclick="renderChapters(' + i + ')">'
      + '<span class="num">' + i + '</span><span class="lbl">' + H212_T['hw.level'] + ' ' + i + '</span></div>';
  }
  html += '</div>';
  getPC().innerHTML = html;
}

function renderChapters(lvl) {
  currentLevel = lvl; currentChapter = null; currentType = null;
  var html = '<div class="section-header"><h2>' + H212_T['nav.homework'] + '</h2><p>' + H212_T['hw.choose_chapter'] + '</p></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.homework'] + '</span><span class="sep">›</span><span>' + H212_T['hw.level'] + ' ' + lvl + '</span></div>'
    + '<button class="back-btn" onclick="renderLevels()">' + H212_T['hw.back_levels'] + '</button>'
    + '<div class="chapter-grid">';
  for (var c = 1; c <= 16; c++) {
    html += '<div class="chapter-btn" onclick="renderTypes(' + c + ')">'
      + '<span class="num">' + c + '</span><span class="lbl">' + H212_T['hw.chapter'] + ' ' + c + '</span></div>';
  }
  html += '</div>';
  getPC().innerHTML = html;
}

function renderTypes(ch) {
  currentChapter = ch; currentType = null;
  var html = '<div class="section-header"><h2>' + H212_T['nav.homework'] + '</h2><p>' + H212_T['hw.choose_study'] + '</p></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.homework'] + '</span><span class="sep">›</span><span>' + H212_T['hw.level'] + ' ' + currentLevel + '</span><span class="sep">›</span><span>' + H212_T['hw.chapter'] + ' ' + ch + '</span></div>'
    + '<button class="back-btn" onclick="renderChapters(' + currentLevel + ')">' + H212_T['hw.back_chapters'] + '</button>'
    + '<div class="type-grid">'
    + '<div class="type-btn" onclick="startQuiz(\'vocabulary\')">'
    +   '<span class="icon">📖</span><span class="lbl">' + H212_T['hw.vocabulary'] + '</span><span class="sub">' + H212_T['hw.vocab_sub'] + '</span></div>'
    + '<div class="type-btn" onclick="startQuiz(\'grammar\')">'
    +   '<span class="icon">✏️</span><span class="lbl">' + H212_T['hw.grammar'] + '</span><span class="sub">' + H212_T['hw.grammar_sub'] + '</span></div>'
    + '<div class="type-btn" onclick="startQuiz(\'listening\')">'
    +   '<span class="icon">🎧</span><span class="lbl">' + H212_T['hw.listening'] + '</span><span class="sub">' + H212_T['hw.listening_sub'] + '</span></div>'
    + '</div>';
  getPC().innerHTML = html;
}

// ── Quiz ──────────────────────────────────────────
function startQuiz(type) {
  currentType  = type;
  currentIndex = 0;
  score        = 0;

  if (type === 'vocabulary') {
    currentQ = allQuestions.filter(function(q) {
      return q.level === currentLevel && q.chapter === currentChapter
        && (q.type === 'vocabulary' || q.type === 'photo');
    });
  } else {
    currentQ = allQuestions.filter(function(q) {
      return q.level === currentLevel && q.chapter === currentChapter && q.type === type;
    });
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
  var isPhoto = (q.type === 'photo');

  html += '<div class="score-bar">' + H212_T['hw.question'] + ' <span>' + (currentIndex + 1) + ' ' + H212_T['hw.of'] + ' ' + total + '</span>'
    + ' &nbsp;·&nbsp; ' + H212_T['hw.score'] + ' <span>' + score + '</span></div>'
    + '<div class="question-card">';

  if (isPhoto) {
    var imgFile = q.answer.toLowerCase().replace(/\s+/g, '-') + '.png';
    html += '<div class="photo-badge">' + H212_T['hw.photo_question'] + '</div>'
      + '<div class="photo-img-wrap">'
      + '<img src="' + IMAGE_FOLDER + imgFile + '" alt="' + q.answer + '"'
      + ' onerror="this.style.opacity=\'0.3\';this.title=\'Image not found: ' + imgFile + '\'" />'
      + '</div>';
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
  var total    = currentQ.length;
  var typeName = typeLabel(currentType);
  var pct      = Math.round((score / total) * 100);
  var emoji    = pct === 100 ? '🏆' : pct >= 70 ? '😊' : '💪';

  var html = '<div class="section-header"><h2>' + H212_T['hw.results'] + '</h2></div>'
    + '<div class="question-card" style="text-align:center">'
    + '<div style="font-size:48px;margin-bottom:16px">' + emoji + '</div>'
    + '<div style="font-size:22px;color:var(--warm-white);margin-bottom:8px;font-weight:500">'
    + score + ' / ' + total + ' ' + H212_T['hw.correct_word'] + '</div>'
    + '<div style="font-size:14px;color:var(--text-muted);margin-bottom:28px">'
    + typeName + ' · ' + H212_T['hw.level'] + ' ' + currentLevel + ' · ' + H212_T['hw.chapter'] + ' ' + currentChapter + '</div>'
    + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button class="next-btn" style="display:inline-flex" onclick="startQuiz(\'' + currentType + '\')">' + H212_T['hw.try_again'] + '</button>'
    + '<button class="next-btn" style="display:inline-flex" onclick="renderTypes(' + currentChapter + ')">' + H212_T['hw.back_to_topics'] + '</button>'
    + '</div></div>';

  getPC().innerHTML = html;
}
</script>
</main>
</div>
</body>
</html>
