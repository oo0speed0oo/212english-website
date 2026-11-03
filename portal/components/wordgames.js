// Word games for the Spelling section (and, later, Phonics): one engine, any word list.
//   H212WordGames.missing(cfg)   Missing Letters (Easy: 1 letter, 3 big tiles. Normal: 2-3 letters, a tile bank or the keyboard)
//   H212WordGames.search(cfg)    Word Search (Easy: 5x5 or 6x6, 4-5 words, right and down. Normal: 8x8, 6-8 words, right, down and diagonal)
// Crossword is added in a later step.
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
// (Word Search also uses cfg.title for the page heading line and shows each word's picture/sound/Japanese in its list.)
// }
// Needs window.H212_T (wg.* strings), H212UI. Practice only: nothing here counts for unlocks or Grades.
var H212WordGames = (function () {
  var ROUND = 10;                 // questions in a round
  var VOWELS = 'aeiou', ALPHA = 'abcdefghijklmnopqrstuvwxyz';
  var G = null;                   // the Missing Letters round in progress
  var W = null;                   // the Word Search in progress

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


  // ══ Word Search ═════════════════════════════════════
  // Tap the first letter and then the last letter of a word, or drag across it. A found word gets a colour,
  // plays its sound and is ticked off the list. "Show me one" makes the first letter of a word you have not found blink.
  var COLOURS = ['#FFE29A', '#BFE8C8', '#BBD7F7', '#F6C4D8', '#D9C8F2', '#FFD3B0', '#C6EDEA', '#E5E5A3'];
  var DIRS_EASY = [[0, 1], [1, 0]];                 // right, down
  var DIRS_NORMAL = [[0, 1], [1, 0], [1, 1]];       // right, down, down-right
  var ALL8 = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [-1, 1], [1, -1]];

  // The words and the grid size for a search: Easy 4-5 short words in 5x5 / 6x6, Normal up to 8 words in 8x8.
  function searchWords(words, mode) {
    var max = mode === 'easy' ? 6 : 8;
    var list = shuffle(pool(words, mode).filter(function (x) { return x.w.length <= max; }));
    var out = [];
    if (mode === 'easy') {
      // the shortest words of the set; if the set has too few, borrow more short words from it
      if (list.length < 4) {
        var more = words.filter(function (x) { return x.w.length <= max && !list.some(function (y) { return y.w === x.w; }); });
        list = list.concat(shuffle(more));
      }
      if (list.length < 3) {
        // a set of long words (3 or fewer of 6 letters or less): allow 7 letters, on a 7x7 grid
        list = shuffle(words.filter(function (x) { return x.w.length <= 7; })).sort(function (a, b) { return a.w.length - b.w.length; });
      }
      out = list.slice(0, 5);
      var longest = out.reduce(function (m, x) { return Math.max(m, x.w.length); }, 0);
      var size = longest > 6 ? 7 : (longest > 5 ? 6 : 5);
      if (size === 5) out = out.slice(0, 4);
      return { items: out, size: size };
    }
    return { items: list.slice(0, 8), size: 8 };
  }

  // Puts every word in a grid. Returns null if it cannot (the caller tries again).
  function placeWords(items, size, dirs) {
    var grid = [], r, c;
    for (r = 0; r < size; r++) { grid.push([]); for (c = 0; c < size; c++) grid[r].push(''); }
    var placed = [];
    var order = items.slice().sort(function (a, b) { return b.w.length - a.w.length; });
    for (var k = 0; k < order.length; k++) {
      var w = order[k].w, ok = false;
      for (var t = 0; t < 120 && !ok; t++) {
        var d = dirs[Math.floor(Math.random() * dirs.length)];
        var r0 = Math.floor(Math.random() * size), c0 = Math.floor(Math.random() * size);
        var r1 = r0 + d[0] * (w.length - 1), c1 = c0 + d[1] * (w.length - 1);
        if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) continue;
        var fits = true;
        for (var i = 0; i < w.length; i++) {
          var cur = grid[r0 + d[0] * i][c0 + d[1] * i];
          if (cur !== '' && cur !== w.charAt(i)) { fits = false; break; }
        }
        if (!fits) continue;
        var cells = [];
        for (var j = 0; j < w.length; j++) {
          grid[r0 + d[0] * j][c0 + d[1] * j] = w.charAt(j);
          cells.push([r0 + d[0] * j, c0 + d[1] * j]);
        }
        placed.push({ w: w, cells: cells });
        ok = true;
      }
      if (!ok) return null;
    }
    return { grid: grid, placed: placed };
  }

  // How many times a word can be read in the grid (any of the 8 directions)
  function occurrences(grid, size, w) {
    var n = 0;
    for (var r = 0; r < size; r++) for (var c = 0; c < size; c++) for (var di = 0; di < ALL8.length; di++) {
      var d = ALL8[di], hit = true;
      for (var i = 0; i < w.length && hit; i++) {
        var rr = r + d[0] * i, cc = c + d[1] * i;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size || grid[rr][cc] !== w.charAt(i)) hit = false;
      }
      if (hit) n++;
    }
    return n;
  }

  function makeSearch(words, mode) {
    var sw = searchWords(words, mode), dirs = mode === 'easy' ? DIRS_EASY : DIRS_NORMAL;
    if (!sw.items.length) return null;
    var letters = sw.items.map(function (x) { return x.w; }).join('');
    for (var attempt = 0; attempt < 160; attempt++) {
      var items = sw.items;
      var drop = Math.floor(attempt / 40);                                                   // a crowded grid: one word fewer every 40 tries
      if (drop > 0) items = items.slice(0, Math.max(3, items.length - drop));
      var pl = placeWords(items, sw.size, dirs);
      if (!pl) continue;
      for (var fillTry = 0; fillTry < 12; fillTry++) {
        var g = pl.grid.map(function (row) { return row.slice(); });
        for (var r = 0; r < sw.size; r++) for (var c = 0; c < sw.size; c++) {
          if (g[r][c] === '') {
            // half of the filler letters come from the words themselves so the grid is not obvious
            g[r][c] = Math.random() < 0.5 ? letters.charAt(Math.floor(Math.random() * letters.length)) : ALPHA.charAt(Math.floor(Math.random() * 26));
          }
        }
        // a word is found once (a palindrome like mom reads the same both ways, so it counts twice)
        var clean = items.every(function (x) { return occurrences(g, sw.size, x.w) === (x.w === x.w.split('').reverse().join('') ? 2 : 1); });
        if (clean) {
          var list = items.map(function (it, i) {
            var pw = pl.placed.filter(function (p) { return p.w === it.w; })[0];
            return { w: it.w, ja: it.ja || '', img: it.img || '', cells: pw.cells, found: -1 };
          });
          return { grid: g, size: sw.size, items: list, mode: mode };
        }
      }
    }
    return null;
  }

  function lineCells(r1, c1, r2, c2) {
    var dr = r2 - r1, dc = c2 - c1;
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
    var n = Math.max(Math.abs(dr), Math.abs(dc)) + 1, sr = dr === 0 ? 0 : (dr > 0 ? 1 : -1), sc = dc === 0 ? 0 : (dc > 0 ? 1 : -1);
    var out = [];
    for (var i = 0; i < n; i++) out.push([r1 + sr * i, c1 + sc * i]);
    return out;
  }
  function cellEl(r, c) { return document.getElementById('ws-' + r + '-' + c); }
  function mark(cells, cls, on) {
    cells.forEach(function (rc) { var e = cellEl(rc[0], rc[1]); if (e) e.classList[on ? 'add' : 'remove'](cls); });
  }

  function searchHtml() {
    var cfg = W.cfg, n = W.size;
    var h = H212UI.qTop({ onclose: cfg.back, label: T('wg.back'), index: foundCount() - 1, total: W.items.length, noScore: true })
      + '<div class="grp-spelling"><div class="q-label">' + esc(cfg.kicker) + ' · ' + esc(T('wg.game_search')) + '</div></div>'
      + '<div class="question-card grp-spelling">'
      + '<div class="wg-inst">' + esc(T(cfg.mode === 'easy' ? 'wg.inst_search_easy' : 'wg.inst_search_normal')) + '</div>'
      + '<div class="ws-wrap">'
      + '<div class="ws-board" id="ws-board" style="--n:' + n + '" onpointerdown="H212WordGames.pd(event)" onpointermove="H212WordGames.pm(event)" onpointerup="H212WordGames.pu(event)" onpointercancel="H212WordGames.pc(event)">';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      h += '<div class="ws-cell" id="ws-' + r + '-' + c + '" data-r="' + r + '" data-c="' + c + '">' + esc(W.grid[r][c].toUpperCase()) + '</div>';
    }
    h += '</div><div class="ws-side"><ul class="ws-list" id="ws-list">';
    W.items.forEach(function (it, i) {
      h += '<li class="ws-item" id="ws-i' + i + '">'
        + (it.img && cfg.imgUrl ? '<img class="ws-thumb" src="' + esc(cfg.imgUrl(it.img)) + '" alt="" onerror="this.parentNode.removeChild(this)">' : '')
        + '<span class="ws-dot" id="ws-d' + i + '"></span>'
        + '<span class="ws-word">' + esc(it.w) + (it.ja ? ' <small lang="ja">' + esc(it.ja) + '</small>' : '') + '</span>'
        + '<button type="button" class="ws-hear" onclick="H212WordGames.hearItem(' + i + ')" aria-label="' + esc(T('listen.button')) + '">🔊</button></li>';
    });
    h += '</ul><button type="button" class="ws-hint" onclick="H212WordGames.hint()">💡 ' + esc(T('wg.hint')) + '</button></div></div>'
      + '<div class="result-msg" id="ws-msg" role="status"></div></div>';
    return h;
  }

  function foundCount() { return W ? W.items.filter(function (x) { return x.found >= 0; }).length : 0; }

  function search(cfg) {
    cfg.mode = cfg.mode === 'normal' ? 'normal' : 'easy';
    var built = null;
    for (var tries = 0; tries < 6 && !built; tries++) built = makeSearch(cfg.words, cfg.mode);     // a very crowded grid is rare: just try again
    if (!built) return false;
    W = { cfg: cfg, grid: built.grid, size: built.size, items: built.items, anchor: null, down: null, moved: false, hintEl: null, over: false };
    pc().innerHTML = searchHtml();
    window.scrollTo(0, 0);
    return true;
  }

  // A line from (r1,c1) to (r2,c2) was chosen: is it one of the words?
  function trySelect(r1, c1, r2, c2) {
    var cells = lineCells(r1, c1, r2, c2);
    if (!cells || cells.length < 2) return false;
    var str = cells.map(function (rc) { return W.grid[rc[0]][rc[1]]; }).join(''), rev = str.split('').reverse().join('');
    for (var i = 0; i < W.items.length; i++) {
      if (W.items[i].found < 0 && (W.items[i].w === str || W.items[i].w === rev)) { found(i, cells); return true; }
    }
    mark(cells, 'ws-bad', true);                                  // not a word: red for a moment
    setTimeout(function () { mark(cells, 'ws-bad', false); }, 500);
    return false;
  }

  function found(i, cells) {
    var it = W.items[i];
    it.found = foundCount();
    var colour = COLOURS[i % COLOURS.length];
    cells.forEach(function (rc) { var e = cellEl(rc[0], rc[1]); if (e) { e.style.background = colour; e.classList.add('ws-found'); } });
    var li = document.getElementById('ws-i' + i), dot = document.getElementById('ws-d' + i);
    if (li) li.classList.add('ws-done');
    if (dot) { dot.style.background = colour; dot.textContent = '✓'; }
    clearHint();
    var cnt = document.querySelector('.q-count'), bar = document.querySelector('.q-bar-fill'), total = W.items.length;
    if (cnt) cnt.textContent = foundCount() + ' / ' + total;
    if (bar) bar.style.width = Math.round(foundCount() * 100 / total) + '%';
    if (W.cfg.hear) W.cfg.hear(it.w);
    var left = W.items.length - foundCount();
    var msg = document.getElementById('ws-msg');
    if (msg) { msg.textContent = left ? T('wg.found') + ' ' + it.w + ' · ' + fill(T('wg.left'), { n: left }) : T('wg.found') + ' ' + it.w; msg.className = 'result-msg correct'; msg.style.display = 'block'; }
    if (!left) { W.over = true; setTimeout(finishSearch, 1400); }
  }

  function clearHint() {
    if (W && W.hintEl) { W.hintEl.classList.remove('ws-hintcell'); W.hintEl = null; }
  }
  function hint() {
    if (!W || W.over) return;
    var left = W.items.filter(function (x) { return x.found < 0; });
    if (!left.length) return;
    clearHint();
    var it = left[Math.floor(Math.random() * left.length)], e = cellEl(it.cells[0][0], it.cells[0][1]);
    if (e) { e.classList.add('ws-hintcell'); W.hintEl = e; }
  }

  // Tapping: first letter, then last letter
  function tapCell(r, c) {
    if (!W || W.over) return;
    if (!W.anchor) { W.anchor = [r, c]; mark([[r, c]], 'ws-sel', true); return; }
    var a = W.anchor;
    mark([a], 'ws-sel', false);
    W.anchor = null;
    if (a[0] === r && a[1] === c) return;                       // tapped the same letter again: cancel
    if (!lineCells(a[0], a[1], r, c)) { W.anchor = [r, c]; mark([[r, c]], 'ws-sel', true); return; }   // not a straight line: start again here
    trySelect(a[0], a[1], r, c);
  }

  function cellAt(e) {
    var el = (typeof document.elementFromPoint === 'function' && e && e.clientX !== undefined) ? document.elementFromPoint(e.clientX, e.clientY) : (e && e.target);
    if (!el || !el.getAttribute || el.getAttribute('data-r') === null) return null;
    return [parseInt(el.getAttribute('data-r'), 10), parseInt(el.getAttribute('data-c'), 10)];
  }
  var preview = [];
  function clearPreview() { mark(preview, 'ws-sel', false); preview = []; }
  function pd(e) {
    if (!W || W.over) return;
    var rc = cellAt(e);
    if (!rc) return;
    if (e.preventDefault) e.preventDefault();
    W.down = rc; W.moved = false;
  }
  function pm(e) {
    if (!W || !W.down) return;
    var rc = cellAt(e);
    if (!rc || (rc[0] === W.down[0] && rc[1] === W.down[1] && !W.moved)) return;
    W.moved = true;
    clearPreview();
    if (W.anchor) { mark([W.anchor], 'ws-sel', false); W.anchor = null; }
    var cells = lineCells(W.down[0], W.down[1], rc[0], rc[1]);
    if (cells) { preview = cells; mark(cells, 'ws-sel', true); }
  }
  function pu(e) {
    if (!W || !W.down) return;
    var start = W.down, moved = W.moved, rc = cellAt(e) || start;
    W.down = null; W.moved = false;
    clearPreview();
    if (moved && (rc[0] !== start[0] || rc[1] !== start[1])) trySelect(start[0], start[1], rc[0], rc[1]);
    else tapCell(start[0], start[1]);
  }
  function pc2() { if (W) { W.down = null; W.moved = false; } clearPreview(); }

  function hearItem(i) { if (W && W.items[i] && W.cfg.hear) W.cfg.hear(W.items[i].w); }

  function finishSearch() {
    if (!W) return;
    var n = W.items.length;
    if (W.cfg.done) W.cfg.done(100, n, n);
    var h = '<div class="question-card grp-spelling" style="text-align:center">'
      + '<div class="wg-cheer" aria-hidden="true">🎉</div>'
      + '<div class="speak-finish-title">' + esc(T('wg.finish_title')) + '</div>'
      + '<div class="speak-finish-sub">' + esc(fill(T('wg.finish_search'), { n: n })) + '</div>'
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
      + '<button class="next-btn" style="display:inline-flex" onclick="' + W.cfg.again + '">' + esc(T('wg.again')) + '</button>'
      + '<button class="next-btn" style="display:inline-flex" onclick="' + W.cfg.back + '">' + esc(T('wg.back')) + '</button>'
      + '</div></div>';
    pc().innerHTML = h;
  }

  function noPic(img) {
    if (img && img.parentNode) img.parentNode.removeChild(img);
    var b = document.querySelector('.wg-hear');
    if (b) b.classList.remove('wg-hear-small');
  }

  if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('keydown', onKey);

  return {
    missing: missing, pick: pick, next: next, hear: hear, noPic: noPic, stop: function () { G = null; W = null; },
    search: search, pd: pd, pm: pm, pu: pu, pc: pc2, hint: hint, hearItem: hearItem, tapCell: tapCell, trySelect: trySelect,
    _makeSearch: makeSearch, _search: function () { return W; },
    _build: build, _pool: pool, _state: function () { return G; }
  };
})();
