// Phonics screens. Practice only: it never counts for unlocking chapters or for Grades.
//
//   Steps (9)  ->  Lessons of a step  ->  one lesson's parts  ->  a part (so far: A. Sound Board)
//
// Page setup (phonics.php) sets window.H212_PHONICS (steps, lessons, sounds, progress, audio),
// window.H212_T (phonics.* strings) and window.H212_NONCE, and loads listen.js (robot voice) and ui.js.
// The lists themselves are portal/phonics/*.csv, read by inc/phonics-data.php.
//
// Sound Board: tiles for every sound taught up to this lesson, the newest one highlighted.
// Tap a tile: you hear the sound and then the key word (audio/phonics/sounds/<sound_no>.m4a);
// the Japanese tip shows in the card above. A lesson with two sounds (th, ew...) has a small second
// button: the first sound's recording has both parts, the second plays the key word only.
// If a recording is missing the browser's robot voice says the key word instead.
var H212Phonics = (function () {
  var P = window.H212_PHONICS || { steps: [], lessons: {}, sounds: {}, progress: {}, audio: { v: 0, sounds: [], words: [] } };
  var player = null;      // the recorded clip that is playing, if any
  var picked = null;      // Sound Board: the sound shown in the card { no, part }
  // Parts that exist so far, in menu order. Add 'blend', 'listen', 'read', 'sentences' as they are built.
  var READY = ['board'];
  var PARTS = ['board', 'blend', 'listen', 'read', 'sentences'];
  var ICONS = { board: 'vocabulary', blend: 'builder', listen: 'listening', read: 'speaking', sentences: 'conversation' };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(key) { return (window.H212_T && window.H212_T[key]) || ''; }
  function fill(text, vars) {
    Object.keys(vars).forEach(function (k) { text = text.split('{' + k + '}').join(vars[k]); });
    return text;
  }
  function pc() { return document.getElementById('page-content'); }
  function key(e, js) { return ' role="button" tabindex="0" onclick="' + js + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + js + ';}"'; }

  // ── Progress ────────────────────────────────────────
  function partDone(n, part) { return !!(P.progress[n] && P.progress[n][part]); }
  function lessonDone(n) {
    return READY.every(function (p) { return partDone(n, p); });
  }
  function doneCount(n) { return READY.filter(function (p) { return partDone(n, p); }).length; }

  // The first lesson (in Mike's order) that is not finished: "Recommended next"
  function nextLesson() {
    var nums = Object.keys(P.lessons).map(Number).sort(function (a, b) { return a - b; });
    for (var i = 0; i < nums.length; i++) if (!lessonDone(nums[i])) return nums[i];
    return 0;
  }

  function save(n, part) {
    if (!P.progress[n]) P.progress[n] = {};
    P.progress[n][part] = 1;
    fetch('inc/phonics.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce: window.H212_NONCE, action: 'part', lesson: n, part: part, score: 1 })
    }).catch(function () {});
  }

  // ── Names ───────────────────────────────────────────
  function lessonLetters(l) { return l.title.split(' (')[0]; }                    // "ch (chair)" -> "ch"
  function lessonLabel(l) {
    if (l.kind === 'review') return T('phonics.review');
    if (l.kind === 'bonus') return T('phonics.bonus');
    return T('phonics.lesson') + ' ' + l.n;
  }
  function lessonBig(l) {
    if (l.kind === 'sound') return lessonLetters(l);
    return l.title.replace(/^(Review|Bonus):\s*/, '');
  }

  // ── Sound ───────────────────────────────────────────
  function stopAudio() {
    if (player) { try { player.pause(); } catch (e) {} player = null; }
  }
  function has(list, v) { return (list || []).indexOf(v) !== -1; }

  // Plays a recording; if it will not play, says `text` with the robot voice instead
  function clip(url, text) {
    var robot = function () { if (typeof H212Listen !== 'undefined' && text) H212Listen.speakText(text); };
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    if (!url || typeof Audio === 'undefined') { robot(); return; }
    var a = new Audio(url);
    player = a;
    a.onerror = function () { if (player === a) { player = null; robot(); } };
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function (e) {
      if (player !== a || (e && e.name === 'AbortError')) return;
      player = null;
      robot();
    });
  }

  function playSound(no, part) {
    var s = P.sounds[no];
    if (!s) return;
    var v = '?v=' + (P.audio.v || 0);
    var word = (s.parts[part] || s.parts[0]).key_word;
    if (part === 0 && has(P.audio.sounds, no)) clip('audio/phonics/sounds/' + no + '.m4a' + v, word);
    else if (has(P.audio.words, word)) clip('audio/phonics/words/' + encodeURIComponent(word) + '.m4a' + v, word);
    else clip('', word);
  }

  // ── Steps ───────────────────────────────────────────
  function stepSounds(step) {
    var seen = {}, out = [];
    step.lessons.forEach(function (n) {
      var l = P.lessons[n];
      if (l.kind === 'sound') out.push(lessonLetters(l));
    });
    return out.join(' ');
  }

  function showSteps() {
    stopAudio();
    var rec = nextLesson(), recStep = rec ? P.lessons[rec].step : 0;
    var h = '<div class="section-header"><h2>' + esc(T('nav.phonics')) + '</h2><p>' + esc(T('phonics.subtitle')) + '</p></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_step')) + '</div>'
      + '<div class="part-group grp-phonics"><div class="type-grid">';
    P.steps.forEach(function (st) {
      var done = st.lessons.filter(lessonDone).length, all = done === st.lessons.length;
      var status = all ? '<span class="status done">✓ ' + esc(T('phonics.done')) + '</span>'
        : (st.step === recStep ? '<span class="status take">' + esc(T('phonics.recommended')) + '</span>'
          : (done ? '<span class="status part">' + done + '/' + st.lessons.length + '</span>' : ''));
      h += '<div class="type-btn"' + key(0, 'H212Phonics.step(' + st.step + ')') + '>'
        + '<span class="icon ph-stepnum">' + st.step + '</span>'
        + '<span class="lbl">' + esc(T('phonics.step')) + ' ' + st.step + '</span>'
        + '<span class="sub ph-sub">' + esc(stepSounds(st)) + '</span>'
        + status + '</div>';
    });
    h += '</div></div>';
    pc().innerHTML = h;
  }

  // ── Lessons of one step ─────────────────────────────
  function showLessons(stepNo) {
    stopAudio();
    var st = P.steps.filter(function (s) { return s.step === stepNo; })[0];
    if (!st) return showSteps();
    var rec = nextLesson();
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.steps()" aria-label="' + esc(T('phonics.back_steps')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(T('nav.phonics')) + '</div>'
      + '<div class="chapter-head-title">' + esc(T('phonics.step')) + ' ' + stepNo + '</div></div></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_lesson')) + '</div>'
      + '<div class="chapter-grid practice-sets grp-phonics">';
    st.lessons.forEach(function (n) {
      var l = P.lessons[n], all = lessonDone(n), part = doneCount(n);
      var cls = 'chapter-btn practice-set' + (all ? ' is-done' : '') + (n === rec ? ' is-next' : '') + (l.kind !== 'sound' ? ' ph-extra' : '');
      h += '<div class="' + cls + '"' + key(0, 'H212Phonics.lesson(' + n + ')') + '>'
        + '<span class="num">' + esc(lessonBig(l)) + '</span><span class="lbl">' + esc(lessonLabel(l)) + '</span>'
        + '<span class="status ' + (all ? 'done-tick' : (n === rec ? 'take' : (part ? 'part' : 'take'))) + '">'
        + (all ? '✓ ' + esc(T('phonics.done')) : (n === rec ? esc(T('phonics.recommended')) : esc(T('phonics.new')))) + '</span></div>';
    });
    h += '</div>';
    pc().innerHTML = h;
  }

  // ── One lesson: its parts ───────────────────────────
  function showLesson(n) {
    stopAudio();
    var l = P.lessons[n];
    if (!l) return showSteps();
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.step(' + l.step + ')" aria-label="' + esc(T('phonics.back_lessons')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(T('phonics.step')) + ' ' + l.step + ' · ' + esc(lessonLabel(l)) + '</div>'
      + '<div class="chapter-head-title">' + esc(l.kind === 'sound' ? l.title : l.title) + '</div></div></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_part')) + (l.words ? ' · ' + esc(fill(T('phonics.words_n'), { n: l.words })) : '') + '</div>'
      + '<div class="part-group grp-phonics"><div class="type-grid">';
    PARTS.forEach(function (p) {
      var ready = READY.indexOf(p) !== -1;
      var status = '';
      if (ready) status = partDone(n, p) ? '<span class="status done">✓ ' + esc(T('phonics.done')) + '</span>' : '<span class="status take">' + esc(T('phonics.new')) + '</span>';
      h += '<div class="type-btn' + (ready ? '' : ' empty') + '"' + (ready ? key(0, 'H212Phonics.part(' + n + ',\'' + p + '\')') : '') + '>'
        + '<span class="icon">' + H212UI.icons[ICONS[p]] + '</span>'
        + '<span class="lbl">' + esc(T('phonics.part_' + p)) + '</span>'
        + '<span class="sub">' + esc(ready ? T('phonics.part_' + p + '_sub') : T('phonics.coming')) + '</span>'
        + status + '</div>';
    });
    h += '</div></div>';
    pc().innerHTML = h;
  }

  // ── A. Sound Board ──────────────────────────────────
  function boardTile(no, isNew) {
    var s = P.sounds[no], two = s.parts.length > 1;
    var h = '<div class="ph-tile' + (isNew ? ' is-new' : '') + (two ? ' is-two' : '') + '"' + key(0, 'H212Phonics.tap(' + no + ',0)') + '>'
      + '<span class="ph-letter">' + esc(s.sound) + '</span>'
      + '<span class="ph-key">' + esc(s.parts[0].key_word) + '</span>';
    if (two) {
      h += '<span class="ph-second" role="button" tabindex="0" aria-label="' + esc(T('phonics.sound_second')) + ': ' + esc(s.parts[1].key_word) + '"'
        + ' onclick="event.stopPropagation();H212Phonics.tap(' + no + ',1)"'
        + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();event.stopPropagation();H212Phonics.tap(' + no + ',1);}">'
        + '▸ ' + esc(s.parts[1].key_word) + '</span>';
    }
    return h + '</div>';
  }

  function cardHtml() {
    if (!picked) return '<div class="ph-card ph-card-empty grp-phonics">' + esc(T('phonics.board_hint')) + '</div>';
    var s = P.sounds[picked.no], part = s.parts[picked.part] || s.parts[0];
    return '<div class="ph-card grp-phonics">'
      + '<button type="button" class="ph-card-play" onclick="H212Phonics.tap(' + picked.no + ',' + picked.part + ')" aria-label="Play">' + H212UI.icons.listening + '</button>'
      + '<div class="ph-card-main"><div class="ph-card-letter">' + esc(s.sound) + ' <span class="ph-card-key">· ' + esc(part.key_word) + '</span></div>'
      + '<div class="ph-card-ipa">/' + esc(part.ipa) + '/</div>'
      + (s.tip_ja ? '<div class="ph-card-tip" lang="ja">' + esc(s.tip_ja) + '</div>' : '') + '</div></div>';
  }

  function showBoard(n) {
    var l = P.lessons[n];
    if (!l) return showSteps();
    var newNo = l.kind === 'sound' ? l.sound_no : 0;
    var nos = Object.keys(P.sounds).map(Number).filter(function (no) { return no <= l.sound_no; }).sort(function (a, b) { return a - b; });
    picked = newNo ? { no: newNo, part: 0 } : null;
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.lesson(' + n + ')" aria-label="' + esc(T('phonics.back_parts')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(lessonLabel(l)) + ' · ' + esc(T('phonics.part_board')) + '</div>'
      + '<div class="chapter-head-title">' + esc(l.title) + '</div></div></div>'
      + '<div id="ph-card">' + cardHtml() + '</div>';
    if (newNo) {
      h += '<div class="practice-choose">' + esc(T('phonics.board_new')) + '</div><div class="ph-grid grp-phonics">' + boardTile(newNo, true) + '</div>';
    } else {
      h += '<div class="ph-note">' + esc(T('phonics.board_none')) + '</div>';
    }
    var before = nos.filter(function (no) { return no !== newNo; });
    if (before.length) {
      h += '<div class="practice-choose">' + esc(T('phonics.board_before')) + '</div><div class="ph-grid grp-phonics">'
        + before.map(function (no) { return boardTile(no, false); }).join('') + '</div>';
    }
    pc().innerHTML = h;
    window.__phBoard = n;
  }

  function tap(no, part) {
    picked = { no: no, part: part || 0 };
    var card = document.getElementById('ph-card');
    if (card) card.innerHTML = cardHtml();
    playSound(no, part || 0);
    var n = window.__phBoard, l = P.lessons[n];
    // The board counts as done when the student has tried the new sound (or any tile in a Review / Bonus lesson)
    if (l && !partDone(n, 'board') && (l.kind !== 'sound' || no === l.sound_no)) save(n, 'board');
  }

  // ── Navigation ──────────────────────────────────────
  function goTop() { window.scrollTo(0, 0); }
  function init() { showSteps(); }

  return {
    init: init,
    steps: function () { showSteps(); goTop(); },
    step: function (n) { showLessons(n); goTop(); },
    lesson: function (n) { showLesson(n); goTop(); },
    part: function (n, p) { if (p === 'board') { showBoard(n); goTop(); } },
    tap: tap,
    _state: function () { return P; }
  };
})();

document.addEventListener('DOMContentLoaded', H212Phonics.init);
