// Spelling screens: Groups (Level 1 / Level 2 / Opposites) -> word sets -> the games of one set.
// Practice only: it never counts for unlocking chapters or Grades.
//
// Page setup (spelling.php) sets window.H212_SPELLING (groups, sets, words, imgv, audio, progress, mode),
// window.H212_T (spell.* and wg.* strings) and window.H212_NONCE, and loads listen.js (robot voice),
// ui.js and wordgames.js (the games). The word list is portal/spelling/spelling-words.csv, read by inc/spelling-data.php.
//
// Games so far: Missing Letters, Word Search, Crossword. Easy (かんたん) or Normal (ふつう): the choice is remembered (user meta h212_spelling).
// The clue for every word is the picture (when the file is on the site), a 🔊 button and the Japanese meaning.
var H212Spelling = (function () {
  var P = window.H212_SPELLING || { groups: [], sets: [], words: [], imgv: {}, audio: { v: 0, words: [] }, progress: {}, mode: '' };
  var READY = ['missing', 'search', 'cross'];   // games that exist so far; add 'print' when it is built
  var GAMES = ['missing', 'search', 'cross', 'print'];
  var ICONS = { missing: 'builder', search: 'vocabulary', cross: 'grammar', print: 'conversation' };
  var player = null;
  var mode = P.mode === 'normal' ? 'normal' : 'easy';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(k) { return (window.H212_T && window.H212_T[k]) || ''; }
  function fill(text, vars) {
    Object.keys(vars).forEach(function (k) { text = text.split('{' + k + '}').join(vars[k]); });
    return text;
  }
  function pc() { return document.getElementById('page-content'); }
  function key(js) { return ' role="button" tabindex="0" onclick="' + js + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + js + ';}"'; }
  function has(list, v) { return (list || []).indexOf(v) !== -1; }
  function setById(id) { return P.sets.filter(function (s) { return s.id === id; })[0]; }
  function wordsOf(id) {
    return P.words.filter(function (r) { return r[0] === id; }).map(function (r) { return { w: r[1], ja: r[2], img: r[3] }; });
  }

  // ── Progress ────────────────────────────────────────
  function got(id, game) { return !!(P.progress[id] && P.progress[id][game]); }
  function setDone(id) { return READY.every(function (g) { return got(id, g); }); }
  function post(body) {
    body.nonce = window.H212_NONCE;
    return fetch('inc/spelling.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(function () {});
  }
  function save(id, game, score) {
    score = Math.max(1, Math.min(100, score || 1));
    if (!P.progress[id]) P.progress[id] = {};
    P.progress[id][game] = Math.max(P.progress[id][game] || 0, score);
    post({ action: 'part', set: id, part: game, score: score });
  }

  // ── Sound ───────────────────────────────────────────
  function stopAudio() {
    if (player) { try { player.pause(); } catch (e) {} player = null; }
  }
  // The recording audio/spelling/<word>.m4a, or the robot voice if there is none (or it will not play)
  function hearWord(word) {
    var robot = function () { if (typeof H212Listen !== 'undefined') H212Listen.speakText(word); };
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    if (!has(P.audio.words, word) || typeof Audio === 'undefined') { robot(); return; }
    var a = new Audio('audio/spelling/' + encodeURIComponent(word) + '.m4a?v=' + (P.audio.v || 0));
    player = a;
    a.onerror = function () { if (player === a) { player = null; robot(); } };
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function (e) {
      if (player !== a || (e && e.name === 'AbortError')) return;
      player = null;
      robot();
    });
  }

  // ── Easy / Normal switch ────────────────────────────
  function modeSwitch() {
    function btn(m, label) {
      return '<button type="button" class="sp-mode' + (mode === m ? ' is-on' : '') + '" aria-pressed="' + (mode === m) + '" onclick="H212Spelling.setMode(\'' + m + '\')">' + esc(label) + '</button>';
    }
    return '<div class="sp-modes grp-spelling" role="group" aria-label="' + esc(T('spell.level')) + '">'
      + '<span class="sp-modes-label">' + esc(T('spell.level')) + '</span>' + btn('easy', T('spell.easy')) + btn('normal', T('spell.normal')) + '</div>';
  }
  function setMode(m) {
    if (m !== 'easy' && m !== 'normal') return;
    mode = m;
    P.mode = m;
    post({ action: 'mode', mode: m });
    var on = document.querySelectorAll('.sp-mode');
    for (var i = 0; i < on.length; i++) {
      var isEasy = /easy/.test(on[i].getAttribute('onclick'));
      var active = (isEasy && m === 'easy') || (!isEasy && m === 'normal');
      on[i].classList[active ? 'add' : 'remove']('is-on');
      on[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  // ── Groups ──────────────────────────────────────────
  function showHome() {
    stopAudio();
    if (typeof H212WordGames !== 'undefined') H212WordGames.stop();
    var h = '<div class="section-header"><h2>' + esc(T('nav.spelling')) + '</h2><p>' + esc(T('spell.subtitle')) + '</p></div>'
      + modeSwitch()
      + '<div class="practice-choose">' + esc(T('spell.choose_group')) + '</div>'
      + '<div class="part-group grp-spelling"><div class="type-grid">';
    P.groups.forEach(function (g) {
      var sets = P.sets.filter(function (s) { return s.group === g.key; });
      if (!sets.length) return;
      var done = sets.filter(function (s) { return setDone(s.id); }).length;
      h += '<div class="type-btn"' + key('H212Spelling.group(\'' + g.key + '\')') + '>'
        + '<span class="icon sp-groupicon">' + esc(g.key === 'OPP' ? '↔' : g.key.replace('L', '')) + '</span>'
        + '<span class="lbl">' + esc(T('spell.group_' + g.key)) + '</span>'
        + '<span class="sub">' + esc(fill(T('spell.sets_n'), { n: sets.length })) + '</span>'
        + (done === sets.length ? '<span class="status done">✓ ' + esc(T('spell.done')) + '</span>' : (done ? '<span class="status part">' + done + '/' + sets.length + '</span>' : ''))
        + '</div>';
    });
    h += '</div></div>';
    pc().innerHTML = h;
  }

  // ── Sets of one group ───────────────────────────────
  function showGroup(gk) {
    stopAudio();
    var g = P.groups.filter(function (x) { return x.key === gk; })[0];
    if (!g) return showHome();
    var sets = P.sets.filter(function (s) { return s.group === gk; });
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Spelling.home()" aria-label="' + esc(T('spell.back_groups')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(T('nav.spelling')) + '</div>'
      + '<div class="chapter-head-title">' + esc(T('spell.group_' + gk)) + '</div></div></div>'
      + modeSwitch()
      + '<div class="practice-choose">' + esc(T('spell.choose_set')) + '</div>'
      + '<div class="chapter-grid practice-sets grp-spelling">';
    sets.forEach(function (s) {
      var all = setDone(s.id), any = !!P.progress[s.id];
      h += '<div class="chapter-btn practice-set' + (all ? ' is-done' : '') + '"' + key('H212Spelling.set(\'' + s.id + '\')') + '>'
        + '<span class="num">' + s.num + '</span><span class="lbl">' + esc(T(gk === 'OPP' ? 'spell.set' : 'spell.chapter')) + ' ' + s.num + '</span>'
        + '<span class="sp-n">' + esc(fill(T('spell.words_n'), { n: s.words })) + '</span>'
        + '<span class="status ' + (all ? 'done-tick' : (any ? 'part' : 'take')) + '">' + (all ? '✓ ' + esc(T('spell.done')) : esc(T('spell.new'))) + '</span></div>';
    });
    h += '</div>';
    pc().innerHTML = h;
  }

  // ── One set: its games ──────────────────────────────
  function showSet(id) {
    stopAudio();
    if (typeof H212WordGames !== 'undefined') H212WordGames.stop();
    var s = setById(id);
    if (!s) return showHome();
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Spelling.group(\'' + s.group + '\')" aria-label="' + esc(T('spell.back_sets')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(T('nav.spelling')) + ' · ' + esc(T('spell.group_' + s.group)) + '</div>'
      + '<div class="chapter-head-title">' + esc(s.title) + '</div></div></div>'
      + modeSwitch()
      + '<div class="practice-choose">' + esc(T('spell.choose_game')) + ' · ' + esc(fill(T('spell.words_n'), { n: s.words })) + '</div>'
      + '<div class="part-group grp-spelling"><div class="type-grid">';
    GAMES.forEach(function (g) {
      var ready = READY.indexOf(g) !== -1;
      var best = P.progress[id] && P.progress[id][g];
      h += '<div class="type-btn' + (ready ? '' : ' empty') + '"' + (ready ? key('H212Spelling.play(\'' + id + '\',\'' + g + '\')') : '') + '>'
        + '<span class="icon">' + H212UI.icons[ICONS[g]] + '</span>'
        + '<span class="lbl">' + esc(T('spell.game_' + g)) + '</span>'
        + '<span class="sub">' + esc(ready ? T('spell.game_' + g + '_sub') : T('spell.coming')) + '</span>'
        + (ready ? (best ? '<span class="status done">✓ ' + esc(fill(T('spell.best'), { n: best })) + '</span>' : '<span class="status take">' + esc(T('spell.new')) + '</span>') : '')
        + '</div>';
    });
    h += '</div></div>';
    pc().innerHTML = h;
  }

  // ── Playing a game ──────────────────────────────────
  function play(id, game) {
    var s = setById(id);
    if (!s || READY.indexOf(game) === -1) return;
    stopAudio();
    var cfg = {
      words: wordsOf(id), mode: mode,
      kicker: s.title,
      back: 'H212Spelling.set(\'' + id + '\')',
      again: 'H212Spelling.play(\'' + id + '\',\'' + game + '\')',
      hear: hearWord,
      imgUrl: function (f) { return 'images/vocab/' + f + (P.imgv && P.imgv[f] > 1 ? '?v=' + P.imgv[f] : ''); },
      done: function (pct) { save(id, game, pct); }
    };
    if (game === 'missing') H212WordGames.missing(cfg);
    else if (game === 'search') H212WordGames.search(cfg);
    else if (game === 'cross') H212WordGames.cross(cfg);
  }

  function goTop() { window.scrollTo(0, 0); }
  function init() { showHome(); }

  return {
    init: init,
    home: function () { showHome(); goTop(); },
    group: function (k) { showGroup(k); goTop(); },
    set: function (id) { showSet(id); goTop(); },
    play: play,
    setMode: setMode,
    _state: function () { return P; }
  };
})();

document.addEventListener('DOMContentLoaded', H212Spelling.init);
