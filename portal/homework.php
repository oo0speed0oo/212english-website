<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en" data-theme="<?php echo esc_attr( h212_current_theme() ); ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Homework</title>
<link rel="stylesheet" href="components/base.css?v=<?php echo (int) filemtime( __DIR__ . '/components/base.css' ); ?>">
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
	'hw.part_photo', 'hw.part_vocabulary', 'hw.part_grammar', 'hw.part_builder', 'hw.part_listening', 'hw.part_conversation',
	'hw.part_photo_sub', 'hw.part_vocabulary_sub', 'hw.part_grammar_sub', 'hw.part_builder_sub', 'hw.part_listening_sub', 'hw.part_conversation_sub',
	'hw.group_alt_vocabulary', 'hw.group_alt_grammar', 'hw.group_alt_listening',
	'hw.part_alt_photo', 'hw.part_alt_vocabulary', 'hw.part_alt_grammar', 'hw.part_alt_builder', 'hw.part_alt_listening', 'hw.part_alt_conversation',
	'hw.coming_parts', 'hw.status_done', 'hw.status_new', 'hw.chapter_progress', 'hw.next_open', 'hw.next_locked',
	'hw.next_level_open', 'hw.next_level_locked', 'hw.just_unlocked', 'hw.just_unlocked_level',
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
var allQuestions = [];
var allScores     = []; // every quiz attempt this student has ever submitted
var allSeen       = []; // ids of every individual question this student has ever answered
var allWrong      = []; // ids of questions currently answered wrong (cleared once corrected)
var progress      = null; // unlock state from inc/progress.php (the rules live in one place, on the server)
var pendingSaves  = []; // saves still travelling to the server (so progress is read after they land)
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
  Promise.all([ loadCSV(), loadScores(), loadSeen(), loadWrong(), loadProgress() ]).then(openFromLink).catch(renderLevels);
});

// The dashboard's Continue card links straight to a chapter (?level=1&chapter=4)
function openFromLink() {
  var m = /[?&]level=(\d+)&chapter=(\d+)/.exec(window.location.search);
  if (m && isChapterUnlocked(parseInt(m[1]), parseInt(m[2]))) {
    currentLevel = parseInt(m[1]);
    renderTypes(parseInt(m[2]));
  } else {
    renderLevels();
  }
}

// ── Load & parse CSV ──────────────────────────────
function loadCSV() {
  var main = fetch('homework-content.csv')
    .then(function(r) { return r.text(); })
    .then(function(text) { return parseCSV(text); })
    .catch(function() { return []; });
  // Sentence Builder questions live in their own file; they join the pool as type 'builder'.
  var builder = fetch('build-content.csv')
    .then(function(r) { return r.ok ? r.text() : ''; })
    .then(function(text) {
      return text ? H212Builder.parse(text).filter(function(q) { return q.mode !== 'test'; }) : [];
    })
    .catch(function() { return []; });
  return Promise.all([ main, builder ]).then(function(res) { allQuestions = res[0].concat(res[1]); });
}

// ── Load unlock state (which chapters are open, how far through each) ──
function loadProgress() {
  return fetch('inc/progress.php', { cache: 'no-store' })
    .then(function(r) { return r.json(); })
    .then(function(data) { progress = (data && data.chapters) ? data.chapters : null; })
    .catch(function() { progress = null; });
}
// After the student's answers have reached the server, ask again what is unlocked.
// Returns a promise; the list of newly opened chapters is passed on.
function refreshProgress() {
  var before = progress;
  return Promise.all(pendingSaves).then(loadProgress).then(function() {
    var opened = [];
    if (before && progress) {
      Object.keys(progress).forEach(function(k) { if (progress[k].u && before[k] && !before[k].u) opened.push(k); });
    }
    return opened;
  });
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
  pendingSaves.push(fetch('inc/seen.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: window.H212_NONCE, id: id })
  }).catch(function() {}));
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
  pendingSaves.push(fetch('inc/mistakes.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nonce: window.H212_NONCE, id: q.id, correct: correct,
      level: currentLevel, chapter: currentChapter, type: currentType,
      question: q.question, chosen: chosen, correct_answer: q.answer
    })
  }).catch(function() {}));
}

// ── Score helpers ──────────────────────────────────
function questionsForType(level, chapter, type) {
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
// Which chapters/levels are open comes from the server (progress), so the
// rule (70% of the previous chapter, then open for good) lives in one place.
// If the progress file could not be loaded, nothing is locked.
function isChapterUnlocked(level, chapter) {
  if (!progress) return true;
  var p = progress[level + '-' + chapter];
  return p ? !!p.u : false;
}
function isLevelUnlocked(level) {
  return isChapterUnlocked(level, 1);
}
function chapterPercent(level, chapter) {
  var p = progress && progress[level + '-' + chapter];
  if (!p || !p.t) return 0;
  return Math.floor(p.f * 100 / p.t);
}
function saveScore(level, chapter, type, score, total) {
  var p = fetch('inc/scores.php', {
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
  pendingSaves.push(p);
  return p;
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
    if (get('mode') === 'test') continue; // Test-mode rows belong to tests.php, not Homework
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
  return H212_T['hw.part_' + type] || type;
}

// The 6 practice parts of a chapter, in 3 groups
var GROUPS = [
  { key: 'vocabulary', label: 'hw.vocabulary', alt: 'hw.group_alt_vocabulary', parts: ['photo', 'vocabulary'] },
  { key: 'grammar',    label: 'hw.grammar',    alt: 'hw.group_alt_grammar',    parts: ['grammar', 'builder'] },
  { key: 'listening',  label: 'hw.listening',  alt: 'hw.group_alt_listening',  parts: ['listening', 'conversation'] }
];

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
  for (var c = 1; c <= 17; c++) {
    if (isChapterUnlocked(lvl, c)) {
      var pct = chapterPercent(lvl, c);
      var badge = pct > 0
        ? '<span class="chapter-progress' + (pct === 100 ? ' done' : '') + '">' + pct + '%</span>'
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
  var html = '<div class="chapter-head">'
    + '<button type="button" class="back-btn" onclick="renderChapters(' + currentLevel + ')" aria-label="' + H212_T['hw.back_chapters'] + '">' + H212UI.icons.back + '</button>'
    + '<div><div class="chapter-head-kicker">' + H212_T['hw.level'] + ' ' + currentLevel + ' · ' + H212_T['hw.chapter'] + ' ' + ch + '</div>'
    + '<div class="chapter-head-title">' + H212_T['hw.chapter'] + ' ' + ch + '</div></div></div>'
    + chapterBarHtml(currentLevel, ch);
  GROUPS.forEach(function(g) {
    html += '<div class="part-group grp-' + g.key + '"><h3 class="part-group-title">' + H212_T[g.label].toUpperCase() + ' <span class="alt">· ' + H212_T[g.alt] + '</span></h3><div class="type-grid">';
    g.parts.forEach(function(part) {
      var has = questionsForType(currentLevel, ch, part).length > 0;
      html += '<div class="type-btn part-' + part + (has ? '' : ' empty') + '"' + (has ? ' role="button" tabindex="0" onclick="startQuiz(\'' + part + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();startQuiz(\'' + part + '\');}"' : '') + '>'
        + '<span class="icon">' + H212UI.icons[part] + '</span>'
        + '<span class="lbl">' + H212_T['hw.part_' + part] + ' <span class="alt">· ' + H212_T['hw.part_alt_' + part] + '</span></span>'
        + '<span class="sub">' + (has ? H212_T['hw.part_' + part + '_sub'] : H212_T['hw.coming_parts']) + '</span>'
        + (has ? typeStatusHtml(currentLevel, ch, part) : '') + '</div>';
    });
    html += '</div></div>';
  });
  getPC().innerHTML = html;
}

// "Chapter progress" bar with the 70% mark, and what it opens next.
function chapterBarHtml(level, ch) {
  var pct = chapterPercent(level, ch);
  var next = '';
  var nextOpen = true;
  if (ch < 17 || level < 5) {
    var isLevelStep = ch >= 17;
    var nl = isLevelStep ? level + 1 : level;
    var nc = isLevelStep ? 1 : ch + 1;
    var open = isChapterUnlocked(nl, nc);
    nextOpen = open;
    var key = isLevelStep ? (open ? 'hw.next_level_open' : 'hw.next_level_locked') : (open ? 'hw.next_open' : 'hw.next_locked');
    next = H212_T[key].replace('{n}', isLevelStep ? nl : nc);
  }
  return '<div class="chapter-bar">'
    + '<div class="chapter-bar-top"><span>' + H212_T['hw.chapter_progress'] + '</span><span>' + pct + '%</span></div>'
    + '<div class="chapter-bar-track"><div class="chapter-bar-fill" style="width:' + pct + '%"></div><div class="chapter-bar-mark" title="70%"></div></div>'
    + (next ? '<div class="chapter-bar-next' + (nextOpen ? '' : ' locked') + '">' + next + '</div>' : '')
    + '</div>';
}

function typeStatusHtml(level, chapter, type) {
  var qs = questionsForType(level, chapter, type);
  if (!qs.length) return '<span class="status muted">' + H212_T['hw.coming_parts'] + '</span>';
  if (isTypeFinished(level, chapter, type)) {
    return '<span class="status done">✓ ' + H212_T['hw.status_done'] + '</span>';
  }
  var wrongCount = wrongQuestionsForType(level, chapter, type).length;
  if (wrongCount > 0 && unseenQuestionsForType(level, chapter, type).length === 0) {
    return '<span class="status wrong">⚠ ' + wrongCount + ' ' + H212_T['hw.needs_review'] + '</span>';
  }
  var finished = qs.filter(function(q) { return allSeen.indexOf(q.id) !== -1 && allWrong.indexOf(q.id) === -1; }).length;
  if (finished > 0) return '<span class="status part">' + finished + '/' + qs.length + '</span>';
  return '<span class="status take">' + H212_T['hw.status_new'] + '</span>';
}

// ── Quiz ──────────────────────────────────────────
function startQuiz(type) {
  if (!questionsForType(currentLevel, currentChapter, type).length) return;
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
  var grp = H212UI.groupOf(currentType);
  var html = '';

  if (currentQ.length === 0) {
    html += '<button class="back-btn" onclick="renderTypes(' + currentChapter + ')">' + H212_T['hw.back'] + '</button>'
      + '<div class="no-content">' + H212_T['hw.no_content'] + '</div>';
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

  html += H212UI.qTop({ onclose: 'renderTypes(' + currentChapter + ')', label: H212_T['hw.back'], index: currentIndex, total: total, score: score, scoreWord: H212_T['hw.score'].replace(/:$/, '') })
    + '<div class="grp-' + grp + '"><div class="q-label">' + H212_T[GROUPS.filter(function(g) { return g.key === grp; })[0].label] + ' · ' + typeName + '</div></div>'
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
  H212Mike.say('hint_' + q.type, currentIndex === 0);
}

// Sentence Builder was checked: save it like any other answer
H212Builder.onChecked = function(res) {
  var q = currentQ[currentIndex];
  markSeen(q.id);
  recordMistake(q, res.correct, res.chosen);
  if (res.correct) score++;
  document.getElementById('next-btn').style.display = 'inline-flex';
  H212Mike.say(res.correct ? 'correct' : 'wrong');
};

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
  H212Mike.say(isCorrect ? 'correct' : 'wrong');
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
    + '<div id="unlock-note" class="unlock-note"></div>'
    + H212Mike.row()
    + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button class="next-btn" style="display:inline-flex" onclick="beginQuiz(\'' + currentType + '\')">' + H212_T['hw.try_again'] + '</button>'
    + '<button class="next-btn" style="display:inline-flex" onclick="renderTypes(' + currentChapter + ')">' + H212_T['hw.back_to_topics'] + '</button>'
    + '</div></div>';

  getPC().innerHTML = html;
  H212Mike.say(pct === 100 ? 'finish_perfect' : (pct >= 70 ? 'finish_good' : 'finish_try'));

  // Once the answers have reached the server, see whether a new chapter opened
  refreshProgress().then(function(opened) {
    var note = document.getElementById('unlock-note');
    if (!note || !opened.length) return;
    var last = opened[opened.length - 1].split('-');
    var lvl = parseInt(last[0]), ch = parseInt(last[1]);
    note.textContent = (ch === 1 && lvl > 1 ? H212_T['hw.just_unlocked_level'].replace('{n}', lvl) : H212_T['hw.just_unlocked'].replace('{n}', ch));
    note.style.display = 'block';
  });
}
</script>
</main>
</div>
</body>
</html>
