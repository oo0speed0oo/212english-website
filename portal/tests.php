<?php require __DIR__ . '/inc/auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>212 English – Tests</title>
<link rel="stylesheet" href="components/base.css">
</head>
<body>
<?php
require __DIR__ . '/inc/nav.php';
h212_render_nav( 'tests' );
h212_js_strings( array(
	'nav.tests', 'tests.choose_level_chapter', 'hw.back_levels', 'hw.back_chapters',
	'hw.level', 'hw.chapter', 'tests.preparing', 'tests.test_label',
) );
?>
<script>
var level = null, chapter = null;

window.addEventListener('DOMContentLoaded', function() {
  renderLevels();
});

function getPC() { return document.getElementById('page-content'); }

function renderLevels() {
  level = null; chapter = null;
  var html = '<div class="section-header"><h2>' + H212_T['nav.tests'] + '</h2><p>' + H212_T['tests.choose_level_chapter'] + '</p></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.tests'] + '</span></div>'
    + '<div class="level-grid">';
  for (var i = 1; i <= 5; i++) {
    html += '<div class="level-btn" onclick="renderChapters(' + i + ')">'
      + '<span class="num">' + i + '</span><span class="lbl">' + H212_T['hw.level'] + ' ' + i + '</span></div>';
  }
  html += '</div>';
  getPC().innerHTML = html;
}

function renderChapters(lvl) {
  level = lvl;
  var html = '<div class="section-header"><h2>' + H212_T['nav.tests'] + '</h2></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.tests'] + '</span><span class="sep">›</span><span>' + H212_T['hw.level'] + ' ' + lvl + '</span></div>'
    + '<button class="back-btn" onclick="renderLevels()">' + H212_T['hw.back_levels'] + '</button>'
    + '<div class="chapter-grid">';
  for (var c = 1; c <= 16; c++) {
    html += '<div class="chapter-btn" onclick="renderTest(' + c + ')">'
      + '<span class="num">' + c + '</span><span class="lbl">' + H212_T['hw.chapter'] + ' ' + c + '</span></div>';
  }
  html += '</div>';
  getPC().innerHTML = html;
}

function renderTest(ch) {
  chapter = ch;
  var html = '<div class="section-header"><h2>' + H212_T['nav.tests'] + '</h2></div>'
    + '<div class="breadcrumb"><span>' + H212_T['nav.tests'] + '</span><span class="sep">›</span><span>' + H212_T['hw.level'] + ' ' + level + '</span><span class="sep">›</span><span>' + H212_T['hw.chapter'] + ' ' + chapter + '</span></div>'
    + '<button class="back-btn" onclick="renderChapters(' + level + ')">' + H212_T['hw.back_chapters'] + '</button>'
    + '<div class="coming-soon"><div class="cs-icon">📝</div>'
    + '<h3>' + H212_T['tests.test_label'] + ' — ' + H212_T['hw.level'] + ' ' + level + ' · ' + H212_T['hw.chapter'] + ' ' + chapter + '</h3>'
    + '<p>' + H212_T['tests.preparing'] + '</p></div>';
  getPC().innerHTML = html;
}
</script>
</main>
</div>
</body>
</html>
