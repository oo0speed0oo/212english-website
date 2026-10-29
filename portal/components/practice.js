// Opposites and Idioms practice (one engine, two sections). Practice only: it never
// counts for unlocking chapters or for Grades.
//
// Screens:  the list of SETS (a tick shows a finished set)
//        -> the MODE MENU for one set (5 big buttons, a tick on each finished mode)
//        -> the questions of one mode.
//
// The five modes (see h212_practice_sections() in wp-content/mu-plugins/212-progress.php):
//   Multiple choice   kind = choice (Opposites) / meaning (Idioms)   original file
//   Fill in the blank kind = blank                                   original file
//   Sentence Builder  kind = builder   tap word tiles into order     *-modes.csv
//   Listening         kind = listen    hear a sentence, then choose   *-modes.csv
//   Conversation      kind = convo     hear a line, choose the reply  *-modes.csv
// The "Make your own sentence" kind (write) is HIDDEN for now and saved for later
// (the screen for it, and the server side in inc/practice.php, are in git commit 9febef4).
//
// Progress is saved per question id in the section's own record (inc/practice.php), so the
// teacher sees it and it never touches Homework.
//
// Page setup (inc/practice-page.php) sets window.H212_PRACTICE:
//   { section, csv, csvModes, mode: 'pair'|'item', kinds: [...], fields: { item, item_ja, pair, pair_ja } }
// and needs window.H212_T (practice.* strings), window.H212_NONCE, window.H212_VOICES,
// H212UI, H212Mike, H212Listen and H212Builder.
var H212Practice = (function () {
  var C     = window.H212_PRACTICE || {};
  var rows  = [];      // every visible question of this section (both files)
  var seen  = {};      // id -> true: answered
  var wrong = {};      // id -> true: currently wrong
  var st    = null;    // the mode in progress: { set, mode, qs, i, correct, answered, locked }
  var player = null;   // the recorded clip that is playing, if any

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(key) { return (window.H212_T && window.H212_T[key]) || ''; }
  function pc() { return document.getElementById('page-content'); }

  // The five modes, in menu order. icon = one of the line icons in ui.js
  function MODES() {
    var first = (C.kinds && C.kinds[0]) || 'choice';
    return [
      { key: 'choice',  kinds: [first],   icon: 'vocabulary' },
      { key: 'blank',   kinds: ['blank'], icon: 'grammar' },
      { key: 'builder', kinds: ['builder'], icon: 'builder' },
      { key: 'listen',  kinds: ['listen'],  icon: 'listening' },
      { key: 'convo',   kinds: ['convo'],   icon: 'conversation' }
    ];
  }
  function modeByKey(key) { return MODES().filter(function (m) { return m.key === key; })[0]; }

  // ── Loading ─────────────────────────────────────────
  function splitLine(line) {
    var result = [], cur = '', inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else { cur += ch; }
      } else if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(cur); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur);
    return result;
  }

  function dash(v) { return v === '-' ? '' : v; }

  function parse(text) {
    var lines = String(text).replace(/^﻿/, '').trim().split('\n');
    var header = splitLine(lines[0]).map(function (h) { return h.trim().toLowerCase(); });
    var f = C.fields || {};
    var out = [];
    for (var i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      var cols = splitLine(lines[i].replace(/\r$/, ''));
      var get = function (name) {
        var idx = header.indexOf(name);
        return (idx === -1 || cols[idx] === undefined) ? '' : cols[idx].trim();
      };
      if (get('id') === '' || get('kind') === '') continue;
      var kind = get('kind').toLowerCase();
      if (kind === 'write') continue;                    // hidden for now
      var tiles = dash(get('tiles')).split('|').map(function (t) { return t.trim(); }).filter(Boolean);
      out.push({
        id: get('id'), set: parseInt(get('set')), kind: kind,
        item: get(f.item || 'word'), item_ja: get(f.item_ja || 'word_ja'),
        pair: f.pair ? get(f.pair) : '', pair_ja: f.pair_ja ? get(f.pair_ja) : '',
        question: get('question'),
        choices: [get('choice_a'), get('choice_b'), get('choice_c')],
        // a Sentence Builder answer is the tiles in order, joined with spaces
        answer: (kind === 'builder' && tiles.length) ? tiles.join(' ') : get('answer'),
        tiles: tiles, extra: dash(get('extra')), audio_text: dash(get('audio_text'))
      });
    }
    return out;
  }

  function setLists(data) {
    seen = {}; wrong = {};
    (data.seen || []).forEach(function (id) { seen[id] = true; });
    (data.wrong || []).forEach(function (id) { wrong[id] = true; });
  }

  function post(payload) {
    payload.nonce = window.H212_NONCE;
    payload.section = C.section;
    return fetch('inc/practice.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res && res.seen) setLists(res);
      return res;
    });
  }

  function loadRows(url) {
    if (!url) return Promise.resolve([]);
    return fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { return t ? parse(t) : []; }).catch(function () { return []; });
  }

  function init() {
    pc().innerHTML = '<div class="video-msg">' + esc(T('practice.loading')) + '</div>';
    var prog = fetch('inc/practice.php?section=' + encodeURIComponent(C.section), { cache: 'no-store' })
      .then(function (r) { return r.json(); }).then(setLists).catch(function () { setLists({}); });
    Promise.all([loadRows(C.csv), loadRows(C.csvModes), prog]).then(function (res) {
      rows = res[0].concat(res[1]);
      showSets();
    });
  }

  function isDone(q) { return seen[q.id] && !wrong[q.id]; }

  // ── Sets ────────────────────────────────────────────
  function sets() {
    var map = {}, order = [];
    rows.forEach(function (q) {
      if (!map[q.set]) { map[q.set] = []; order.push(q.set); }
      map[q.set].push(q);
    });
    order.sort(function (a, b) { return a - b; });
    return order.map(function (n) { return { n: n, qs: map[n] }; });
  }

  function showSets() {
    st = null;
    stopAudio();
    var list = sets();
    var h = '<div class="section-header"><h2>' + esc(T('nav.' + C.section)) + '</h2><p>' + esc(T('practice.' + C.section + '_subtitle')) + '</p></div>'
      + '<div class="practice-choose">' + esc(T('practice.choose_set')) + '</div>';
    if (!list.length) {
      h += '<div class="no-content">' + esc(T('practice.no_questions')) + '</div>';
    } else {
      h += '<div class="chapter-grid practice-sets grp-' + esc(C.section) + '">';
      list.forEach(function (s) {
        var done = s.qs.filter(isDone).length;
        var all = done === s.qs.length;
        h += '<div class="chapter-btn practice-set' + (all ? ' is-done' : '') + '" role="button" tabindex="0" onclick="H212Practice.start(' + s.n + ')"'
          + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();H212Practice.start(' + s.n + ');}">'
          + '<span class="num">' + s.n + '</span><span class="lbl">' + esc(T('practice.set')) + ' ' + s.n + '</span>'
          + '<span class="status ' + (all ? 'done-tick' : (done ? 'part' : 'take')) + '">'
          + (all ? '✓ ' + esc(T('practice.done')) : (done ? done + '/' + s.qs.length : esc(T('hw.status_new')))) + '</span></div>';
      });
      h += '</div>';
    }
    pc().innerHTML = h;
  }

  // ── The mode menu for one set ───────────────────────
  function modeQs(n, mode) {
    return rows.filter(function (q) { return q.set === n && mode.kinds.indexOf(q.kind) !== -1; });
  }

  // Tapping a set opens its mode menu
  function start(n) { showModes(n); window.scrollTo(0, 0); }

  function showModes(n) {
    st = null;
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Practice.exit()" aria-label="' + esc(T('practice.back_sets')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(T('nav.' + C.section)) + '</div>'
      + '<div class="chapter-head-title">' + esc(T('practice.set')) + ' ' + n + '</div></div></div>'
      + '<div class="practice-choose">' + esc(T('practice.choose_mode')) + '</div>'
      + '<div class="part-group grp-' + esc(C.section) + '"><div class="type-grid">';
    MODES().forEach(function (m) {
      var qs = modeQs(n, m), done = qs.filter(isDone).length, has = qs.length > 0;
      var status = '';
      if (has) {
        status = done === qs.length ? '<span class="status done">✓ ' + esc(T('practice.done')) + '</span>'
          : (done ? '<span class="status part">' + done + '/' + qs.length + '</span>' : '<span class="status take">' + esc(T('hw.status_new')) + '</span>');
      }
      var go = 'H212Practice.startMode(' + n + ',\'' + m.key + '\')';
      h += '<div class="type-btn' + (has ? '' : ' empty') + '"' + (has ? ' role="button" tabindex="0" onclick="' + go + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + go + ';}"' : '') + '>'
        + '<span class="icon">' + H212UI.icons[m.icon] + '</span>'
        + '<span class="lbl">' + esc(T('practice.mode_' + m.key)) + ' <span class="alt">· ' + esc(T('practice.mode_' + m.key + '_alt')) + '</span></span>'
        + '<span class="sub">' + esc(has ? T('practice.mode_' + m.key + '_sub') : T('hw.coming_parts')) + '</span>'
        + status + '</div>';
    });
    h += '</div></div>';
    pc().innerHTML = h;
  }

  // ── One mode ────────────────────────────────────────
  function startMode(n, key) {
    var m = modeByKey(key);
    var all = modeQs(n, m);
    if (!all.length) return;
    var pool = all.filter(function (q) { return !isDone(q); });   // unfinished first; a finished mode can be replayed in full
    st = { set: n, mode: key, qs: pool.length ? pool : all, i: 0, correct: 0, answered: 0, locked: false };
    show();
    window.scrollTo(0, 0);
  }

  function cur() { return st.qs[st.i]; }

  // The part of a Listening/Conversation question that is safe to show before the answer:
  // everything except the quoted sentence ("You hear "..." Which word did you hear?" -> "Which word did you hear?").
  function visibleQuestion(q) {
    var p = (typeof H212Listen !== 'undefined' && H212Listen.parse) ? H212Listen.parse(q.question, 'conversation') : null;
    var text = p ? ((p.prefix ? p.prefix + ' ' : '') + p.suffix).trim() : '';
    return text || (q.kind === 'convo' ? T('conv.prompt') : '');
  }

  function choicesHtml(q) {
    var h = '<div class="choices">';
    q.choices.forEach(function (c, i) {
      h += '<button type="button" class="choice-btn" onclick="H212Practice.answer(' + i + ')">' + esc(c) + '</button>';
    });
    return h + '</div><div class="result-msg" id="result-msg"></div>';
  }

  function show() {
    var q = cur(), m = modeByKey(st.mode);
    st.locked = false;
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    var last = st.i + 1 >= st.qs.length;
    var h = H212UI.qTop({ onclose: 'H212Practice.exitMode()', label: T('practice.back_modes'), index: st.i, total: st.qs.length, noScore: true })
      + '<div class="grp-' + esc(C.section) + '"><div class="q-label">' + esc(T('nav.' + C.section)) + ' · ' + esc(T('practice.set')) + ' ' + st.set + ' · ' + esc(T('practice.mode_' + m.key)) + '</div></div>'
      + '<div class="question-card">';

    if (q.kind === 'builder') {
      // Sentence Builder: the same screen as in Homework
      h += H212Builder.render({ id: q.id, tiles: q.tiles, extra: q.extra ? [q.extra] : [], prompt_ja: q.question, answer: q.answer });
    } else if (q.kind === 'listen' || q.kind === 'convo') {
      // Play button first; the sentence stays hidden until the student has answered
      h += '<button type="button" class="listen-btn listen-btn-big" id="listen-btn" onclick="H212Practice.hear()">' + esc(T('listen.play')) + '</button>'
        + ((typeof H212Listen !== 'undefined' && H212Listen.soundHint) ? H212Listen.soundHint() : '')
        + '<div class="question-text">' + esc(visibleQuestion(q)) + '</div>'
        + choicesHtml(q)
        + '<div class="listen-reveal" id="pr-reveal" hidden></div>';
    } else {
      h += '<div class="question-text">' + esc(q.question) + '</div>' + choicesHtml(q) + '<div id="pr-pair"></div>';
    }
    h += '<button class="next-btn" id="next-btn" onclick="H212Practice.next()">' + esc(last ? T('hw.see_results') : T('hw.next_question')) + '</button>'
      + '</div>' + H212Mike.row();
    pc().innerHTML = h;

    if (q.kind === 'builder') {
      H212Builder.onChecked = onBuilt;
      H212Builder.speakAnswer = function (text) { playMode(cur().id, text); };
      H212Builder.afterRender();
    }
    var hint = { builder: 'hint_builder', listen: 'hint_listening', convo: 'hint_conversation' }[q.kind] || 'hint_practice';
    H212Mike.say(hint, st.i === 0);
  }

  // ── Sound: a recorded clip (audio/modes/<id>.m4a) if there is one, otherwise the robot voice ──
  function stopAudio() {
    if (player) { try { player.pause(); } catch (e) {} player = null; }
  }
  function playMode(id, text) {
    var robot = function () { if (typeof H212Listen !== 'undefined' && text) H212Listen.speakText(text); };
    var md = window.H212_VOICES && window.H212_VOICES.modes;
    if (!md || !md[id] || typeof Audio === 'undefined') { robot(); return; }
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    var a = new Audio('audio/modes/' + id + '.m4a?v=' + md[id]);
    player = a;
    a.onerror = function () { if (player === a) { player = null; robot(); } };
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function (e) {
      if (player !== a || (e && e.name === 'AbortError')) return;
      player = null;
      robot();   // the clip would not play: use the robot voice
    });
  }

  // The 🔊 Play button of Listening / Conversation
  function hear() {
    if (!st) return;
    var q = cur();
    playMode(q.id, q.audio_text);
  }

  // Say the word and its opposite ("brother, sister"), or the idiom, with the robot voice
  function say() {
    if (!st || typeof H212Listen === 'undefined') return;
    var q = cur();
    H212Listen.speakText(C.mode === 'pair' ? q.item + ', ' + q.pair : q.item);
  }

  function pairHtml(q) {
    var h = '<div class="pair-card">';
    if (C.mode === 'pair') {
      h += '<div class="pair-side"><span class="pair-word">' + esc(q.item) + '</span><span class="pair-ja" lang="ja">' + esc(q.item_ja) + '</span></div>'
        + '<span class="pair-arrow" aria-hidden="true">↔</span>'
        + '<div class="pair-side"><span class="pair-word">' + esc(q.pair) + '</span><span class="pair-ja" lang="ja">' + esc(q.pair_ja) + '</span></div>';
    } else {
      h += '<div class="pair-side"><span class="pair-word">' + esc(q.item) + '</span><span class="pair-ja" lang="ja">' + esc(q.item_ja) + '</span></div>';
    }
    return h + '<button type="button" class="speak-say" onclick="H212Practice.say()" aria-label="' + esc(T('listen.button')) + '">🔊</button></div>';
  }

  function showNext() {
    var n = document.getElementById('next-btn');
    if (n) n.style.display = 'inline-flex';
  }

  // Remember an answer on the page at once, and save it in the background
  function record(q, correct, chosen) {
    st.answered++;
    if (correct) st.correct++;
    seen[q.id] = true;
    if (correct) delete wrong[q.id]; else wrong[q.id] = true;
    post({ action: 'answer', id: q.id, chosen: chosen }).catch(function () {});
  }

  // A multiple-choice style answer (choice / blank / listen / convo)
  function answer(i) {
    if (!st || st.locked) return;
    st.locked = true;
    var q = cur(), chosen = q.choices[i], correct = (chosen === q.answer);
    var btns = document.querySelectorAll('.choice-btn');
    btns.forEach(function (b, bi) {
      b.disabled = true;
      if (q.choices[bi] === q.answer) b.classList.add('correct');
    });
    var msg = document.getElementById('result-msg');
    if (correct) {
      btns[i].classList.add('correct');
      msg.textContent = T('hw.correct_msg');
      msg.className = 'result-msg correct';
    } else {
      btns[i].classList.add('wrong');
      msg.textContent = T('hw.wrong_msg') + ' ' + q.answer;
      msg.className = 'result-msg wrong';
    }
    msg.style.display = 'block';
    if (q.kind === 'listen' || q.kind === 'convo') {
      // now that they have answered, show what was said
      var rv = document.getElementById('pr-reveal');
      rv.innerHTML = '<div class="listen-reveal-label">' + esc(T(q.kind === 'convo' ? 'practice.line_said' : 'practice.line_heard')) + '</div>'
        + '<div>“' + esc(q.audio_text) + '”</div>'
        + (q.kind === 'convo' ? '<div class="listen-reveal-label" style="margin-top:10px">' + esc(T('practice.line_best')) + '</div><div>“' + esc(q.answer) + '”</div>' : '');
      rv.hidden = false;
    } else {
      var pr = document.getElementById('pr-pair');
      if (pr) pr.innerHTML = pairHtml(q);
    }
    record(q, correct, chosen);
    showNext();
    H212Mike.say(correct ? 'correct' : 'wrong');
  }

  // A Sentence Builder answer was checked
  function onBuilt(res) {
    if (!st) return;
    var q = cur();
    st.locked = true;
    record(q, res.correct, res.chosen);
    showNext();
    H212Mike.say(res.correct ? 'correct' : 'wrong');
  }

  function next() {
    if (!st) return;
    if (st.i + 1 < st.qs.length) { st.i++; show(); window.scrollTo(0, 0); }
    else finish();
  }

  function finish() {
    var h = '<div class="question-card" style="text-align:center">'
      + '<div style="font-size:48px;margin-bottom:16px">🎉</div>'
      + '<div class="speak-finish-title">' + esc(T('practice.finish_title')) + '</div>'
      + '<div class="speak-finish-sub">' + esc(T('practice.finish_sub2').replace('{c}', st.correct).replace('{t}', st.qs.length)) + '</div>'
      + H212Mike.row()
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Practice.startMode(' + st.set + ',\'' + st.mode + '\')">' + esc(T('practice.again')) + '</button>'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Practice.exitMode()">' + esc(T('practice.back_modes')) + '</button>'
      + '</div></div>';
    pc().innerHTML = h;
    H212Mike.say('finish_good');
  }

  function exitMode() { var n = st ? st.set : 1; showModes(n); window.scrollTo(0, 0); }
  function exit() { showSets(); window.scrollTo(0, 0); }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('DOMContentLoaded', init);
    window.addEventListener('pagehide', function () { stopAudio(); });
  }

  return { start: start, startMode: startMode, answer: answer, next: next, hear: hear, say: say, exit: exit, exitMode: exitMode,
           _parse: parse, _init: init };
})();
