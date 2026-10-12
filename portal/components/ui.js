// Small shared pieces of the portal look, used by homework.php and tests.php:
// line icons for the six practice parts, and the question-screen top bar.
var H212UI = (function () {
  function svg(inner) {
    return '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  var icons = {
    photo:        svg('<rect x="3" y="5" width="18" height="14" rx="3"></rect><circle cx="9" cy="10" r="2"></circle><path d="M21 16l-5-5-8 8"></path>'),
    vocabulary:   svg('<path d="M4 5h11a3 3 0 013 3v11H7a3 3 0 01-3-3z"></path><path d="M8 9h6M8 13h4"></path>'),
    grammar:      svg('<path d="M4 17h16"></path><path d="M8 12h8" stroke-dasharray="2 2"></path><path d="M4 7h10"></path>'),
    builder:      svg('<rect x="3" y="8" width="5" height="8" rx="1.5"></rect><rect x="10" y="8" width="5" height="8" rx="1.5"></rect><rect x="17" y="8" width="4" height="8" rx="1.5"></rect>'),
    listening:    svg('<path d="M4 10v4h4l5 4V6L8 10z"></path><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"></path>'),
    conversation: svg('<path d="M4 5h10v7H8l-4 3z"></path><path d="M14 9h6v7l-3-2h-5v-2"></path>'),
    close:        '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
    back:         '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"></path></svg>'
  };
  var GROUP_OF = { photo: 'vocabulary', vocabulary: 'vocabulary', grammar: 'grammar', builder: 'grammar', listening: 'listening', conversation: 'listening' };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // Top of a question screen: close button, progress bar, "3 / 13 · score"
  // o = { onclose: 'js to run', label: 'Back', index: 2, total: 13, score: 1, scoreWord: 'Score' }
  function qTop(o) {
    var pct = o.total ? Math.round(((o.index + 1) / o.total) * 100) : 0;
    return '<div class="q-top">'
      + '<button type="button" class="q-close" onclick="' + o.onclose + '" aria-label="' + esc(o.label) + '">' + icons.close + '</button>'
      + '<div class="q-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + o.total + '" aria-valuenow="' + (o.index + 1) + '"><div class="q-bar-fill" style="width:' + pct + '%"></div></div>'
      + '<div class="q-count">' + (o.index + 1) + ' / ' + o.total + ' <span class="q-score">· ' + esc(o.scoreWord) + ' ' + o.score + '</span></div>'
      + '</div>';
  }

  return { icons: icons, groupOf: function (part) { return GROUP_OF[part] || 'vocabulary'; }, qTop: qTop, esc: esc };
})();
