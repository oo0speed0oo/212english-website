// Teacher Mike on the quiz screens: a small Mike with a speech bubble that
// gives a hint when a question appears and reacts when the student answers
// (correct / wrong / quiz finished). Text is in the page language with the
// other language underneath. His mouth moves for about 3 seconds while a new
// bubble appears (see .mike.talking in base.css); with "reduce motion" on,
// nothing animates.
//
// Needs window.H212_MIKE from inc/mike.php (h212_mike_for_js()).
var H212Mike = (function () {
  var timer = null;
  var lastPick = {};

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // HTML for Mike + his bubble (put it where the screen needs him)
  function row() {
    var svg = (window.H212_MIKE && window.H212_MIKE.svg) || '';
    return '<div class="mike-row">'
      + '<div class="mike-small">' + svg + '</div>'
      + '<div class="mike-bubble" aria-live="polite"><div class="mb-main"></div><div class="mb-sub"></div></div>'
      + '</div>';
  }

  // Open and close his mouth for ~3 seconds, then smile
  function talk() {
    var m = document.querySelector('.mike-row .mike');
    if (!m) return;
    m.classList.remove('talking');
    void m.getBoundingClientRect();        // restart the animation
    m.classList.add('talking');
    clearTimeout(timer);
    timer = setTimeout(function () { m.classList.remove('talking'); }, 3200);
  }

  // Pick one line for a kind of reaction, not the same one twice in a row
  function pick(kind) {
    var list = (window.H212_MIKE && window.H212_MIKE[kind]) || [];
    if (!list.length) return null;
    var i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === lastPick[kind]) i = (i + 1) % list.length;
    lastPick[kind] = i;
    return list[i];
  }

  // kind: 'correct' | 'wrong' | 'hint_<part>' | 'hint_test' | 'finish_perfect' | 'finish_good' | 'finish_try'
  // animate: false = just show the text, no mouth movement
  function say(kind, animate) {
    var line = pick(kind);
    var b = document.querySelector('.mike-row .mike-bubble');
    if (!line || !b) return;
    b.querySelector('.mb-main').innerHTML = esc(line[0]);
    b.querySelector('.mb-sub').innerHTML = esc(line[1]);
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
    if (animate !== false) talk();
  }

  return { row: row, say: say };
})();
