// Phonics screens. Practice only: it never counts for unlocking chapters or for Grades.
//
//   Steps (9)  ->  Lessons of a step  ->  one lesson's parts  ->  a part
//   Parts so far: A. Sound Board, C. Listen & pick (three games).
//
// Page setup (phonics.php) sets window.H212_PHONICS (steps, lessons, sounds, progress, audio),
// window.H212_T (phonics.* strings) and window.H212_NONCE, and loads listen.js (robot voice) and ui.js.
// The lists themselves are portal/phonics/*.csv, read by inc/phonics-data.php.
//
// Sound Board: tiles for every sound taught up to this lesson, the newest one highlighted.
// Tap a tile: you hear the sound and then the key word (audio/phonics/sounds/<sound_no>.m4a);
// the Japanese tip shows in the card above. A lesson with two sounds (th, ew...) has a small second
// button: the first sound's recording has both parts, the second plays the key word only.
// If a recording is missing the browser's robot voice says the key word instead.
//
// Listen & pick (3 games, 10 questions a round, built here from the word list - no question ids):
//   Sound -> letters      hear a sound, pick its letters (3 choices, all already taught)
//   Hear a word           hear a word, pick it (the wrong words differ by one sound when possible: cat / cot / cut)
//   Which word begins...  hear a sound, pick the word that begins with it (Mike's worksheet)
// Only COMMON words with a clean note are used, and only words from this lesson or earlier lessons,
// so a student is never asked about a sound they have not met. Words that sound the same (sail / sale)
// are never offered together. A finished round ticks the game; the lesson's "Listen & pick" is ticked
// when every game this lesson can play is ticked.
var H212Phonics = (function () {
  var P = window.H212_PHONICS || { steps: [], lessons: {}, sounds: {}, progress: {}, audio: { v: 0, sounds: [], words: [] }, game: [], homo: [] };
  var player = null;      // the recorded clip that is playing, if any
  var picked = null;      // Sound Board: the sound shown in the card { no, part }
  // Parts that exist so far, in menu order. Add 'blend', 'listen', 'read', 'sentences' as they are built.
  var READY = ['board', 'listen'];
  var PARTS = ['board', 'blend', 'listen', 'read', 'sentences'];
  var GAMES = ['sound', 'word', 'begin'];
  var G = null;           // the round in progress: { n, game, qs, i, correct, locked }
  var ICONS = { board: 'vocabulary', blend: 'builder', listen: 'listening', read: 'speaking', sentences: 'conversation' };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(key) { return (window.H212_T && window.H212_T[key]) || ''; }
  function fill(text, vars) {
    Object.keys(vars).forEach(function (k) { text = text.split('{' + k + '}').join(vars[k]); });
    return text;
  }
  function pc() { return document.getElementById('page-content'); }
  function key(e, js) { return ' role="button" tabindex="0" onclick="' + js + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + js + ';}"'; }

  // ── Progress ────────────────────────────────────────
  function partDone(n, part) {
    if (part === 'listen') {
      var avail = GAMES.filter(function (g) { return gameAvailable(n, g); });
      return avail.length > 0 && avail.every(function (g) { return !!(P.progress[n] && P.progress[n]['listen_' + g]); });
    }
    return !!(P.progress[n] && P.progress[n][part]);
  }
  function partAvailable(n, part) {
    if (part === 'listen') return GAMES.some(function (g) { return gameAvailable(n, g); });
    return true;
  }
  // A lesson is finished when every part it can play is ticked
  function lessonDone(n) {
    return READY.every(function (p) { return !partAvailable(n, p) || partDone(n, p); });
  }
  function doneCount(n) { return READY.filter(function (p) { return partAvailable(n, p) && partDone(n, p); }).length; }

  // The first lesson (in Mike's order) that is not finished: "Recommended next"
  function nextLesson() {
    var nums = Object.keys(P.lessons).map(Number).sort(function (a, b) { return a - b; });
    for (var i = 0; i < nums.length; i++) if (!lessonDone(nums[i])) return nums[i];
    return 0;
  }

  function save(n, part, score) {
    score = Math.max(1, Math.min(100, score || 1));
    if (!P.progress[n]) P.progress[n] = {};
    P.progress[n][part] = Math.max(P.progress[n][part] || 0, score);
    fetch('inc/phonics.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce: window.H212_NONCE, action: 'part', lesson: n, part: part, score: score })
    }).catch(function () {});
  }

  // ── Names ───────────────────────────────────────────
  function lessonLetters(l) { return l.title.split(' (')[0]; }                    // "ch (chair)" -> "ch"
  function lessonLabel(l) {
    if (l.kind === 'review') return T('phonics.review');
    if (l.kind === 'bonus') return T('phonics.bonus');
    return T('phonics.lesson') + ' ' + l.n;
  }
  function lessonBig(l) {
    if (l.kind === 'sound') return lessonLetters(l);
    return l.title.replace(/^(Review|Bonus):\s*/, '');
  }

  // ── Sound ───────────────────────────────────────────
  function stopAudio() {
    if (player) { try { player.pause(); } catch (e) {} player = null; }
  }
  function has(list, v) { return (list || []).indexOf(v) !== -1; }

  // Plays a recording; if it will not play, says `text` with the robot voice instead
  function clip(url, text) {
    var robot = function () { if (typeof H212Listen !== 'undefined' && text) H212Listen.speakText(text); };
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    if (!url || typeof Audio === 'undefined') { robot(); return; }
    var a = new Audio(url);
    player = a;
    a.onerror = function () { if (player === a) { player = null; robot(); } };
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function (e) {
      if (player !== a || (e && e.name === 'AbortError')) return;
      player = null;
      robot();
    });
  }

  function playSound(no, part) {
    var s = P.sounds[no];
    if (!s) return;
    var v = '?v=' + (P.audio.v || 0);
    var word = (s.parts[part] || s.parts[0]).key_word;
    if (part === 0 && has(P.audio.sounds, no)) clip('audio/phonics/sounds/' + no + '.m4a' + v, word);
    else if (has(P.audio.words, word)) clip('audio/phonics/words/' + encodeURIComponent(word) + '.m4a' + v, word);
    else clip('', word);
  }

  function playWord(word) {
    var v = '?v=' + (P.audio.v || 0);
    if (has(P.audio.words, word)) clip('audio/phonics/words/' + encodeURIComponent(word) + '.m4a' + v, word);
    else clip('', word);
  }

  // ── Steps ───────────────────────────────────────────
  function stepSounds(step) {
    var seen = {}, out = [];
    step.lessons.forEach(function (n) {
      var l = P.lessons[n];
      if (l.kind === 'sound') out.push(lessonLetters(l));
    });
    return out.join(' ');
  }

  function showSteps() {
    stopAudio();
    var rec = nextLesson(), recStep = rec ? P.lessons[rec].step : 0;
    var h = '<div class="section-header"><h2>' + esc(T('nav.phonics')) + '</h2><p>' + esc(T('phonics.subtitle')) + '</p></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_step')) + '</div>'
      + '<div class="part-group grp-phonics"><div class="type-grid">';
    P.steps.forEach(function (st) {
      var done = st.lessons.filter(lessonDone).length, all = done === st.lessons.length;
      var status = all ? '<span class="status done">✓ ' + esc(T('phonics.done')) + '</span>'
        : (st.step === recStep ? '<span class="status take">' + esc(T('phonics.recommended')) + '</span>'
          : (done ? '<span class="status part">' + done + '/' + st.lessons.length + '</span>' : ''));
      h += '<div class="type-btn"' + key(0, 'H212Phonics.step(' + st.step + ')') + '>'
        + '<span class="icon ph-stepnum">' + st.step + '</span>'
        + '<span class="lbl">' + esc(T('phonics.step')) + ' ' + st.step + '</span>'
        + '<span class="sub ph-sub">' + esc(stepSounds(st)) + '</span>'
        + status + '</div>';
    });
    h += '</div></div>';
    pc().innerHTML = h;
  }

  // ── Lessons of one step ─────────────────────────────
  function showLessons(stepNo) {
    stopAudio();
    var st = P.steps.filter(function (s) { return s.step === stepNo; })[0];
    if (!st) return showSteps();
    var rec = nextLesson();
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.steps()" aria-label="' + esc(T('phonics.back_steps')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(T('nav.phonics')) + '</div>'
      + '<div class="chapter-head-title">' + esc(T('phonics.step')) + ' ' + stepNo + '</div></div></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_lesson')) + '</div>'
      + '<div class="chapter-grid practice-sets grp-phonics">';
    st.lessons.forEach(function (n) {
      var l = P.lessons[n], all = lessonDone(n), part = doneCount(n);
      var cls = 'chapter-btn practice-set' + (all ? ' is-done' : '') + (n === rec ? ' is-next' : '') + (l.kind !== 'sound' ? ' ph-extra' : '');
      h += '<div class="' + cls + '"' + key(0, 'H212Phonics.lesson(' + n + ')') + '>'
        + '<span class="num">' + esc(lessonBig(l)) + '</span><span class="lbl">' + esc(lessonLabel(l)) + '</span>'
        + '<span class="status ' + (all ? 'done-tick' : (n === rec ? 'take' : (part ? 'part' : 'take'))) + '">'
        + (all ? '✓ ' + esc(T('phonics.done')) : (n === rec ? esc(T('phonics.recommended')) : esc(T('phonics.new')))) + '</span></div>';
    });
    h += '</div>';
    pc().innerHTML = h;
  }

  // ── One lesson: its parts ───────────────────────────
  function showLesson(n) {
    stopAudio();
    var l = P.lessons[n];
    if (!l) return showSteps();
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.step(' + l.step + ')" aria-label="' + esc(T('phonics.back_lessons')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(T('phonics.step')) + ' ' + l.step + ' · ' + esc(lessonLabel(l)) + '</div>'
      + '<div class="chapter-head-title">' + esc(l.kind === 'sound' ? l.title : l.title) + '</div></div></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_part')) + (l.words ? ' · ' + esc(fill(T('phonics.words_n'), { n: l.words })) : '') + '</div>'
      + '<div class="part-group grp-phonics"><div class="type-grid">';
    PARTS.forEach(function (p) {
      var inBuild = READY.indexOf(p) !== -1;
      var ready = inBuild && partAvailable(n, p);
      var status = '', sub = T('phonics.coming');
      if (ready) {
        sub = T('phonics.part_' + p + '_sub');
        if (p === 'listen') {
          var avail = GAMES.filter(function (g) { return gameAvailable(n, g); });
          var got = avail.filter(function (g) { return P.progress[n] && P.progress[n]['listen_' + g]; }).length;
          status = partDone(n, p) ? '<span class="status done">✓ ' + esc(T('phonics.done')) + '</span>'
            : (got ? '<span class="status part">' + got + '/' + avail.length + '</span>' : '<span class="status take">' + esc(T('phonics.new')) + '</span>');
        } else {
          status = partDone(n, p) ? '<span class="status done">✓ ' + esc(T('phonics.done')) + '</span>' : '<span class="status take">' + esc(T('phonics.new')) + '</span>';
        }
      } else if (inBuild) {
        sub = T('phonics.game_locked');
      }
      h += '<div class="type-btn' + (ready ? '' : ' empty') + '"' + (ready ? key(0, 'H212Phonics.part(' + n + ',\'' + p + '\')') : '') + '>'
        + '<span class="icon">' + H212UI.icons[ICONS[p]] + '</span>'
        + '<span class="lbl">' + esc(T('phonics.part_' + p)) + '</span>'
        + '<span class="sub">' + esc(sub) + '</span>'
        + status + '</div>';
    });
    h += '</div></div>';
    pc().innerHTML = h;
  }

  // ── A. Sound Board ──────────────────────────────────
  function boardTile(no, isNew) {
    var s = P.sounds[no], two = s.parts.length > 1;
    var h = '<div class="ph-tile' + (isNew ? ' is-new' : '') + (two ? ' is-two' : '') + '"' + key(0, 'H212Phonics.tap(' + no + ',0)') + '>'
      + '<span class="ph-letter">' + esc(s.sound) + '</span>'
      + '<span class="ph-key">' + esc(s.parts[0].key_word) + '</span>';
    if (two) {
      h += '<span class="ph-second" role="button" tabindex="0" aria-label="' + esc(T('phonics.sound_second')) + ': ' + esc(s.parts[1].key_word) + '"'
        + ' onclick="event.stopPropagation();H212Phonics.tap(' + no + ',1)"'
        + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();event.stopPropagation();H212Phonics.tap(' + no + ',1);}">'
        + '▸ ' + esc(s.parts[1].key_word) + '</span>';
    }
    return h + '</div>';
  }

  function cardHtml() {
    if (!picked) return '<div class="ph-card ph-card-empty grp-phonics">' + esc(T('phonics.board_hint')) + '</div>';
    var s = P.sounds[picked.no], part = s.parts[picked.part] || s.parts[0];
    return '<div class="ph-card grp-phonics">'
      + '<button type="button" class="ph-card-play" onclick="H212Phonics.tap(' + picked.no + ',' + picked.part + ')" aria-label="Play">' + H212UI.icons.listening + '</button>'
      + '<div class="ph-card-main"><div class="ph-card-letter">' + esc(s.sound) + ' <span class="ph-card-key">· ' + esc(part.key_word) + '</span></div>'
      + '<div class="ph-card-ipa">/' + esc(part.ipa) + '/</div>'
      + (s.tip_ja ? '<div class="ph-card-tip" lang="ja">' + esc(s.tip_ja) + '</div>' : '') + '</div></div>';
  }

  function showBoard(n) {
    var l = P.lessons[n];
    if (!l) return showSteps();
    var newNo = l.kind === 'sound' ? l.sound_no : 0;
    var nos = Object.keys(P.sounds).map(Number).filter(function (no) { return no <= l.sound_no; }).sort(function (a, b) { return a - b; });
    picked = newNo ? { no: newNo, part: 0 } : null;
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.lesson(' + n + ')" aria-label="' + esc(T('phonics.back_parts')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(lessonLabel(l)) + ' · ' + esc(T('phonics.part_board')) + '</div>'
      + '<div class="chapter-head-title">' + esc(l.title) + '</div></div></div>'
      + '<div id="ph-card">' + cardHtml() + '</div>';
    if (newNo) {
      h += '<div class="practice-choose">' + esc(T('phonics.board_new')) + '</div><div class="ph-grid grp-phonics">' + boardTile(newNo, true) + '</div>';
    } else {
      h += '<div class="ph-note">' + esc(T('phonics.board_none')) + '</div>';
    }
    var before = nos.filter(function (no) { return no !== newNo; });
    if (before.length) {
      h += '<div class="practice-choose">' + esc(T('phonics.board_before')) + '</div><div class="ph-grid grp-phonics">'
        + before.map(function (no) { return boardTile(no, false); }).join('') + '</div>';
    }
    pc().innerHTML = h;
    window.__phBoard = n;
  }

  function tap(no, part) {
    picked = { no: no, part: part || 0 };
    var card = document.getElementById('ph-card');
    if (card) card.innerHTML = cardHtml();
    playSound(no, part || 0);
    var n = window.__phBoard, l = P.lessons[n];
    // The board counts as done when the student has tried the new sound (or any tile in a Review / Bonus lesson)
    if (l && !partDone(n, 'board') && (l.kind !== 'sound' || no === l.sound_no)) save(n, 'board', 1);
  }

  // ── C. Listen & pick ────────────────────────────────
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function knownNos(n) {
    var l = P.lessons[n];
    return Object.keys(P.sounds).map(Number).filter(function (no) { return no <= l.sound_no; }).sort(function (a, b) { return a - b; });
  }
  function poolWords(n, maxLesson) {
    var top = Math.min(n, maxLesson || 999);
    return P.game.filter(function (x) { return x.l <= top; });
  }

  // Words that sound alike
  var homoOf = null;
  function sameSound(a, b) {
    if (!homoOf) {
      homoOf = {};
      (P.homo || []).forEach(function (g, gi) { g.forEach(function (w) { homoOf[w] = gi; }); });
    }
    return a === b || (homoOf[a] !== undefined && homoOf[a] === homoOf[b]);
  }
  function diffCount(a, b) {
    if (a.length !== b.length) return 99;
    var d = 0;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
    return d;
  }

  // Sounds that are easy to mix up are not offered side by side when there is another choice
  var CONFUSED = [['b', 'd'], ['p', 'q'], ['m', 'n'], ['c', 'k'], ['g', 'j'], ['f', 'v'], ['s', 'z'], ['b', 'p'], ['d', 't'], ['sh', 'ch'],
    ['i', 'e'], ['o', 'a'], ['u', 'a'], ['ee', 'ea'], ['ai', 'ay'], ['oa', 'oe'], ['er', 'ir'], ['ir', 'ur'], ['er', 'ur'], ['au', 'aw'],
    ['oi', 'oy'], ['ou', 'ow'], ['l', 'r'], ['w', 'wh'], ['f', 'ph']];
  function confused(a, b) {
    return CONFUSED.some(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); });
  }

  // Game 1: hear a sound, pick its letters
  function buildSound(n) {
    var known = knownNos(n), l = P.lessons[n];
    if (known.length < 3) return [];
    var newNo = l.kind === 'sound' ? l.sound_no : 0;
    var order = shuffle(known.slice());
    if (newNo) { order.splice(order.indexOf(newNo), 1); order.unshift(newNo); }
    var qs = [];
    order.slice(0, 10).forEach(function (no) {
      var t = P.sounds[no].sound;
      var others = shuffle(known.filter(function (k) { return k !== no && P.sounds[k].sound !== t; }));
      var picked = [];
      var addFrom = function (list) {
        list.forEach(function (k) {
          if (picked.length >= 2) return;
          var txt = P.sounds[k].sound;
          if (picked.some(function (p) { return P.sounds[p].sound === txt; })) return;
          picked.push(k);
        });
      };
      addFrom(others.filter(function (k) { return !confused(t, P.sounds[k].sound); }));
      addFrom(others);
      if (picked.length < 2) return;
      var choices = shuffle([no].concat(picked));
      qs.push({ audio: { sound: no }, choices: choices.map(function (k) { return P.sounds[k].sound; }), answer: choices.indexOf(no) });
    });
    return shuffle(qs);
  }

  // Game 2: hear a word, pick it. Wrong answers differ by one sound when possible (cat / cot / cut).
  function buildWord(n) {
    var pool = poolWords(n);
    if (pool.length < 3) return [];
    var own = shuffle(pool.filter(function (x) { return x.l === n; }));
    var rest = shuffle(pool.filter(function (x) { return x.l !== n; }));
    var qs = [];
    own.concat(rest).slice(0, 10).forEach(function (t) {
      var cands = pool.filter(function (x) { return x.w !== t.w && !sameSound(x.w, t.w); });
      var tier1 = shuffle(cands.filter(function (x) { return diffCount(x.w, t.w) === 1; }));
      var tier2 = shuffle(cands.filter(function (x) { return x.w.length === t.w.length && diffCount(x.w, t.w) > 1; }));
      var tier3 = shuffle(cands.filter(function (x) { return x.w.charAt(0) === t.w.charAt(0); }));
      var tier4 = shuffle(cands);
      var picked = [];
      [tier1, tier2, tier3, tier4].forEach(function (list) {
        list.forEach(function (x) {
          if (picked.length >= 2) return;
          if (picked.some(function (p) { return sameSound(p.w, x.w); })) return;
          picked.push(x);
        });
      });
      if (picked.length < 2) return;
      var choices = shuffle([t].concat(picked));
      qs.push({ audio: { word: t.w }, choices: choices.map(function (c) { return c.w; }), answer: choices.map(function (c) { return c.w; }).indexOf(t.w) });
    });
    return shuffle(qs);
  }

  // Game 3: "Which word begins with this sound?". Only single, steady starting sounds are used.
  var BEGIN_OK = ['ch', 'sh', 'wh', 'qu', 'ph', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'y', 'z'];
  var NOT_BEGIN = /^(kn|wr|gn|ps|rh|who|whom|whose|whole|th)/;
  // Which taught sound a word begins with: { s: 'sh', cls: 'sh' } or null when it is not clear-cut
  function beginOf(word, known) {
    if (NOT_BEGIN.test(word)) return null;
    for (var i = 0; i < BEGIN_OK.length; i++) {
      var b = BEGIN_OK[i];
      if (word.indexOf(b) !== 0) continue;
      if (!known[b]) return null;
      if ((b === 'c' || b === 'g') && 'aoulr'.indexOf(word.charAt(1)) === -1) return null;   // soft c / soft g
      var cls = b === 'c' ? 'k' : (b === 'ph' ? 'f' : (b === 'wh' ? 'w' : b));
      return { s: b, cls: cls };
    }
    return null;
  }
  function buildBegin(n) {
    var l = P.lessons[n], known = {};
    knownNos(n).forEach(function (no) { if (!known[P.sounds[no].sound]) known[P.sounds[no].sound] = no; });
    // lessons 70+ re-use letters for new sounds (ch in school, s in is), so only earlier words are used here
    var pool = poolWords(n, 69).map(function (x) { var b = beginOf(x.w, known); return b ? { w: x.w, l: x.l, s: b.s, cls: b.cls } : null; }).filter(Boolean);
    var bySound = {};
    pool.forEach(function (x) { (bySound[x.s] = bySound[x.s] || []).push(x); });
    var sounds = shuffle(Object.keys(bySound));
    var ownS = l.kind === 'sound' ? P.sounds[l.sound_no].sound : '';
    if (ownS && bySound[ownS]) { sounds.splice(sounds.indexOf(ownS), 1); sounds.unshift(ownS); }
    var qs = [];
    sounds.slice(0, 10).forEach(function (s) {
      var words = shuffle(bySound[s].slice());
      var own = words.filter(function (x) { return x.l === n; });
      var t = (own.length ? own : words)[0];
      var others = shuffle(pool.filter(function (x) { return x.cls !== t.cls; }));
      var picked = [];
      others.forEach(function (x) {
        if (picked.length >= 2) return;
        if (picked.some(function (p) { return p.cls === x.cls; })) return;
        picked.push(x);
      });
      if (picked.length < 2) return;
      var choices = shuffle([t].concat(picked));
      qs.push({ audio: { sound: known[s] }, choices: choices.map(function (c) { return c.w; }), answer: choices.indexOf(t), word: t.w });
    });
    return shuffle(qs);
  }

  function build(n, game) {
    return game === 'sound' ? buildSound(n) : (game === 'word' ? buildWord(n) : buildBegin(n));
  }
  var availCache = {};
  function gameAvailable(n, game) {
    if (!P.lessons[n]) return false;
    var k = n + ':' + game;
    if (availCache[k] === undefined) availCache[k] = build(n, game).length > 0;
    return availCache[k];
  }

  function showListenMenu(n) {
    stopAudio();
    G = null;
    var l = P.lessons[n];
    if (!l) return showSteps();
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.lesson(' + n + ')" aria-label="' + esc(T('phonics.back_parts')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(lessonLabel(l)) + ' · ' + esc(T('phonics.part_listen')) + '</div>'
      + '<div class="chapter-head-title">' + esc(l.title) + '</div></div></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_game')) + '</div>'
      + '<div class="part-group grp-phonics"><div class="type-grid">';
    var icons = { sound: 'listening', word: 'vocabulary', begin: 'grammar' };
    GAMES.forEach(function (g) {
      var ok = gameAvailable(n, g), best = P.progress[n] && P.progress[n]['listen_' + g];
      var status = '';
      if (ok) status = best ? '<span class="status done">✓ ' + esc(fill(T('phonics.best'), { n: best })) + '</span>' : '<span class="status take">' + esc(T('phonics.new')) + '</span>';
      h += '<div class="type-btn' + (ok ? '' : ' empty') + '"' + (ok ? key(0, 'H212Phonics.game(' + n + ',\'' + g + '\')') : '') + '>'
        + '<span class="icon">' + H212UI.icons[icons[g]] + '</span>'
        + '<span class="lbl">' + esc(T('phonics.game_' + g)) + '</span>'
        + '<span class="sub">' + esc(ok ? T('phonics.game_' + g + '_sub') : T('phonics.game_locked')) + '</span>'
        + status + '</div>';
    });
    h += '</div></div>';
    pc().innerHTML = h;
  }

  function startGame(n, game) {
    var qs = build(n, game);
    if (!qs.length) return;
    G = { n: n, game: game, qs: qs, i: 0, correct: 0, locked: false };
    showQ();
    window.scrollTo(0, 0);
  }

  function playQ() {
    if (!G) return;
    var q = G.qs[G.i];
    if (q.audio.sound) playSound(q.audio.sound, 0); else playWord(q.audio.word);
  }

  function showQ() {
    var q = G.qs[G.i], l = P.lessons[G.n];
    G.locked = false;
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    var last = G.i + 1 >= G.qs.length;
    var h = H212UI.qTop({ onclose: 'H212Phonics.listenMenu(' + G.n + ')', label: T('phonics.back_games'), index: G.i, total: G.qs.length, noScore: true })
      + '<div class="grp-phonics"><div class="q-label">' + esc(T('nav.phonics')) + ' · ' + esc(lessonLabel(l)) + ' · ' + esc(T('phonics.game_' + G.game)) + '</div></div>'
      + '<div class="question-card">'
      + '<button type="button" class="listen-btn listen-btn-big" id="listen-btn" onclick="H212Phonics.hear()">' + esc(T('listen.play')) + '</button>'
      + ((typeof H212Listen !== 'undefined' && H212Listen.soundHint) ? H212Listen.soundHint() : '')
      + '<div class="question-text">' + esc(T('phonics.q_' + G.game)) + '</div>'
      + '<div class="choices ph-choices">';
    q.choices.forEach(function (c, i) {
      h += '<button type="button" class="choice-btn" onclick="H212Phonics.answer(' + i + ')">' + esc(c) + '</button>';
    });
    h += '</div><div class="result-msg" id="result-msg"></div>'
      + '<button class="next-btn" id="next-btn" onclick="H212Phonics.next()">' + esc(last ? T('hw.see_results') : T('hw.next_question')) + '</button></div>';
    pc().innerHTML = h;
    playQ();
  }

  function answer(i) {
    if (!G || G.locked) return;
    G.locked = true;
    var q = G.qs[G.i], right = (i === q.answer);
    var btns = document.querySelectorAll('.choice-btn');
    btns.forEach(function (b, bi) {
      b.disabled = true;
      if (bi === q.answer) b.classList.add('correct');
    });
    var msg = document.getElementById('result-msg');
    if (right) {
      G.correct++;
      msg.textContent = T('phonics.right');
      msg.className = 'result-msg correct';
    } else {
      btns[i].classList.add('wrong');
      msg.textContent = T('phonics.wrong_is') + ' ' + q.choices[q.answer];
      msg.className = 'result-msg wrong';
    }
    msg.style.display = 'block';
    var nb = document.getElementById('next-btn');
    if (nb) nb.style.display = 'inline-flex';
    // say the answer again: the word, or the sound
    if (q.audio.word) playWord(q.audio.word);
    else if (q.word) playWord(q.word);
    else playSound(q.audio.sound, 0);
  }

  function next() {
    if (!G) return;
    if (G.i + 1 < G.qs.length) { G.i++; showQ(); window.scrollTo(0, 0); }
    else finishGame();
  }

  function finishGame() {
    var pct = Math.round(G.correct * 100 / G.qs.length);
    save(G.n, 'listen_' + G.game, pct);
    var h = '<div class="question-card" style="text-align:center">'
      + '<div style="font-size:48px;margin-bottom:16px">🎉</div>'
      + '<div class="speak-finish-title">' + esc(T('phonics.finish_title')) + '</div>'
      + '<div class="speak-finish-sub">' + esc(fill(T('phonics.finish_sub'), { c: G.correct, t: G.qs.length })) + '</div>'
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.game(' + G.n + ',\'' + G.game + '\')">' + esc(T('phonics.again')) + '</button>'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.listenMenu(' + G.n + ')">' + esc(T('phonics.back_games')) + '</button>'
      + '</div></div>';
    pc().innerHTML = h;
    stopAudio();
  }

  // ── Navigation ──────────────────────────────────────
  function goTop() { window.scrollTo(0, 0); }
  function init() { showSteps(); }

  return {
    init: init,
    steps: function () { showSteps(); goTop(); },
    step: function (n) { showLessons(n); goTop(); },
    lesson: function (n) { showLesson(n); goTop(); },
    part: function (n, p) {
      if (p === 'board') { showBoard(n); goTop(); }
      else if (p === 'listen') { showListenMenu(n); goTop(); }
    },
    listenMenu: function (n) { showListenMenu(n); goTop(); },
    game: startGame,
    hear: playQ,
    answer: answer,
    next: next,
    tap: tap,
    _build: build,
    _state: function () { return P; }
  };
})();

document.addEventListener('DOMContentLoaded', H212Phonics.init);
