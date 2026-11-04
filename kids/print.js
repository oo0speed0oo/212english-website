/* 212 Kids - printable worksheets (K4). Draws A4 pages from one worksheet set (print.php sends window.H212_KIDS_PRINT).
 *
 *   Missing Letters  each word: big picture, the word in 2 cm boxes with one empty, a light word to trace.
 *                    Easy: the first letter is missing. A bit harder: the last or a middle letter.
 *   Word Search      pictures of the words to find; the words read left to right, one per row.
 *                    Easy: 3 words. A bit harder: 4 words. (Every sheet uses at most 4 words, so it fits on A4.)
 *   Crossword        2 crossing words, picture clues (1 → across, 2 ↓ down).
 *                    Easy: 1 empty box per word. A bit harder: 2.
 * The answer pages (for the teacher) use the same puzzles, with the answers in red.
 * "New puzzle" makes new random puzzles. Pictures: pictures.js. Puzzles: puzzles.js (the same as the games).
 */
(function () {
  'use strict';

  var P = window.H212_KIDS_PRINT;
  var root = document.getElementById('kids-print');
  var PZ = window.H212KidsPuzzles;
  var PICTURES = window.H212_KIDS_PICTURES || {};
  if (!P || !root || !PZ) return;

  var KINDS = {
    missing: { english: 'Missing Letters', japanese: 'たりない もじ' },
    search: { english: 'Word Search', japanese: 'ことば さがし' },
    cross: { english: 'Crossword', japanese: 'クロスワード' }
  };
  var state = { kind: 'all', level: 'easy', answers: true };
  var made = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function text(key) {
    return ((P.words[key] && P.words[key].english) || key).toLowerCase();
  }
  function picture(key, cls) {
    var w = P.words[key] || {};
    if (w.image) return '<img class="' + cls + '" src="images/' + esc(w.image) + '" alt="' + esc(w.english || key) + '">';
    var p = PICTURES[w.picture] || PICTURES[key] || PICTURES.apple;
    return '<svg class="' + cls + '" viewBox="' + p[0] + '" role="img" aria-label="' + esc(w.english || key) + '">' + p[1] + '</svg>';
  }

  // ---------- making the puzzles (once; "New puzzle" makes them again) ----------

  function make() {
    var words = PZ.shuffle(P.set.words.filter(function (k) { return P.words[k]; }));
    var easy = state.level === 'easy';
    // At most 4 words on a sheet, so every page fits on A4 (a set with more words picks 4 at random).
    var missing = words.slice(0, 4).map(function (k, i) {
      var t = text(k);
      return { key: k, text: t, at: PZ.missing(t, easy ? 0 : (i % 2 ? 1 : 2)) };
    });
    var findKeys = words.slice(0, easy ? 3 : 4);
    var search = PZ.search(findKeys.map(text));
    if (search) search.words.forEach(function (w, i) { w.key = findKeys[i]; });
    var pair = (P.set.pairs && P.set.pairs.length) ? P.set.pairs[Math.floor(Math.random() * P.set.pairs.length)] : words.slice(0, 2);
    var cross = PZ.cross(text(pair[0]), text(pair[1]), easy ? 1 : 2);
    if (cross) cross.words.forEach(function (w, i) { w.key = pair[i]; });
    made = { missing: missing, search: search, cross: cross };
  }

  // ---------- one A4 page ----------

  function page(kind, answers, inner, howJa, howEn) {
    var k = KINDS[kind];
    return '<section class="p-page' + (answers ? ' p-answers' : '') + '">' +
      '<header class="p-head"><span class="p-logo"><b>212</b> Kids</span>' +
      '<h1>' + esc(k.english) + ' <small>' + esc(k.japanese) + '</small></h1>' +
      '<span class="p-set">' + esc(P.set.english) + ' ' + esc(P.set.japanese) + '</span></header>' +
      (answers
        ? '<p class="p-answer-note">こたえ Answers <small>（せんせい・おうちのかた用 for the teacher / grown-ups）</small></p>'
        : '<div class="p-name"><span>なまえ <small>Name</small></span><span class="p-line"></span><span>ひづけ <small>Date</small></span><span class="p-line p-line-short"></span></div>') +
      '<div class="p-how"><b>' + esc(howJa) + '</b><small>' + esc(howEn) + '</small></div>' +
      inner + '</section>';
  }

  function missingPage(answers) {
    var rows = made.missing.map(function (m) {
      var boxes = m.text.split('').map(function (ch, i) {
        var blank = i === m.at;
        return '<span class="p-box' + (blank ? ' p-blank' : '') + '">' + (blank ? (answers ? '<em>' + esc(ch) + '</em>' : '') : esc(ch)) + '</span>';
      }).join('');
      return '<div class="p-miss-row">' + picture(m.key, 'p-pic') +
        '<div class="p-miss-right"><div class="p-boxes">' + boxes + '</div>' +
        '<div class="p-trace" aria-hidden="true">' + esc(m.text) + '</div></div></div>';
    }).join('');
    return page('missing', answers, '<div class="p-miss">' + rows + '</div>',
      'えを みて、たりない もじを □に かきましょう。したの うすい ことばを なぞりましょう。',
      'Look at the picture. Write the missing letter. Then trace the word.');
  }

  function searchPage(answers) {
    var s = made.search;
    if (!s) return '';
    var find = s.words.map(function (w) {
      return '<span class="p-find">' + picture(w.key, 'p-pic-small') + '<span class="p-check"></span></span>';
    }).join('');
    var cells = '';
    for (var r = 0; r < s.rows; r++) {
      for (var c = 0; c < s.cols; c++) {
        var hit = answers && s.words.some(function (w) { return w.row === r && c >= w.start && c < w.start + w.text.length; });
        cells += '<span class="p-cell' + (hit ? ' p-hit' : '') + '">' + esc(s.grid[r][c]) + '</span>';
      }
    }
    return page('search', answers,
      '<div class="p-finds">' + find + '</div><div class="p-grid" style="--cols:' + s.cols + '">' + cells + '</div>',
      'えの ことばを さがして ○で かこみましょう。ことばは ひだりから みぎへ ならんでいます。みつけたら □に ✓ を かきましょう。',
      'Find the words of the pictures and circle them. They go from left to right. Tick the box when you find one.');
  }

  function crossPage(answers) {
    var x = made.cross;
    if (!x) return '';
    var at = {};
    x.words.forEach(function (w, wi) {
      w.cells.forEach(function (rc, k) {
        var key = rc[0] + ',' + rc[1];
        var blank = w.blanks.indexOf(k) !== -1;
        if (!at[key]) at[key] = { ch: w.text.charAt(k), blank: false, num: '' };
        if (blank) at[key].blank = true;
        if (k === 0) at[key].num += (at[key].num ? ' ' : '') + (wi + 1);
      });
    });
    var cells = '';
    for (var r = 0; r < x.rows; r++) {
      for (var c = 0; c < x.cols; c++) {
        var a = at[r + ',' + c];
        if (!a) {
          cells += '<span class="p-cw-none"></span>';
          continue;
        }
        cells += '<span class="p-box' + (a.blank ? ' p-blank' : '') + '">' + (a.num ? '<i>' + a.num + '</i>' : '') +
          (a.blank ? (answers ? '<em>' + esc(a.ch) + '</em>' : '') : esc(a.ch)) + '</span>';
      }
    }
    var clues = x.words.map(function (w, i) {
      return '<span class="p-clue"><b>' + (i + 1) + (i === 0 ? ' →' : ' ↓') + '</b>' + picture(w.key, 'p-pic-small') + '</span>';
    }).join('');
    return page('cross', answers,
      '<div class="p-cw"><div class="p-clues">' + clues + '</div><div class="p-cw-grid" style="--cols:' + x.cols + '">' + cells + '</div></div>',
      'えを みて、□に たりない もじを かきましょう。1 は よこ（→）、2 は たて（↓）です。',
      'Look at the pictures and write the missing letters. 1 goes across (→), 2 goes down (↓).');
  }

  var PAGES = { missing: missingPage, search: searchPage, cross: crossPage };

  // ---------- the screen: choices (not printed) + the pages ----------

  function btn(group, value, en, ja) {
    var on = state[group] === value;
    return '<button type="button" class="p-btn' + (on ? ' p-on' : '') + '" data-' + group + '="' + value + '" aria-pressed="' + on + '">' +
      esc(en) + '<small>' + esc(ja) + '</small></button>';
  }

  function render() {
    var kinds = state.kind === 'all' ? ['missing', 'search', 'cross'] : [state.kind];
    var pages = kinds.map(function (k) { return PAGES[k](false); }).join('');
    if (state.answers) pages += kinds.map(function (k) { return PAGES[k](true); }).join('');
    var sets = P.sets.length > 1 ? '<div class="p-row">' + P.sets.map(function (s) {
      return '<a class="p-btn' + (s.id === P.set.id ? ' p-on' : '') + '" href="print.php?set=' + encodeURIComponent(s.id) + '">' + esc(s.english) + '<small>' + esc(s.japanese) + '</small></a>';
    }).join('') + '</div>' : '';
    root.innerHTML =
      '<div class="p-tools">' +
      '<div class="p-tools-top"><a class="p-back" href="' + esc(P.back) + '">← 212 Kids</a>' +
      '<h2>Print worksheets <small>プリント（' + esc(P.set.japanese) + '）</small></h2></div>' + sets +
      '<div class="p-row">' + btn('kind', 'all', 'All 3', '3まい ぜんぶ') + btn('kind', 'missing', KINDS.missing.english, KINDS.missing.japanese) +
      btn('kind', 'search', KINDS.search.english, KINDS.search.japanese) + btn('kind', 'cross', KINDS.cross.english, KINDS.cross.japanese) + '</div>' +
      '<div class="p-row">' + btn('level', 'easy', 'Easy', 'かんたん（Pre-K・K）') + btn('level', 'harder', 'A bit harder', 'すこし むずかしい（小学生）') +
      '<label class="p-check-label"><input type="checkbox" data-answers' + (state.answers ? ' checked' : '') + '> Answer pages <small>こたえの ページも</small></label></div>' +
      '<div class="p-row"><button type="button" class="p-btn p-new" data-new>↻ New puzzle<small>あたらしい もんだい</small></button>' +
      '<button type="button" class="p-btn p-print" data-print>🖨 Print<small>いんさつ</small></button></div>' +
      '<p class="p-tip">A4・たて。いんさつ の せってい で「ヘッダーとフッター」を オフに すると きれいです。</p>' +
      '</div><div class="p-pages">' + pages + '</div>';
    fit();
  }

  // On a small screen the A4 pages are shown smaller (printing is always full size).
  function fit() {
    var pages = root.querySelector('.p-pages');
    if (!pages) return;
    var mm = 96 / 25.4;
    var scale = Math.min(1, (document.documentElement.clientWidth - 24) / (210 * mm));
    pages.style.zoom = scale < 1 ? String(Math.round(scale * 100) / 100) : '';
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-kind')) state.kind = b.getAttribute('data-kind');
    else if (b.hasAttribute('data-level')) {
      state.level = b.getAttribute('data-level');
      make();
    } else if (b.hasAttribute('data-new')) make();
    else if (b.hasAttribute('data-print')) return window.print();
    else return;
    render();
  });
  root.addEventListener('change', function (e) {
    if (e.target.hasAttribute('data-answers')) {
      state.answers = e.target.checked;
      render();
    }
  });
  window.addEventListener('resize', fit);

  make();
  render();
})();
