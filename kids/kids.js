/* 212 Kids - draws every kids screen from kids-menu.json and the children saved on the account.
 *
 * Screens (the part of the address after #):
 *   #/                    Who is playing?
 *   #/c/CHILD             menu, Class, first month
 *   #/c/CHILD/class/MONTH menu, Class, that month
 *   #/c/CHILD/t/THEME     menu, a theme (Food, Feelings ...)
 */
(function () {
  'use strict';

  var BOOT = window.H212_KIDS || {};
  var app = document.getElementById('kids-app');
  var menu = null;
  var children = BOOT.children || [];
  var progress = BOOT.progress || {};
  var currentChild = null;

  // TEMPORARY: every tile opens this test page until its real game exists (see play.php).
  var TEMP_PLAY_PAGE = 'play.php';

  var INK = '#2B2350';
  var AVATAR = { pink: '#FF7DA8', blue: '#4DA3FF', green: '#5CC98B', yellow: '#FFD24D', orange: '#FFB46B', purple: '#C9B8FF' };
  var AVATAR_ORDER = ['pink', 'blue', 'green', 'yellow', 'orange', 'purple'];

  // ---------- small helpers ----------

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function color(c, fallback) {
    return /^#[0-9a-fA-F]{6}$/.test(c || '') ? c : fallback;
  }
  function two(en, jp) {
    return '<span class="k-two"><b>' + esc(en) + '</b><small>' + esc(jp) + '</small></span>';
  }
  function svg(w, h, box, body, label) {
    return '<svg width="' + w + '" height="' + h + '" viewBox="' + box + '" ' +
      (label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true"') + '>' + body + '</svg>';
  }
  function go(route) {
    location.hash = route;
  }

  // ---------- pictures (simple shapes, same look as the design) ----------

  var STAR = '<polygon points="12,2 15,9 22.5,9.5 16.8,14.4 18.7,22 12,17.8 5.3,22 7.2,14.4 1.5,9.5 9,9" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round" fill="';
  function star(size, on) {
    return svg(size, size, '0 0 24 24', STAR + (on ? '#FFC933' : '#FFFFFF') + '"/>');
  }

  // Each icon: [viewBox, drawing]. Drawn at any size.
  var ICONS = {
    class: ['0 0 48 48', '<rect x="5" y="7" width="38" height="35" rx="7" fill="#FFFFFF" stroke="' + INK + '" stroke-width="3.5"/><path d="M5 20 V14 a7 7 0 0 1 7 -7 H36 a7 7 0 0 1 7 7 V20Z" fill="#FF5A4F" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/><polygon points="24,24 27,31 34,31.5 28.6,36 30.4,43 24,39 17.6,43 19.4,36 14,31.5 21,31" fill="#FFC933" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>'],
    apple: ['0 0 100 100', '<path d="M50 26 C30 10 4 26 10 54 C15 80 34 94 50 86 C66 94 85 80 90 54 C96 26 70 10 50 26Z" fill="#FF5A4F" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M56 16 C66 6 80 8 82 14 C74 22 62 22 56 16Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>'],
    banana: ['0 0 130 90', '<path d="M8 20 C20 62 62 80 112 44 C118 40 114 32 106 36 C64 58 34 44 22 12 C18 4 6 10 8 20Z" fill="#FFD84D" stroke="' + INK + '" stroke-width="7" stroke-linejoin="round"/>'],
    pizza: ['0 0 72 72', '<circle cx="36" cy="36" r="30" fill="#FFD27A" stroke="' + INK + '" stroke-width="5"/><circle cx="26" cy="26" r="7" fill="#E8453C" stroke="' + INK + '" stroke-width="3"/><circle cx="48" cy="30" r="7" fill="#E8453C" stroke="' + INK + '" stroke-width="3"/><circle cx="34" cy="48" r="7" fill="#E8453C" stroke="' + INK + '" stroke-width="3"/>'],
    music: ['0 0 70 70', '<path d="M28 50 V14 L56 8 V42" stroke="' + INK + '" stroke-width="6" fill="none" stroke-linejoin="round"/><path d="M28 24 L56 18" stroke="' + INK + '" stroke-width="6"/><ellipse cx="21" cy="50" rx="10" ry="8" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/><ellipse cx="49" cy="43" rx="10" ry="8" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/>'],
    speaker: ['0 0 36 36', '<path d="M5 14 H12 L21 6 V30 L12 22 H5Z" fill="' + INK + '"/><path d="M26 12 Q31 18 26 24 M29 8 Q37 18 29 28" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>'],
    cards: ['0 0 84 78', '<rect x="8" y="14" width="30" height="42" rx="7" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"/><rect x="44" y="20" width="30" height="42" rx="7" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/><circle cx="23" cy="35" r="7" fill="#FF5A4F" stroke="' + INK + '" stroke-width="3"/>'],
    bubbles: ['0 0 58 58', '<circle cx="22" cy="36" r="16" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"/><circle cx="40" cy="22" r="11" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"/><circle cx="42" cy="44" r="8" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"/>'],
    yesno: ['0 0 56 56', '<path d="M8 10 H48 a4 4 0 0 1 4 4 V34 a4 4 0 0 1 -4 4 H26 L14 50 V38 H8 a4 4 0 0 1 -4 -4 V14 a4 4 0 0 1 4 -4Z" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><path d="M18 22 L24 29 L38 16" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'],
    smile: ['0 0 48 48', '<circle cx="24" cy="24" r="19" fill="#FFD24D" stroke="' + INK + '" stroke-width="3.5"/><circle cx="17" cy="21" r="3" fill="' + INK + '"/><circle cx="31" cy="21" r="3" fill="' + INK + '"/><path d="M15 29 Q24 38 33 29" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>'],
    sad: ['0 0 48 48', '<circle cx="24" cy="24" r="19" fill="#9FD3FF" stroke="' + INK + '" stroke-width="3.5"/><circle cx="17" cy="21" r="3" fill="' + INK + '"/><circle cx="31" cy="21" r="3" fill="' + INK + '"/><path d="M15 35 Q24 27 33 35" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>'],
    shapes: ['0 0 48 48', '<polygon points="24,5 37,25 11,25" fill="#FFD24D" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/><circle cx="14" cy="35" r="9" fill="#4DA3FF" stroke="' + INK + '" stroke-width="3"/><rect x="26" y="27" width="16" height="16" rx="2" fill="#FF7DA8" stroke="' + INK + '" stroke-width="3"/>'],
    circle: ['0 0 48 48', '<circle cx="16" cy="24" r="11" fill="#FFFFFF" stroke="' + INK + '" stroke-width="3.5"/><circle cx="34" cy="24" r="11" fill="#4DA3FF" stroke="' + INK + '" stroke-width="3.5"/>'],
    colors: ['0 0 48 48', '<circle cx="17" cy="18" r="11" fill="#FF5A4F" stroke="' + INK + '" stroke-width="3"/><circle cx="31" cy="18" r="11" fill="#FFD24D" stroke="' + INK + '" stroke-width="3"/><circle cx="24" cy="31" r="11" fill="#4DA3FF" stroke="' + INK + '" stroke-width="3"/>'],
    backpack: ['0 0 52 56', '<path d="M16 14 a10 10 0 0 1 20 0" stroke="' + INK + '" stroke-width="4" fill="none"/><rect x="6" y="14" width="40" height="38" rx="12" fill="#4DA3FF" stroke="' + INK + '" stroke-width="4"/><rect x="14" y="32" width="24" height="14" rx="5" fill="#FFD24D" stroke="' + INK + '" stroke-width="3.5"/>'],
    cross: ['0 0 56 56', '<g stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"><rect x="4" y="20" width="16" height="16" rx="3" fill="#FFFFFF"/><rect x="20" y="20" width="16" height="16" rx="3" fill="#FFD24D"/><rect x="36" y="20" width="16" height="16" rx="3" fill="#FFFFFF"/><rect x="20" y="4" width="16" height="16" rx="3" fill="#FFFFFF"/><rect x="20" y="36" width="16" height="16" rx="3" fill="#FFFFFF"/></g>'],
    search: ['0 0 56 56', '<circle cx="23" cy="23" r="16" fill="#CFEAFF" stroke="' + INK + '" stroke-width="5"/><path d="M35 35 L50 50" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/><path d="M15 20 Q18 14 24 13" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round"/>'],
    oddout: ['0 0 56 56', '<g stroke="' + INK + '" stroke-width="3.5"><circle cx="15" cy="15" r="10" fill="#FF5A4F"/><circle cx="41" cy="15" r="10" fill="#FF5A4F"/><circle cx="15" cy="41" r="10" fill="#FF5A4F"/><rect x="31" y="31" width="20" height="20" rx="4" fill="#4DA3FF"/></g>'],
    match: ['0 0 60 56', '<rect x="4" y="12" width="22" height="30" rx="6" fill="#FFFFFF" stroke="' + INK + '" stroke-width="3.5"/><rect x="34" y="12" width="22" height="30" rx="6" fill="#FFFFFF" stroke="' + INK + '" stroke-width="3.5" stroke-dasharray="6 4"/><circle cx="15" cy="27" r="6" fill="#FF5A4F" stroke="' + INK + '" stroke-width="2.5"/><circle cx="45" cy="27" r="6" fill="#B9B4CC"/><path d="M20 50 Q30 56 40 50" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M36 46 L41 50 L36 54" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'],
    sort: ['0 0 64 52', '<circle cx="18" cy="9" r="7" fill="#FF5A4F" stroke="' + INK + '" stroke-width="3"/><circle cx="46" cy="9" r="7" fill="#5CC98B" stroke="' + INK + '" stroke-width="3"/><path d="M3 22 H29 L25 48 H7Z" fill="#FF9E94" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/><path d="M35 22 H61 L57 48 H39Z" fill="#8ED6A0" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>'],
    hidden: ['0 0 60 52', '<path d="M4 46 C4 20 22 8 30 20 C38 8 56 20 56 46Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><circle cx="22" cy="34" r="8" fill="#FFFFFF" stroke="' + INK + '" stroke-width="3"/><circle cx="38" cy="34" r="8" fill="#FFFFFF" stroke="' + INK + '" stroke-width="3"/><circle cx="23" cy="35" r="3.5" fill="' + INK + '"/><circle cx="39" cy="35" r="3.5" fill="' + INK + '"/>'],
    star: ['0 0 24 24', STAR + '#FFC933"/>'],
    sack: ['0 0 60 60', '<path d="M22 14 C14 22 6 32 8 44 C10 54 50 54 52 44 C54 32 46 22 38 14Z" fill="#E8453C" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><path d="M20 8 L40 8 L36 15 L24 15Z" fill="#E8453C" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><path d="M21 16 H39" stroke="#FFD24D" stroke-width="5" stroke-linecap="round"/>'],
    gift: ['0 0 60 60', '<rect x="8" y="24" width="44" height="30" rx="5" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/><rect x="5" y="16" width="50" height="11" rx="4" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/><path d="M30 16 V54" stroke="' + INK + '" stroke-width="4"/><path d="M30 16 C22 4 12 10 18 16 M30 16 C38 4 48 10 42 16" stroke="' + INK + '" stroke-width="4" fill="#FFD24D" stroke-linejoin="round"/>'],
    letter: ['0 0 60 60', '<rect x="6" y="14" width="48" height="34" rx="5" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"/><path d="M8 17 L30 34 L52 17" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linejoin="round"/><circle cx="44" cy="40" r="5" fill="#E8453C" stroke="' + INK + '" stroke-width="2.5"/>'],
    bell: ['0 0 60 60', '<path d="M30 8 C18 8 14 20 14 30 C14 38 10 42 8 46 H52 C50 42 46 38 46 30 C46 20 42 8 30 8Z" fill="#FFD24D" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><circle cx="30" cy="50" r="5" fill="#FFB46B" stroke="' + INK + '" stroke-width="3.5"/>'],
    tree: ['0 0 60 60', '<polygon points="30,4 46,26 38,26 52,44 8,44 22,26 14,26" fill="#5CC98B" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><rect x="25" y="44" width="10" height="10" fill="#B4703A" stroke="' + INK + '" stroke-width="3.5"/><circle cx="24" cy="34" r="3" fill="#E8453C"/><circle cx="36" cy="22" r="3" fill="#FFD24D"/><circle cx="38" cy="38" r="3" fill="#4DA3FF"/>']
  };
  var TEXT_ICONS = { numbers: ['123', '#5CC98B', 20], abc: ['ABC', '#FF7DA8', 19], missing: ['a_c', '#FFB46B', 19] };

  function icon(name, size) {
    if (TEXT_ICONS[name]) {
      var t = TEXT_ICONS[name];
      return '<span class="k-text-icon" style="background:' + t[1] + ';font-size:' + Math.round(t[2] * size / 48) + 'px;width:' + size + 'px;height:' + size + 'px" aria-hidden="true">' + t[0] + '</span>';
    }
    var i = ICONS[name] || ICONS.star;
    var box = i[0].split(' ');
    var ratio = box[3] / box[2];
    var w = ratio > 1 ? Math.round(size / ratio) : size;
    var h = ratio > 1 ? size : Math.round(size * ratio);
    return '<span class="k-icon">' + svg(w, h, i[0], i[1]) + '</span>';
  }

  function avatar(colorName, size) {
    var c = AVATAR[colorName] || AVATAR.blue;
    return svg(size, size, '0 0 120 120',
      '<circle cx="60" cy="60" r="54" fill="' + c + '" stroke="' + INK + '" stroke-width="5"/>' +
      '<circle cx="42" cy="52" r="7" fill="' + INK + '"/><circle cx="78" cy="52" r="7" fill="' + INK + '"/>' +
      '<path d="M38 74 Q60 96 82 74" stroke="' + INK + '" stroke-width="6" fill="none" stroke-linecap="round"/>');
  }

  var SCENERY = '<div class="k-scenery" aria-hidden="true">' +
    '<div class="k-sun"></div>' +
    '<svg class="k-cloud" style="left:11%;top:110px" width="130" height="80" viewBox="100 100 130 90"><g fill="#FFFFFF"><circle cx="130" cy="150" r="30"/><circle cx="170" cy="138" r="40"/><circle cx="215" cy="152" r="28"/><rect x="130" y="150" width="85" height="30" rx="15"/></g></svg>' +
    '<svg class="k-cloud" style="right:18%;top:210px" width="90" height="50" viewBox="756 196 112 60"><g fill="#FFFFFF"><circle cx="780" cy="230" r="22"/><circle cx="812" cy="220" r="30"/><circle cx="845" cy="232" r="20"/><rect x="780" y="232" width="65" height="20" rx="10"/></g></svg>' +
    '<svg class="k-hills" viewBox="0 560 1024 208" preserveAspectRatio="none"><path d="M0 640 C200 570 380 600 560 650 S900 600 1024 630 V768 H0Z" fill="#8ED6A0"/><path d="M0 705 C250 655 500 725 760 695 S950 685 1024 705 V768 H0Z" fill="#6CC48A"/></svg>' +
    '</div>';

  // ---------- menu data ----------

  function findById(list, id) {
    for (var i = 0; i < (list || []).length; i++) {
      if (String(list[i].id) === String(id)) return list[i];
    }
    return null;
  }
  function levelInfo(id) {
    var lv = findById(menu.levels, id) || menu.levels[0];
    var src = lv;
    var hops = 0;
    while (src && src.same_as && hops++ < 5) src = findById(menu.levels, src.same_as);
    return { level: lv, months: (src && src.months) || [] };
  }
  function monthLabel(id) {
    var lv = menu.levels || [];
    for (var i = 0; i < lv.length; i++) {
      var m = findById(lv[i].months, id);
      if (m) return m.english;
    }
    return id;
  }

  // The music on/off button (music.js). Empty if this browser can't play music.
  function musicBtn() {
    return window.H212Music && window.H212Music.bg ? window.H212Music.bg.button() : '';
  }

  // ---------- Screen 1: Who is playing? ----------

  function renderHome() {
    document.body.style.setProperty('--page', '#CDEBFF');
    document.title = '212 Kids';
    var cards = children.map(function (c) {
      return '<button class="k-kid k-press" data-kid="' + esc(c.id) + '">' + avatar(c.color, 120) +
        '<span class="k-kid-name">' + esc(c.name) + '</span></button>';
    }).join('');
    app.innerHTML = SCENERY +
      '<div class="k-home">' +
      '<div class="k-logo"><span>212</span><span class="k-logo-pill">Kids</span></div>' +
      '<h1>Who is playing?</h1><p class="k-sub">だれがあそぶ？</p>' +
      '<div class="k-kids">' + cards +
      '<button class="k-kid k-kid-add k-press" data-act="add">' +
      svg(96, 96, '0 0 96 96', '<circle cx="48" cy="48" r="42" fill="#FFD24D" stroke="' + INK + '" stroke-width="5"/><path d="M48 28 V68 M28 48 H68" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/>') +
      two('Add', 'ついか') + '</button></div>' +
      '<div class="k-home-foot">' +
      '<div class="k-mike"><img src="lion.svg" alt="Teacher Mike the lion">' +
      '<div class="k-bubble"><b>Hello! Let\'s play!</b><small>こんにちは！あそぼう！</small></div></div>' +
      musicBtn() +
      '<button class="k-pill-btn k-press" data-act="grownups">' +
      svg(26, 26, '0 0 26 26', '<rect x="4" y="11" width="18" height="12" rx="3" fill="' + INK + '"/><path d="M8 11 V8 a5 5 0 0 1 10 0 V11" stroke="' + INK + '" stroke-width="3" fill="none"/>') +
      two('Grown-ups', 'おとなのかた') + '</button>' +
      '</div></div>';
  }

  // ---------- Screen 2: the menu ----------

  function renderMenu(child, section, sub) {
    var info = levelInfo(child.level);
    var level = info.level;
    var theme = section === 't' ? findById(menu.themes, sub) : null;
    if (section === 't' && !theme) return go('/c/' + child.id);
    var month = null;
    if (!theme) month = findById(info.months, sub) || info.months[0] || null;

    var page = theme ? color(theme.background, '#FFE6B3') : color(menu['class'].background, '#FFE6B3');
    document.body.style.setProperty('--page', page);
    document.title = (theme ? theme.english : menu['class'].english) + ' – 212 Kids';

    var base = '/c/' + child.id;
    var here = theme ? base + '/t/' + theme.id : base + '/class/' + (month ? month.id : '');

    // Left rail: lion, child + level, Class, then each theme.
    var rail = '<nav class="k-rail" aria-label="Menu">' +
      '<div class="k-rail-top"><img class="k-lion-small" src="lion.svg" alt="Teacher Mike the lion">' +
      '<span class="k-level" style="background:' + color(level.color, '#4DA3FF') + '">' + esc(level.english) + '</span></div>' +
      '<button class="k-switch k-press" data-go="/" aria-label="Change player: ' + esc(child.name) + '">' + avatar(child.color, 40) +
      '<span>' + esc(child.name) + '</span></button>' +
      railBtn(menu['class'], base, !theme);
    (menu.themes || []).forEach(function (t) {
      rail += railBtn(t, base + '/t/' + t.id, theme && theme.id === t.id);
    });
    rail += '</nav>';

    // Top bar: month tabs (Class) or the theme name, then the star counter (0 until stars are saved).
    var top = '<div class="k-top">';
    if (theme) {
      top += icon(theme.icon, 50) + '<h1>' + esc(theme.english) + '</h1><span class="jp">' + esc(theme.japanese) + '</span>';
    } else {
      top += '<div role="tablist" aria-label="Month" style="display:flex;gap:14px;flex:1 1 auto;max-width:420px">';
      info.months.forEach(function (m) {
        top += '<button class="k-tab k-press" role="tab" aria-selected="' + (month && m.id === month.id) + '" data-go="' + esc(base + '/class/' + m.id) + '">' +
          esc(m.english) + ' <small>' + esc(m.japanese) + '</small></button>';
      });
      top += '</div>';
    }
    var p = progress[child.id] || {};
    var stars = p.stars || 0;
    top += '<div class="k-stars" aria-label="Stars: ' + stars + '">' + star(34, true) + '<span>' + stars + '</span></div>' + musicBtn() + '</div>';

    // Mike's homework: this week's game for the child's level (picked in wp-admin). Done = finished this week.
    var hwInfo = (BOOT.homework || {})[child.id];
    var hwStars = '';
    for (var s = 0; s < 3; s++) hwStars += star(30, !!(hwInfo && hwInfo.done));
    var hw = '<div class="k-homework' + (hwInfo ? '' : ' k-homework-none') + '"><div class="k-homework-icon">' + icon('backpack', 52) + '</div>' +
      two(menu.homework.english, menu.homework.japanese).replace('</span>',
        (hwInfo
          ? '<span class="k-homework-game">' + esc(hwInfo.english) + ' <span class="jp">' + esc(hwInfo.japanese) + '</span></span>' +
            '<span class="k-row-stars">' + hwStars + (hwInfo.done ? '<span class="k-done k-done-inline">✓ DONE<small>できた</small></span>' : '') + '</span>'
          : '<span class="k-homework-game">No homework this week <span class="jp">こんしゅうは しゅくだい なし</span></span>') +
        '</span>') +
      (hwInfo
        ? '<button class="k-big-btn k-green k-press" data-tile="homework" data-game="' + esc(hwInfo.game) + '">' +
          svg(26, 30, '0 0 26 30', '<path d="M4 3 L23 15 L4 27Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>') + 'Go!</button>'
        : '') +
      '</div>';

    // A game this child has finished at least once gets a DONE check (they can still play it again).
    function doneBadge(game) {
      return game && p.best && p.best[game] ? '<span class="k-done">✓ DONE<small>できた</small></span>' : '';
    }

    var body = '';
    if (theme) {
      body = '<div class="k-games">' + (theme.games || []).map(function (g) {
        return '<button class="k-game k-press" data-tile="' + esc(g.id) + '"' + (g.game ? ' data-game="' + esc(g.game) + '"' : '') + '>' + doneBadge(g.game) +
          '<span class="k-game-pic" style="background:' + color(g.color, '#FFE27A') + '">' + icon(g.icon, 50) + '</span>' +
          two(g.english, g.japanese) +
          (g.month ? '<span class="k-month-tag">' + esc(monthLabel(g.month)) + '</span>' : '') +
          '</button>';
      }).join('') + '</div>';
    } else if (month) {
      body = '<div class="k-heading">' + icon(month.icon, 46) + '<h2>' + esc(month.title_english) + '</h2><span class="jp">' + esc(month.title_japanese) + '</span></div>' +
        '<div class="k-lessons">' + (month.lessons || []).map(function (l) {
          // The lesson's stars fill in with the best score from its game.
          var best = (l.game && p.best && p.best[l.game]) || 0;
          return '<button class="k-lesson k-press" data-tile="' + esc(l.id) + '"' + (l.game ? ' data-game="' + esc(l.game) + '"' : '') + '>' + doneBadge(l.game) +
            '<span class="k-lesson-pic" style="background:' + color(l.color, '#FFE27A') + '"><span class="k-lesson-num">' + esc(l.number) + '</span>' + icon(l.icon, 62) + '</span>' +
            two(l.english, l.japanese).replace('</span>', '<span class="k-row-stars">' + star(32, best > 0) + star(32, best > 1) + star(32, best > 2) + '</span></span>') +
            '</button>';
        }).join('') + '</div>';
    } else {
      body = '<p class="k-sub">No lessons yet. まだ ありません。</p>';
    }

    app.innerHTML = '<div class="k-menu">' + rail + '<main class="k-main">' + top + hw + body + '</main></div>';
    app.setAttribute('data-here', here);
  }

  function railBtn(item, route, current) {
    return '<button class="k-rail-btn k-press" data-go="' + esc(route) + '"' + (current ? ' aria-current="page"' : '') + '>' +
      icon(item.icon, 48) + two(item.english, item.japanese) + '</button>';
  }

  // ---------- pop-ups ----------

  var modal = null;
  function openModal(html, onClick) {
    closeModal();
    modal = document.createElement('div');
    modal.className = 'k-modal';
    modal.innerHTML = '<div class="k-sheet" role="dialog" aria-modal="true">' +
      '<button class="k-close k-press" data-act="close" aria-label="Close">×</button>' + html + '</div>';
    modal.addEventListener('click', function (e) {
      if (e.target === modal) return closeModal();
      var b = e.target.closest('[data-act]');
      if (b && b.getAttribute('data-act') === 'close') return closeModal();
      if (onClick) onClick(e);
    });
    document.body.appendChild(modal);
    var first = modal.querySelector('input, .k-hold');
    if (first) first.focus();
  }
  function closeModal() {
    if (modal) modal.remove();
    modal = null;
  }

  // Parent gate: hold the button for 3 seconds.
  var HOLD_MS = 3000;
  function parentGate(onPass) {
    openModal('<h2>Grown-ups only</h2><span class="jp">おとなのかたへ</span>' +
      '<button class="k-hold" type="button" aria-label="Hold for 3 seconds"><span><b>Hold</b><small>ながおし 3びょう</small></span></button>' +
      '<p class="k-gate-note jp">ボタンを 3びょう おしつづけてください。<br>Hold the button for 3 seconds.</p>');
    var btn = modal.querySelector('.k-hold');
    var start = 0;
    var raf = 0;
    function tick(now) {
      var p = Math.min(1, (now - start) / HOLD_MS);
      btn.style.setProperty('--p', p);
      if (p >= 1) {
        stop();
        closeModal();
        onPass();
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    function begin(e) {
      if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (start) return;
      start = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      cancelAnimationFrame(raf);
      start = 0;
      btn.style.setProperty('--p', 0);
    }
    btn.addEventListener('pointerdown', begin);
    btn.addEventListener('keydown', begin);
    ['pointerup', 'pointercancel', 'pointerleave', 'keyup', 'blur'].forEach(function (ev) {
      btn.addEventListener(ev, stop);
    });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  // Add or change a child: nickname + avatar color + level. Nothing else is ever saved.
  function childForm(existing) {
    var c = existing || { name: '', color: AVATAR_ORDER[children.length % AVATAR_ORDER.length], level: (menu.levels[0] || {}).id };
    var swatches = AVATAR_ORDER.map(function (k) {
      return '<button type="button" class="k-swatch" role="radio" data-color="' + k + '" aria-checked="' + (k === c.color) + '" aria-label="' + k + '" style="background:' + AVATAR[k] + '"></button>';
    }).join('');
    var levels = menu.levels.map(function (l) {
      return '<button type="button" class="k-choice" role="radio" data-level="' + esc(l.id) + '" aria-checked="' + (String(l.id) === String(c.level)) + '">' +
        esc(l.english) + '<small>' + esc(l.japanese) + '</small></button>';
    }).join('');
    openModal('<h2>' + (existing ? 'Change' : 'Add a child') + '</h2><span class="jp">' + (existing ? 'へんこう' : 'こどもを ついか') + '</span>' +
      '<form class="k-form" autocomplete="off">' +
      '<div class="k-field"><label class="k-field-label" for="k-name">Nickname <small>ニックネーム</small></label>' +
      '<input class="k-input" id="k-name" maxlength="12" value="' + esc(c.name) + '"></div>' +
      '<div class="k-field"><span class="k-field-label">Color <small>いろ</small></span><div class="k-swatches" role="radiogroup">' + swatches + '</div></div>' +
      '<div class="k-field"><span class="k-field-label">Level <small>レベル</small></span><div class="k-choices" role="radiogroup">' + levels + '</div></div>' +
      '<p class="k-error" role="alert"></p>' +
      '<div class="k-sheet-btns"><button type="submit" class="k-big-btn k-green k-press">' + two('Save', 'ほぞん') + '</button></div>' +
      '</form>', function (e) {
      var sw = e.target.closest('[data-color]');
      var lv = e.target.closest('[data-level]');
      var group = sw || lv;
      if (!group) return;
      group.parentNode.querySelectorAll('[role="radio"]').forEach(function (b) { b.setAttribute('aria-checked', 'false'); });
      group.setAttribute('aria-checked', 'true');
    });
    var form = modal.querySelector('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pick = function (attr) {
        var on = form.querySelector('[' + attr + '][aria-checked="true"]');
        return on ? on.getAttribute(attr) : '';
      };
      var child = { name: form.querySelector('#k-name').value.trim(), color: pick('data-color'), level: pick('data-level') };
      var err = form.querySelector('.k-error');
      if (!child.name) {
        err.textContent = 'Please type a nickname. ニックネームを いれてください。';
        return;
      }
      if (existing) child.id = existing.id;
      save(existing ? 'update' : 'add', child, err);
    });
  }

  function grownUps() {
    var list = children.map(function (c) {
      var lv = findById(menu.levels, c.level) || {};
      return '<li>' + avatar(c.color, 56) + '<span class="k-grown-name">' + esc(c.name) + ' <span class="k-level" style="font-size:16px;background:' + color(lv.color, '#4DA3FF') + '">' + esc(lv.english || '') + '</span></span>' +
        '<button class="k-small-btn k-press" data-edit="' + esc(c.id) + '">Change<small>へんこう</small></button>' +
        '<button class="k-small-btn k-press" data-remove="' + esc(c.id) + '">Remove<small>さくじょ</small></button></li>';
    }).join('');
    openModal('<h2>Grown-ups</h2><span class="jp">おとなのかた</span>' +
      '<ul class="k-grown-list">' + (list || '<li>No children yet. まだ いません。</li>') + '</ul>' +
      '<p class="k-error" role="alert"></p>' +
      '<div class="k-sheet-btns">' +
      (children.length ? '<button class="k-small-btn k-press k-how-btn" data-act="how">How is my child doing?<small>こどもの ようす</small></button>' : '') +
      '<button class="k-small-btn k-press" data-act="add">+ Add a child<small>こどもを ついか</small></button>' +
      '<a class="k-small-btn k-press" style="display:inline-flex;flex-direction:column;justify-content:center;text-decoration:none;color:inherit" href="print.php">🖨 Print worksheets<small>プリント</small></a>' +
      '<a class="k-small-btn k-press" style="display:inline-flex;flex-direction:column;justify-content:center;text-decoration:none;color:inherit" href="' + esc(BOOT.logoutUrl) + '">Log out<small>ログアウト</small></a>' +
      '</div>' +
      '<div class="k-privacy"><p>保存するのは、お子さまのニックネーム・アバターの色・レベルと、どのゲームをいつあそんだか、いくつ正解したかだけです。誕生日・写真・学校名・音声などは保存しません。正解の数は先生だけが見ます。広告・チャット・外部リンクはありません。</p>' +
      '<p>We save each child\'s nickname, avatar color and level, which games they played and when, and how many answers were right. Nothing else. Only the teacher sees the right answers. No ads, no chat, no links out.</p></div>',
      function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        if (b.getAttribute('data-act') === 'how') return howAreTheyDoing();
        if (b.getAttribute('data-act') === 'add') return childForm();
        if (b.hasAttribute('data-edit')) return childForm(findById(children, b.getAttribute('data-edit')));
        if (b.hasAttribute('data-remove')) {
          // Two taps to remove, so it never happens by accident.
          if (b.getAttribute('data-sure') !== '1') {
            b.setAttribute('data-sure', '1');
            b.innerHTML = 'Tap again<small>もういちど</small>';
            return;
          }
          save('remove', { id: b.getAttribute('data-remove') }, modal.querySelector('.k-error'), true);
        }
      });
  }

  // Parents: what each child played, when, DONE and stars. No percentages and no wrong answers
  // (right answers appear only if the teacher switched that on: H212_KIDS_PARENTS_SEE_RIGHT).
  function howAreTheyDoing() {
    var recent = BOOT.recent || {};
    var html = children.map(function (c) {
      var p = progress[c.id] || {};
      var rows = (recent[c.id] || []).map(function (r) {
        return '<li><span class="k-how-date">' + esc(r.date.slice(5).replace('-', '/')) + '</span>' +
          '<span class="k-how-game">' + esc(r.english) + ' <small>' + esc(r.japanese) + '</small></span>' +
          (r.counted ? '<span class="k-how-right">' + r.right + ' / ' + r.counted + '</span>' : '') +
          (r.done ? '<span class="k-how-done">✓ DONE</span><span class="k-how-stars">' + star(22, true) + ' ' + r.stars + '</span>' : '<span class="k-how-open">Not finished とちゅう</span>') +
          '</li>';
      }).join('');
      return '<section class="k-how-child"><h3>' + avatar(c.color, 40) + ' ' + esc(c.name) +
        '<span class="k-how-total">' + star(26, true) + ' ' + (p.stars || 0) + '</span></h3>' +
        (rows ? '<ul class="k-how-list">' + rows + '</ul>' : '<p class="k-gate-note jp">Nothing played yet. まだ あそんでいません。</p>') +
        '</section>';
    }).join('');
    openModal('<h2>How is my child doing?</h2><span class="jp">こどもの ようす</span>' + html +
      '<div class="k-sheet-btns"><button class="k-small-btn k-press" data-act="back">Back<small>もどる</small></button></div>',
      function (e) {
        var b = e.target.closest('button');
        if (b && b.getAttribute('data-act') === 'back') grownUps();
      });
  }

  function save(action, child, errBox, reopenGrownUps) {
    fetch('save-child.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce: BOOT.nonce, action: action, child: child })
    }).then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    }).then(function (res) {
      if (!res.ok || !res.data.ok) throw new Error(res.data.error || 'Could not save.');
      children = res.data.children || [];
      closeModal();
      route();
      if (reopenGrownUps) grownUps();
    }).catch(function (e) {
      if (errBox) errBox.textContent = e.message || 'Could not save. Please try again.';
    });
  }

  // Save "this child opened this tile" (for the teacher screen), then open it:
  // its game if it has one, otherwise the temporary "being made" page.
  // A slow or failed save never stops the child: we go on after at most 1.5 seconds.
  function openTile(tile, game) {
    var from = encodeURIComponent(app.getAttribute('data-here') || '/');
    var url = game && currentChild
      ? 'game.php?g=' + encodeURIComponent(game) + '&c=' + encodeURIComponent(currentChild.id) + '&from=' + from
      : TEMP_PLAY_PAGE + '?tile=' + encodeURIComponent(tile) + '&from=' + from;
    var gone = false;
    function leave() {
      if (!gone) {
        gone = true;
        location.href = url;
      }
    }
    if (!currentChild) return leave();
    setTimeout(leave, 1500);
    fetch('save-progress.php', {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce: BOOT.nonce, child: currentChild.id, tile: tile })
    }).then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.progress) progress[currentChild.id] = data.progress;
      })
      .catch(function () {})
      .then(leave);
  }

  // ---------- taps and routing ----------

  app.addEventListener('click', function (e) {
    var b = e.target.closest('button, a');
    if (!b) return;
    if (b.hasAttribute('data-go')) return go(b.getAttribute('data-go'));
    if (b.hasAttribute('data-kid')) {
      // The child's "login": recorded for the teacher. Never waits for the save.
      fetch('save-progress.php', {
        method: 'POST',
        credentials: 'same-origin',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce: BOOT.nonce, child: b.getAttribute('data-kid'), action: 'pick' })
      }).catch(function () {});
      return go('/c/' + b.getAttribute('data-kid'));
    }
    if (b.hasAttribute('data-tile')) return openTile(b.getAttribute('data-tile'), b.getAttribute('data-game'));
    var act = b.getAttribute('data-act');
    if (act === 'add') return parentGate(function () { childForm(); });
    if (act === 'grownups') return parentGate(grownUps);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    app.removeAttribute('data-here');
    currentChild = null;
    if (parts[0] === 'c' && parts[1]) {
      var child = findById(children, parts[1]);
      if (child) {
        currentChild = child;
        renderMenu(child, parts[2] === 't' ? 't' : 'class', parts[3] || '');
        window.scrollTo(0, 0);
        return;
      }
    }
    if (location.hash && location.hash !== '#/') {
      history.replaceState(null, '', '#/');
    }
    renderHome();
  }

  window.addEventListener('hashchange', function () {
    closeModal();
    route();
  });

  fetch(BOOT.menuUrl, { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      menu = data;
      route();
    })
    .catch(function () {
      app.innerHTML = '<main class="k-center"><h1 class="k-title">Oops!</h1><p class="k-sub">kids-menu.json could not be read. Please check the file.</p></main>';
    });
})();
