// The course map in the browser: which levels and chapters exist, and the part groups.
// The real list comes from the content files, through PHP (inc/course.php sets
// window.H212_COURSE) - no page needs to hardcode "5 levels" or "17 chapters".
//
//   H212Course.levels()        -> [1, 2, ...]
//   H212Course.chapters(level) -> [1, 2, ...]
//   H212Course.next(l, c)      -> { level, chapter } of the chapter after this one, or null at the very end
//   H212Course.groups          -> { vocabulary: ['photo','vocabulary'], grammar: [...], listening: [...] }
var H212Course = (function () {
  var C = window.H212_COURSE || { levels: {}, groups: {} };

  function levels() {
    return Object.keys(C.levels).map(Number).sort(function (a, b) { return a - b; });
  }
  function chapters(level) {
    return (C.levels[level] || []).slice().sort(function (a, b) { return a - b; });
  }
  function next(level, chapter) {
    var chs = chapters(level);
    var at = chs.indexOf(chapter);
    if (at !== -1 && at + 1 < chs.length) return { level: level, chapter: chs[at + 1] };
    var ls = levels();
    var li = ls.indexOf(level);
    for (var i = li + 1; li !== -1 && i < ls.length; i++) {
      var first = chapters(ls[i])[0];
      if (first !== undefined) return { level: ls[i], chapter: first };
    }
    return null;
  }

  return { levels: levels, chapters: chapters, next: next, groups: C.groups || {} };
})();
