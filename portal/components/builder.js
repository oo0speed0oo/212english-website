// Sentence Builder: the student sees a Japanese sentence and builds the
// English sentence by tapping word tiles into order.
//
// Used by homework.php and tests.php:
//   H212Builder.parse(csvText)   -> rows from build-content.csv
//   H212Builder.render(q)        -> HTML for the question (inside .question-card)
//   H212Builder.onChecked = function (result) { ... }   // page saves score/seen/wrong
//        result = { correct: bool, chosen: 'what they built', answer: 'the right sentence' }
//
// build-content.csv columns: id,level,chapter,mode,source_id,prompt_ja,tiles,extra
//   tiles = the correct order, separated by |      extra = trap tiles, separated by |
//
// Needs window.H212_T: builder.instruction, builder.empty, builder.check, builder.clear,
// builder.wrong_msg, hw.correct_msg  (see h212_js_strings in each page).
var H212Builder = (function () {
  var st = null;   // the question on screen: { q, order: [tile ids shuffled], placed: [tile ids], done }

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
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      var cols = splitLine(lines[i].replace(/\r$/, ''));
      var get = function (name) {
        var idx = header.indexOf(name);
        return (idx === -1 || cols[idx] === undefined) ? '' : cols[idx].trim();
      };
      if (get('id') === '' || get('level') === '' || get('tiles') === '') continue;
      var tiles = get('tiles').split('|').map(function (t) { return t.trim(); }).filter(Boolean);
      var extra = get('extra') ? get('extra').split('|').map(function (t) { return t.trim(); }).filter(Boolean) : [];
      rows.push({
        id: get('id'), level: parseInt(get('level')), chapter: parseInt(get('chapter')),
        type: 'builder', mode: get('mode') === 'test' ? 'test' : 'homework',
        question: get('prompt_ja'), prompt_ja: get('prompt_ja'),
        tiles: tiles, extra: extra, answer: tiles.join(' ')
      });
    }
    return rows;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Every tile (correct words + trap words) gets its own number, so two
  // identical words (e.g. two "the") can be told apart.
  function tileText(id) { return st.texts[id]; }

  function render(q) {
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    var texts = q.tiles.concat(q.extra);
    var order = [];
    for (var i = 0; i < texts.length; i++) order.push(i);
    // Don't hand the student the answer already in order.
    var ident = order.join();
    for (var tries = 0; tries < 10; tries++) {
      shuffle(order);
      if (order.length < 2 || order.join() !== ident) break;
    }
    st = { q: q, texts: texts, order: order, placed: [], done: false };
    var T = window.H212_T;
    return '<div class="builder">'
      + '<div class="builder-label">' + esc(T['builder.instruction']) + '</div>'
      + '<div class="builder-prompt" lang="ja">' + esc(q.prompt_ja) + '</div>'
      + '<div class="builder-answer" id="builder-answer"></div>'
      + '<div class="builder-bank" id="builder-bank"></div>'
      + '<div class="builder-actions">'
      + '<button type="button" class="builder-check" id="builder-check" onclick="H212Builder.check()">' + esc(T['builder.check']) + '</button>'
      + '<button type="button" class="builder-clear" id="builder-clear" onclick="H212Builder.clear()">' + esc(T['builder.clear']) + '</button>'
      + '</div>'
      + '<div class="result-msg" id="result-msg"></div>'
      + '</div>';
  }

  // Redraw the two tile areas from the current state (called after render too).
  function draw() {
    var ans = document.getElementById('builder-answer');
    var bank = document.getElementById('builder-bank');
    if (!st || !ans || !bank) return;
    var T = window.H212_T, html = '', i;
    if (!st.placed.length) {
      html = '<span class="builder-hint">' + esc(T['builder.empty']) + '</span>';
    }
    for (i = 0; i < st.placed.length; i++) {
      html += '<button type="button" class="tile placed" onclick="H212Builder.tap(' + st.placed[i] + ')"' + (st.done ? ' disabled' : '') + '>'
        + esc(tileText(st.placed[i])) + '</button>';
    }
    ans.innerHTML = html;
    html = '';
    for (i = 0; i < st.order.length; i++) {
      var id = st.order[i];
      if (st.placed.indexOf(id) !== -1) {
        html += '<span class="tile ghost">' + esc(tileText(id)) + '</span>';
      } else {
        html += '<button type="button" class="tile" onclick="H212Builder.tap(' + id + ')"' + (st.done ? ' disabled' : '') + '>'
          + esc(tileText(id)) + '</button>';
      }
    }
    bank.innerHTML = html;
    var chk = document.getElementById('builder-check');
    var clr = document.getElementById('builder-clear');
    if (chk) chk.disabled = st.done || !st.placed.length;
    if (clr) clr.disabled = st.done || !st.placed.length;
  }

  // Tap a word in the bank to place it; tap a placed word to take it back.
  function tap(id) {
    if (!st || st.done) return;
    var at = st.placed.indexOf(id);
    if (at === -1) st.placed.push(id); else st.placed.splice(at, 1);
    draw();
  }

  function clear() {
    if (!st || st.done) return;
    st.placed = [];
    draw();
  }

  // Check = exact order. Shows ✅ or the correct sentence, then says the sentence.
  function check() {
    if (!st || st.done || !st.placed.length) return;
    st.done = true;
    var chosen = st.placed.map(tileText).join(' ');
    var answer = st.q.answer;
    var correct = chosen === answer;
    var T = window.H212_T;
    var msg = document.getElementById('result-msg');
    if (msg) {
      msg.className = 'result-msg ' + (correct ? 'correct' : 'wrong');
      msg.innerHTML = correct
        ? esc(T['hw.correct_msg']) + '<div class="builder-sentence">' + esc(answer) + '</div>'
        : esc(T['builder.wrong_msg']) + '<div class="builder-sentence">' + esc(answer) + '</div>';
      msg.style.display = 'block';
    }
    draw();
    var ans = document.getElementById('builder-answer');
    if (ans) ans.classList.add(correct ? 'is-correct' : 'is-wrong');
    if (typeof H212Listen !== 'undefined' && H212Listen.speakText) H212Listen.speakText(answer);
    if (typeof H212Builder.onChecked === 'function') {
      H212Builder.onChecked({ correct: correct, chosen: chosen, answer: answer });
    }
  }

  // render() returns HTML that the page then puts on screen, so the tiles are
  // drawn right after (next tick) once those elements exist.
  function afterRender() { draw(); }

  return { parse: parse, render: render, afterRender: afterRender, tap: tap, clear: clear, check: check, onChecked: null };
})();
