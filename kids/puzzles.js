/* 212 Kids - the word-puzzle makers, shared by the games (game.js) and the printable worksheets (print.js).
 * Words are plain lower-case strings. Every call makes a new random puzzle.
 *
 *   H212KidsPuzzles.search(['apple', 'banana', 'grapes'])
 *     Word Search (tiny): one word per row, left to right only, in a grid as wide as the longest word,
 *     with one spare row; the rest are random letters, and each word reads left to right exactly once.
 *     -> { grid: [[letters]], rows, cols, words: [ { text, row, start } ] }   (null if it can't)
 *
 *   H212KidsPuzzles.cross('orange', 'apple', blanksPer)
 *     Crossword (tiny): the first word across, the second down, crossing at a shared letter near the
 *     middle of both. blanksPer letters of each word are left empty, never the first letter or the crossing.
 *     -> { rows, cols, words: [ { text, cells: [[row, col]...], cross, blanks: [letter positions] } ] }
 *
 *   H212KidsPuzzles.missing('banana', step)
 *     Which letter to leave out: step 0 = the first letter, 1 = the last, 2 = one in the middle.
 */
(function () {
  'use strict';

  var FILL = 'abcdefghijklmnoprstuwy';

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function search(list) {
    var cols = Math.max.apply(null, list.map(function (w) { return w.length; }));
    var rows = list.length + 1;
    for (var attempt = 0; attempt < 200; attempt++) {
      var order = shuffle(Array.apply(null, Array(rows)).map(function (_, i) { return i; })).slice(0, list.length);
      var grid = [];
      for (var r = 0; r < rows; r++) {
        grid.push([]);
        for (var c = 0; c < cols; c++) grid[r].push(FILL.charAt(Math.floor(Math.random() * FILL.length)));
      }
      var placed = list.map(function (w, i) {
        var row = order[i];
        var start = Math.floor(Math.random() * (cols - w.length + 1));
        for (var j = 0; j < w.length; j++) grid[row][start + j] = w.charAt(j);
        return { text: w, row: row, start: start };
      });
      var lines = grid.map(function (row) { return row.join(''); });
      var once = list.every(function (w) {
        return lines.reduce(function (n, line) {
          for (var k = 0; k + w.length <= line.length; k++) if (line.substr(k, w.length) === w) n++;
          return n;
        }, 0) === 1;
      });
      if (once) return { grid: grid, rows: rows, cols: cols, words: placed };
    }
    return null;
  }

  function cross(A, D, blanksPer) {
    var pairs = [];
    for (var i = 0; i < A.length; i++) {
      for (var j = 0; j < D.length; j++) if (A.charAt(i) === D.charAt(j)) pairs.push([i, j]);
    }
    if (!pairs.length) return null;
    // A crossing near the middle of both words looks most like a crossword.
    function mid(p) {
      return Math.min(p[0], A.length - 1 - p[0]) + Math.min(p[1], D.length - 1 - p[1]);
    }
    var best = Math.max.apply(null, pairs.map(mid));
    var x = pick(pairs.filter(function (p) { return mid(p) === best; }));
    var list = [
      { text: A, cells: A.split('').map(function (_, k) { return [x[1], k]; }), cross: x[0] },
      { text: D, cells: D.split('').map(function (_, k) { return [k, x[0]]; }), cross: x[1] }
    ];
    list.forEach(function (w) {
      var can = [];
      for (var k = 1; k < w.text.length; k++) if (k !== w.cross) can.push(k);
      w.blanks = shuffle(can).slice(0, blanksPer).sort(function (a, b) { return a - b; });
    });
    return { rows: D.length, cols: A.length, words: list };
  }

  function missing(word, step) {
    if (step === 0) return 0;
    if (step === 1) return word.length - 1;
    return Math.floor(word.length / 2);
  }

  window.H212KidsPuzzles = { FILL: FILL, search: search, cross: cross, missing: missing, shuffle: shuffle };
})();
