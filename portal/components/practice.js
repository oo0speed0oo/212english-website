// Opposites and Idioms practice (one engine, two sections). Practice only: it never
// counts for unlocking chapters or for Grades.
//
// Screens: the list of SETS (a tick shows a finished set) -> the questions of one set
// (the two multiple-choice kinds first, then the "write your own sentence" kind).
// After each choice question the student sees the pair/idiom with both Japanese meanings and a
// 🔊 button. Written sentences are checked and saved on the server (inc/practice.php) so the
// teacher can read them in wp-admin > 212 English > Student Results.
//
// Page setup (inc/practice-page.php) sets window.H212_PRACTICE:
//   { section, csv, mode: 'pair'|'item', kinds: [...], fields: { item, item_ja, pair, pair_ja } }
// and needs window.H212_T (practice.* strings), window.H212_NONCE, H212UI, H212Mike, H212Listen.
var H212Practice = (function () {
  var C     = window.H212_PRACTICE || {};
  var rows  = [];      // every question of this section
  var seen  = {};      // id -> true: answered / sentence saved
  var wrong = {};      // id -> true: currently wrong
  var st    = null;    // the set in progress: { set, qs, i, correct, answered, sentences, locked }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(key) { return (window.H212_T && window.H212_T[key]) || ''; }
  function pc() { return document.getElementById('page-content'); }
  function sectionKey(suffix) { return 'practice.' + C.section + '_' + suffix; }

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
      var req = get('required_words').split('|').map(function (w) { return w.trim(); }).filter(function (w) { return w && w !== '-'; });
      var ex = get('example');
      out.push({
        id: get('id'), set: parseInt(get('set')), kind: get('kind').toLowerCase(),
        item: get(f.item || 'word'), item_ja: get(f.item_ja || 'word_ja'),
        pair: f.pair ? get(f.pair) : '', pair_ja: f.pair_ja ? get(f.pair_ja) : '',
        question: get('question'),
        choices: [get('choice_a'), get('choice_b'), get('choice_c')],
        answer: get('answer'), required: req, example: ex === '-' ? '' : ex
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

  function init() {
    pc().innerHTML = '<div class="video-msg">' + esc(T('practice.loading')) + '</div>';
    var csv = fetch(C.csv, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { rows = t ? parse(t) : []; }).catch(function () { rows = []; });
    var prog = fetch('inc/practice.php?section=' + encodeURIComponent(C.section), { cache: 'no-store' })
      .then(function (r) { return r.json(); }).then(setLists).catch(function () { setLists({}); });
    Promise.all([csv, prog]).then(showSets);
  }

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
  function isDone(q) { return seen[q.id] && !wrong[q.id]; }

  function showSets() {
    st = null;
    var list = sets();
    var h = '<div class="section-header"><h2>' + esc(T('nav.' + C.section)) + '</h2><p>' + esc(T(sectionKey('subtitle'))) + '</p></div>'
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

  // ── One set ─────────────────────────────────────────
  function start(n) {
    var all = rows.filter(function (q) { return q.set === n; });
    if (!all.length) return;
    var kinds = C.kinds || [];
    all = all.map(function (q, idx) { return { q: q, idx: idx }; });
    all.sort(function (a, b) {
      var ka = kinds.indexOf(a.q.kind), kb = kinds.indexOf(b.q.kind);
      return ka !== kb ? ka - kb : a.idx - b.idx;
    });
    all = all.map(function (x) { return x.q; });
    var pool = all.filter(function (q) { return !isDone(q); });   // unfinished first; a finished set can be replayed in full
    st = { set: n, qs: pool.length ? pool : all, i: 0, correct: 0, answered: 0, sentences: 0, locked: false };
    show();
    window.scrollTo(0, 0);
  }

  function cur() { return st.qs[st.i]; }

  function kindLabel(kind) { return T('practice.kind_' + kind) || kind; }

  function show() {
    var q = cur();
    st.locked = false;
    var last = st.i + 1 >= st.qs.length;
    var h = H212UI.qTop({ onclose: 'H212Practice.exit()', label: T('practice.back_sets'), index: st.i, total: st.qs.length, noScore: true })
      + '<div class="grp-' + esc(C.section) + '"><div class="q-label">' + esc(T('nav.' + C.section)) + ' · ' + esc(T('practice.set')) + ' ' + st.set + ' · ' + esc(kindLabel(q.kind)) + '</div></div>'
      + '<div class="question-card">'
      + '<div class="question-text">' + esc(q.question) + '</div>';

    if (q.kind === 'write') {
      if (q.required.length) {
        h += '<div class="practice-use">' + esc(T('practice.use_words')) + ' '
          + q.required.map(function (w) { return '<b>' + esc(w) + '</b>'; }).join(' ') + '</div>';
      }
      h += '<textarea id="pr-text" class="practice-text" rows="3" maxlength="500" lang="en" spellcheck="false" placeholder="' + esc(T('practice.write_ph')) + '"></textarea>'
        + '<div class="practice-status" id="pr-status" role="status"></div>'
        + '<div class="practice-example" id="pr-example" hidden></div>'
        + '<div class="practice-actions">'
        + '<button type="button" class="builder-check" id="pr-check" onclick="H212Practice.check()">' + esc(T('practice.check')) + '</button>'
        + '<button type="button" class="speak-link" id="pr-skip" onclick="H212Practice.next()">' + esc(T('practice.skip')) + '</button>'
        + '</div>';
    } else {
      h += '<div class="choices">';
      q.choices.forEach(function (c, i) {
        h += '<button type="button" class="choice-btn" onclick="H212Practice.answer(' + i + ')">' + esc(c) + '</button>';
      });
      h += '</div><div class="result-msg" id="result-msg"></div><div id="pr-pair"></div>';
    }
    h += '<button class="next-btn" id="next-btn" onclick="H212Practice.next()">' + esc(last ? T('hw.see_results') : T('hw.next_question')) + '</button>'
      + '</div>' + H212Mike.row();
    pc().innerHTML = h;
    H212Mike.say(q.kind === 'write' ? 'hint_write' : 'hint_practice', st.i === 0);
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

  // Say the word and its opposite ("brother, sister"), or the idiom, with the robot voice
  function say() {
    if (!st || typeof H212Listen === 'undefined') return;
    var q = cur();
    H212Listen.speakText(C.mode === 'pair' ? q.item + ', ' + q.pair : q.item);
  }

  function showNext() {
    var n = document.getElementById('next-btn');
    if (n) n.style.display = 'inline-flex';
  }

  // A multiple-choice answer: show the result at once, and save it in the background.
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
      st.correct++;
    } else {
      btns[i].classList.add('wrong');
      msg.textContent = T('hw.wrong_msg') + ' ' + q.answer;
      msg.className = 'result-msg wrong';
    }
    msg.style.display = 'block';
    st.answered++;
    seen[q.id] = true;
    if (correct) delete wrong[q.id]; else wrong[q.id] = true;
    document.getElementById('pr-pair').innerHTML = pairHtml(q);
    showNext();
    H212Mike.say(correct ? 'correct' : 'wrong');
    post({ action: 'answer', id: q.id, chosen: chosen }).catch(function () {});
  }

  function setStatus(text, kind) {
    var s = document.getElementById('pr-status');
    if (!s) return;
    s.textContent = text || '';
    s.className = 'practice-status' + (kind ? ' ' + kind : '');
  }

  // The "write your own sentence" question: the server checks the required words and the length.
  function check() {
    if (!st || st.locked) return;
    var q = cur();
    var el = document.getElementById('pr-text');
    var text = el ? el.value.replace(/\s+/g, ' ').trim() : '';
    if (!text) { setStatus(T('practice.empty'), 'err'); return; }
    var btn = document.getElementById('pr-check');
    if (btn) btn.disabled = true;
    post({ action: 'sentence', id: q.id, text: text }).then(function (res) {
      if (btn) btn.disabled = false;
      if (res && res.ok) {
        st.locked = true;
        st.sentences++;
        st.answered++;
        setStatus(T('practice.saved'), 'ok');
        if (el) el.readOnly = true;
        if (btn) btn.style.display = 'none';
        var skip = document.getElementById('pr-skip');
        if (skip) skip.style.display = 'none';
        if (res.example) {
          var ex = document.getElementById('pr-example');
          ex.innerHTML = '<span class="practice-example-label">' + esc(T('practice.example')) + '</span> “' + esc(res.example) + '”';
          ex.hidden = false;
        }
        showNext();
        H212Mike.say('correct');
      } else if (res && res.missing !== undefined) {
        var parts = [];
        if (res.short) parts.push(T('practice.short').replace('{n}', res.min || 4));
        if (res.missing && res.missing.length) parts.push(T('practice.missing') + ' ' + res.missing.join(', '));
        setStatus(parts.join(' '), 'err');
        H212Mike.say('wrong');
      } else {
        setStatus(T('practice.error_save'), 'err');
      }
    }).catch(function () {
      if (btn) btn.disabled = false;
      setStatus(T('practice.error_save'), 'err');
    });
  }

  function next() {
    if (!st) return;
    if (st.i + 1 < st.qs.length) { st.i++; show(); window.scrollTo(0, 0); }
    else finish();
  }

  function finish() {
    var choiceQs = st.qs.filter(function (q) { return q.kind !== 'write'; }).length;
    var h = '<div class="question-card" style="text-align:center">'
      + '<div style="font-size:48px;margin-bottom:16px">🎉</div>'
      + '<div class="speak-finish-title">' + esc(T('practice.finish_title')) + '</div>'
      + '<div class="speak-finish-sub">' + esc(T('practice.finish_sub').replace('{c}', st.correct).replace('{t}', choiceQs).replace('{s}', st.sentences)) + '</div>'
      + H212Mike.row()
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Practice.start(' + st.set + ')">' + esc(T('practice.again')) + '</button>'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Practice.exit()">' + esc(T('practice.back_sets')) + '</button>'
      + '</div></div>';
    pc().innerHTML = h;
    H212Mike.say('finish_good');
  }

  function exit() { showSets(); window.scrollTo(0, 0); }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('DOMContentLoaded', init);
  }

  return { start: start, answer: answer, check: check, next: next, say: say, exit: exit,
           _parse: parse, _init: init };
})();
