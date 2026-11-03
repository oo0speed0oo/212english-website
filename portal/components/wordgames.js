// Word games for the Spelling section (and, later, Phonics): one engine, any word list.
//   H212WordGames.missing(cfg)   Missing Letters (Easy: 1 letter, 3 big tiles. Normal: 2-3 letters, a tile bank or the keyboard)
// Search and Crossword are added in later steps.
//
// cfg: {
//   words:   [ { w: 'cat', ja: '猫', img: 'ch01_cat.jpg' (or '') } ],   the word list (lower-case letters only)
//   mode:    'easy' | 'normal',
//   kicker:  'Spelling · Level 1 Chapter 3',                            small line above the question
//   back:    "H212Spelling.set('L1-03')",                               what the X / Back buttons do (JS text)
//   again:   "H212Spelling.play('L1-03','missing')",                    what "Try again" does (JS text)
//   hear:    function (word) { ... },                                   plays the word (recording or robot voice)
//   imgUrl:  function (file) { return 'images/vocab/' + file; },        link for a picture file
//   done:    function (percent, right, total) { ... }                   called once when a round is finished
// }
// Needs window.H212_T (wg.* strings), H212UI. Practice only: nothing here counts for unlocks or Grades.
var H212WordGames = (function () {
  var ROUND = 10;                 // questions in a round
  var VOWELS = 'aeiou', ALPHA = 'abcdefghijklmnopqrstuvwxyz';
  var G = null;                   // the round in progress

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(key) { return (window.H212_T && window.H212_T[key]) || ''; }
  function fill(text, vars) {
    Object.keys(vars).forEach(function (k) { text = text.split('{' + k + '}').join(vars[k]); });
    return text;
  }
  function pc() { return document.getElementById('page-content'); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function isVowel(c) { return VOWELS.indexOf(c) !== -1; }

  // ── Building a round ────────────────────────────────
  // Easy uses the shortest 8 words of the set; Normal can use any word of it.
  function pool(words, mode) {
    var list = words.slice();
    if (mode === 'easy') {
      list.sort(function (a, b) { return a.w.length - b.w.length; });
      var short = list.filter(function (x) { return x.w.length <= 7; });
      list = (short.length >= 6 ? short : list).slice(0, 8);
    }
    return list;
  }

  // Wrong letters for a tile: the same kind as the missing letter (vowel for vowel), never a letter that is right.
  function extras(correct, count) {
    var out = [], want = correct.map(function (c) { return isVowel(c); });
    var tries = 0;
    while (out.length < count && tries++ < 200) {
      var vowelish = want[out.length % want.length];
      var pickFrom = vowelish ? VOWELS : ALPHA.replace(/[aeiou]/g, '');
      var c = pickFrom.charAt(Math.floor(Math.random() * pickFrom.length));
      if (correct.indexOf(c) === -1 && out.indexOf(c) === -1) out.push(c);
    }
    return out;
  }

  function question(item, mode) {
    var w = item.w, n = w.length, spots = [];
    var k = mode === 'easy' ? 1 : (n <= 4 ? 2 : 3);
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    if (mode === 'easy') {
      // one missing letter: a vowel when the word has one (the hard bit of most words), else any letter
      var vs = idx.filter(function (i) { return isVowel(w.charAt(i)); });
      spots = [ (vs.length ? vs : idx)[Math.floor(Math.random() * (vs.length || idx.length))] ];
    } else {
      spots = shuffle(idx).slice(0, k).sort(function (a, b) { return a - b; });
    }
    var need = spots.map(function (i) { return w.charAt(i); });
    var tiles = mode === 'easy'
      ? shuffle(need.concat(extras(need, 2)))
      : shuffle(need.concat(extras(need, Math.min(3, 8 - need.length))));
    return { w: w, ja: item.ja || '', img: item.img || '', spots: spots, filled: {}, tiles: tiles, used: {}, mistakes: 0, done: false };
  }

  function build(cfg) {
    var items = shuffle(pool(cfg.words, cfg.mode)).slice(0, ROUND);
    return items.map(function (it) { return question(it, cfg.mode); });
  }

  // ── Screens ─────────────────────────────────────────
  function wordHtml(q) {
    var h = '<div class="wg-word" aria-label="' + esc(q.w) + '">';
    for (var i = 0; i < q.w.length; i++) {
      var isSpot = q.spots.indexOf(i) !== -1;
      if (!isSpot) h += '<span class="wg-l">' + esc(q.w.charAt(i)) + '</span>';
      else if (q.filled[i]) h += '<span class="wg-l wg-ok">' + esc(q.filled[i]) + '</span>';
      else h += '<span class="wg-l wg-blank">&nbsp;</span>';
    }
    return h + '</div>';
  }
  function clueHtml(q) {
    var h = '<div class="wg-clue">';
    if (q.img && G.cfg.imgUrl) {
      // a picture that will not load is replaced by the speaker: never a broken picture
      h += '<img class="wg-pic" src="' + esc(G.cfg.imgUrl(q.img)) + '" alt="" onerror="H212WordGames.noPic(this)">';
    }
    h += '<button type="button" class="wg-hear' + (q.img ? ' wg-hear-small' : '') + '" onclick="H212WordGames.hear()" aria-label="' + esc(T('listen.button')) + '">🔊</button>';
    h += '</div>';
    if (q.ja) h += '<div class="wg-ja" lang="ja">' + esc(q.ja) + '</div>';
    return h;
  }
  function tilesHtml(q) {
    var h = '<div class="wg-tiles' + (G.cfg.mode === 'easy' ? ' wg-tiles-easy' : '') + '" id="wg-tiles">';
    q.tiles.forEach(function (c, i) {
      h += '<button type="button" class="wg-tile" id="wg-t' + i + '"' + (q.used[i] ? ' disabled' : '') + ' onclick="H212WordGames.pick(' + i + ')">' + esc(c) + '</button>';
    });
    return h + '</div>';
  }

  function show() {
    var q = G.qs[G.i], cfg = G.cfg, last = G.i + 1 >= G.qs.length;
    G.locked = false;
    var h = H212UI.qTop({ onclose: cfg.back, label: T('wg.back'), index: G.i, total: G.qs.length, noScore: true })
      + '<div class="grp-spelling"><div class="q-label">' + esc(cfg.kicker) + ' · ' + esc(T('wg.game_missing')) + '</div></div>'
      + '<div class="question-card grp-spelling">'
      + '<div class="wg-inst">' + esc(T(cfg.mode === 'easy' ? 'wg.inst_easy' : 'wg.inst_normal')) + '</div>'
      + '<div id="wg-clue">' + clueHtml(q) + '</div>'
      + '<div id="wg-word">' + wordHtml(q) + '</div>'
      + tilesHtml(q)
      + '<div class="result-msg" id="wg-msg" role="status"></div>'
      + '<button class="next-btn" id="next-btn" onclick="H212WordGames.next()">' + esc(last ? T('wg.see_results') : T('wg.next')) + '</button>'
      + '</div>';
    pc().innerHTML = h;
    hear();
  }

  function hear() {
    if (!G) return;
    var q = G.qs[G.i];
    if (G.cfg.hear) G.cfg.hear(q.w);
  }

  // A tile was tapped (or its letter typed)
  function pick(i) {
    if (!G || G.locked) return;
    var q = G.qs[G.i];
    if (q.used[i]) return;
    var c = q.tiles[i], slot = -1;
    for (var k = 0; k < q.spots.length; k++) {
      if (!q.filled[q.spots[k]] && q.w.charAt(q.spots[k]) === c) { slot = q.spots[k]; break; }
    }
    var btn = document.getElementById('wg-t' + i);
    if (slot < 0) {
      // wrong letter: it turns red for a moment, nothing is lost
      q.mistakes++;
      if (btn) { btn.classList.add('wg-bad'); setTimeout(function () { btn.classList.remove('wg-bad'); }, 600); }
      return;
    }
    q.filled[slot] = c;
    q.used[i] = true;
    if (btn) btn.disabled = true;
    var w = document.getElementById('wg-word');
    if (w) w.innerHTML = wordHtml(q);
    if (q.spots.every(function (s) { return q.filled[s]; })) solved(q);
  }

  function solved(q) {
    q.done = true;
    G.locked = true;
    var msg = document.getElementById('wg-msg');
    if (msg) { msg.textContent = T('wg.right') + ' ' + q.w; msg.className = 'result-msg correct'; msg.style.display = 'block'; }
    var nb = document.getElementById('next-btn');
    if (nb) nb.style.display = 'inline-flex';
    hear();                                   // say the whole word again
  }

  // The keyboard (Mac): a typed letter taps the first unused tile with that letter
  function onKey(e) {
    if (!G || G.locked || !e || !e.key || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    var c = e.key.toLowerCase();
    if (ALPHA.indexOf(c) === -1) return;
    var q = G.qs[G.i];
    for (var i = 0; i < q.tiles.length; i++) { if (!q.used[i] && q.tiles[i] === c) { pick(i); return; } }
    q.mistakes++;                             // a letter that is not on any tile counts as a wrong try
  }

  function next() {
    if (!G) return;
    if (G.i + 1 < G.qs.length) { G.i++; show(); window.scrollTo(0, 0); }
    else finish();
  }

  function finish() {
    var total = G.qs.length, right = G.qs.filter(function (q) { return q.mistakes === 0; }).length;
    var pct = Math.max(1, Math.round(right * 100 / total));
    if (G.cfg.done) G.cfg.done(pct, right, total);
    var h = '<div class="question-card grp-spelling" style="text-align:center">'
      + '<div class="wg-cheer" aria-hidden="true">🎉</div>'
      + '<div class="speak-finish-title">' + esc(T('wg.finish_title')) + '</div>'
      + '<div class="speak-finish-sub">' + esc(fill(T('wg.finish_sub'), { c: right, t: total })) + '</div>'
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
      + '<button class="next-btn" style="display:inline-flex" onclick="' + G.cfg.again + '">' + esc(T('wg.again')) + '</button>'
      + '<button class="next-btn" style="display:inline-flex" onclick="' + G.cfg.back + '">' + esc(T('wg.back')) + '</button>'
      + '</div></div>';
    pc().innerHTML = h;
  }

  // ── Starting a game ─────────────────────────────────
  function missing(cfg) {
    cfg.mode = cfg.mode === 'normal' ? 'normal' : 'easy';
    var qs = build(cfg);
    if (!qs.length) { if (cfg.back) { /* nothing to play */ } return false; }
    G = { cfg: cfg, qs: qs, i: 0, locked: false };
    show();
    window.scrollTo(0, 0);
    return true;
  }

  function noPic(img) {
    if (img && img.parentNode) img.parentNode.removeChild(img);
    var b = document.querySelector('.wg-hear');
    if (b) b.classList.remove('wg-hear-small');
  }

  if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('keydown', onKey);

  return {
    missing: missing, pick: pick, next: next, hear: hear, noPic: noPic, stop: function () { G = null; },
    _build: build, _pool: pool, _state: function () { return G; }
  };
})();
