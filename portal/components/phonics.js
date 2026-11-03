// Phonics screens. Practice only: it never counts for unlocking chapters or for Grades.
//
//   Steps (9)  ->  Lessons of a step  ->  one lesson's parts  ->  a part
//   Parts so far: A. Sound Board, B. Blend it, C. Listen & pick (three games), D. Read aloud, E. Listening sentences, F. print worksheet.
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
  var P = window.H212_PHONICS || { steps: [], lessons: {}, sounds: {}, progress: {}, audio: { v: 0, sounds: [], alone: [], words: [], sentences: [] }, game: [], blend: {}, read: {}, sent: [], homo: [] };
  var player = null;      // the recorded clip that is playing, if any
  var picked = null;      // Sound Board: the sound shown in the card { no, part }
  // Parts that exist so far, in menu order.
  var READY = ['board', 'blend', 'listen', 'read', 'sentences'];
  var PARTS = ['board', 'blend', 'listen', 'read', 'sentences', 'games'];
  var OPTIONAL = ['games'];       // extra parts: they show a tick but never decide whether a lesson is done
  var GAMES = ['sound', 'word', 'begin'];
  var G = null;           // Listen & pick: the round in progress { n, game, qs, i, correct, locked }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;   // none on iPhone Chrome
  var R = null;           // Read aloud: the round in progress { n, words, i, tried: {word: true}, rec, token }
  var B = null;           // Blend it: the round in progress { n, words, i, blended: {word: true}, token }
  var ICONS = { board: 'vocabulary', blend: 'builder', listen: 'listening', read: 'speaking', sentences: 'conversation', games: 'grammar' };

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
    if (part === 'blend') return blendPool(n).length >= 2;
    if (part === 'read') { var r = P.read && P.read[n]; return !!(r && (r.w.length || r.c.length)); }
    if (part === 'sentences') return sentencePool(n).length >= 3;
    if (part === 'games') return WG.some(function (g) { return wgAvailable(n, g); });
    return true;
  }
  // A lesson is finished when every part it can play is ticked
  // (Read aloud only counts when the lesson has common words: a lesson with only rare words and names has nothing to tick)
  function partCounts(n, p) { return partAvailable(n, p) && (p !== 'read' || P.read[n].w.length > 0); }
  function lessonDone(n) {
    return READY.every(function (p) { return !partCounts(n, p) || partDone(n, p); });
  }
  function doneCount(n) { return READY.filter(function (p) { return partCounts(n, p) && partDone(n, p); }).length; }

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
    stopRec();
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
    if (typeof H212WordGames !== 'undefined') H212WordGames.stop();
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
    if (typeof H212WordGames !== 'undefined') H212WordGames.stop();
    var l = P.lessons[n];
    if (!l) return showSteps();
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.step(' + l.step + ')" aria-label="' + esc(T('phonics.back_lessons')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(T('phonics.step')) + ' ' + l.step + ' · ' + esc(lessonLabel(l)) + '</div>'
      + '<div class="chapter-head-title">' + esc(l.kind === 'sound' ? l.title : l.title) + '</div></div></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_part')) + (l.words ? ' · ' + esc(fill(T('phonics.words_n'), { n: l.words })) : '') + '</div>'
      + '<div class="part-group grp-phonics"><div class="type-grid">';
    PARTS.forEach(function (p) {
      var inBuild = READY.indexOf(p) !== -1 || OPTIONAL.indexOf(p) !== -1;
      var ready = inBuild && partAvailable(n, p);
      var status = '', sub = T('phonics.coming');
      if (ready) {
        sub = T('phonics.part_' + p + '_sub');
        if (p === 'listen') {
          var avail = GAMES.filter(function (g) { return gameAvailable(n, g); });
          var got = avail.filter(function (g) { return P.progress[n] && P.progress[n]['listen_' + g]; }).length;
          status = partDone(n, p) ? '<span class="status done">✓ ' + esc(T('phonics.done')) + '</span>'
            : (got ? '<span class="status part">' + got + '/' + avail.length + '</span>' : '<span class="status take">' + esc(T('phonics.new')) + '</span>');
        } else if (p === 'games') {
          var wa = WG.filter(function (g) { return wgAvailable(n, g); });
          var wgot = wa.filter(function (g) { return P.progress[n] && P.progress[n]['game_' + g]; }).length;
          status = wgot === wa.length ? '<span class="status done">✓ ' + esc(T('phonics.done')) + '</span>'
            : (wgot ? '<span class="status part">' + wgot + '/' + wa.length + '</span>' : '<span class="status take">' + esc(T('phonics.new')) + '</span>');
        } else if (partCounts(n, p)) {
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
    if (hasWorksheet(n)) {
      h += '<div class="grp-phonics" style="margin-top:6px"><button type="button" class="next-btn ph-blend-skip" style="display:inline-flex;margin-top:0" onclick="H212Phonics.worksheet(' + n + ')">' + esc(T('phonics.print_btn')) + '</button></div>';
    }
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

  // ── B. Blend it ─────────────────────────────────────
  // A word as tiles (d | o | g). Tap a tile: you hear that one sound (audio/phonics/alone/<sound_no>.m4a, "-2" = the
  // second sound of th / ew...). "Blend" lights the tiles one after another and then says the whole word.
  // The words and their sounds come from the server (P.blend: lesson -> [ [word, [[spelling, sound_no, part], ...]] ]).
  // A round is up to 8 words: this lesson's own words first, then words from earlier lessons.
  var BLEND_MAX = 8;
  function blendPool(n) {
    var out = [];
    Object.keys(P.blend || {}).forEach(function (k) {
      if (+k > n) return;
      P.blend[k].forEach(function (e) {
        out.push({ w: e[0], t: e[1].map(function (x) { return { s: x[0], no: x[1], part: x[2] || 0 }; }), l: +k });
      });
    });
    return out;
  }
  function blendRound(n) {
    var pool = blendPool(n);
    var own = shuffle(pool.filter(function (x) { return x.l === n; }));
    var rest = shuffle(pool.filter(function (x) { return x.l !== n; }));
    return own.concat(rest).slice(0, BLEND_MAX);
  }

  // Plays one clip and calls done() when it has finished (or straight away if it cannot play)
  function playUrl(url, done) {
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    if (!url || typeof Audio === 'undefined') { setTimeout(done, 500); return; }
    var a = new Audio(url), over = false;
    player = a;
    var end = function () { if (over) return; over = true; if (player === a) player = null; done(); };
    a.onended = end;
    a.onerror = end;
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function (e) { if (e && e.name === 'AbortError') return; end(); });
  }
  function aloneUrl(tile) {
    var id = tile.no + (tile.part ? '-' + (tile.part + 1) : '');
    return has(P.audio.alone, id) ? 'audio/phonics/alone/' + id + '.m4a?v=' + (P.audio.v || 0) : '';
  }
  function lit(k) {
    var tiles = document.querySelectorAll('.ph-bt');
    for (var i = 0; i < tiles.length; i++) tiles[i].classList[i === k ? 'add' : 'remove']('is-lit');
  }

  function showBlend(n) {
    stopAudio();
    var l = P.lessons[n];
    if (!l) return showSteps();
    B = { n: n, words: blendRound(n), i: 0, blended: {}, token: 0 };
    if (!B.words.length) return showLesson(n);
    showBlendWord();
  }

  function showBlendWord() {
    var w = B.words[B.i], l = P.lessons[B.n];
    B.token++;
    var last = B.i + 1 >= B.words.length;
    var h = H212UI.qTop({ onclose: 'H212Phonics.lesson(' + B.n + ')', label: T('phonics.back_parts'), index: B.i, total: B.words.length, noScore: true })
      + '<div class="grp-phonics"><div class="q-label">' + esc(T('nav.phonics')) + ' · ' + esc(lessonLabel(l)) + ' · ' + esc(T('phonics.part_blend')) + '</div></div>'
      + '<div class="question-card grp-phonics">'
      + '<div class="ph-blend-hint">' + esc(T('phonics.blend_hint')) + '</div>'
      + '<div class="ph-blend-tiles">';
    w.t.forEach(function (t, k) {
      h += '<button type="button" class="ph-bt" onclick="H212Phonics.blendTile(' + k + ')">' + esc(t.s) + '</button>';
    });
    h += '</div><div class="ph-blend-row">'
      + '<div class="ph-blend-word" id="ph-blend-word">' + (B.blended[w.w] ? esc(w.w) : '') + '</div>'
      + '<button type="button" class="next-btn ph-blend-go" style="display:inline-flex" onclick="H212Phonics.blend()">▶ ' + esc(T('phonics.blend_btn')) + '</button>'
      + '<div class="ph-blend-say" id="ph-blend-say"></div>'
      + '<button type="button" class="next-btn ph-blend-skip" id="next-btn" style="display:inline-flex" onclick="H212Phonics.blendNext()">'
      + esc(last ? T('hw.see_results') : T('phonics.blend_next')) + '</button>'
      + '</div></div>';
    pc().innerHTML = h;
  }

  function blendTile(k) {
    if (!B) return;
    var t = B.words[B.i].t[k];
    if (!t) return;
    B.token++;
    lit(k);
    var done = function () { lit(-1); };
    var url = aloneUrl(t);
    if (url) playUrl(url, done);
    else { playSound(t.no, t.part); setTimeout(done, 900); }       // no bare-sound file: the sound-and-key-word clip
  }

  function blendGo() {
    if (!B) return;
    var w = B.words[B.i], tok = ++B.token;
    function step(k) {
      if (!B || tok !== B.token) return;
      if (k >= w.t.length) {
        lit(-1);
        B.blended[w.w] = true;
        var el = document.getElementById('ph-blend-word');
        if (el) el.textContent = w.w;
        var say = document.getElementById('ph-blend-say');
        if (say) say.textContent = T('phonics.blend_say');
        playWord(w.w);
        return;
      }
      lit(k);
      playUrl(aloneUrl(w.t[k]), function () { setTimeout(function () { step(k + 1); }, 120); });
    }
    step(0);
  }

  function blendNext() {
    if (!B) return;
    if (B.i + 1 < B.words.length) { B.i++; showBlendWord(); window.scrollTo(0, 0); }
    else finishBlend();
  }

  function finishBlend() {
    var total = B.words.length, got = Object.keys(B.blended).length;
    var enough = got * 2 >= total;
    if (enough) save(B.n, 'blend', Math.round(got * 100 / total));
    B.token++;
    stopAudio();
    var h = '<div class="question-card" style="text-align:center">'
      + '<div style="font-size:48px;margin-bottom:16px">' + (enough ? '🎉' : '👆') + '</div>'
      + '<div class="speak-finish-title">' + esc(enough ? T('phonics.finish_title') : T('phonics.blend_more')) + '</div>'
      + '<div class="speak-finish-sub">' + esc(fill(T('phonics.blend_done_sub'), { c: got, t: total })) + '</div>'
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.part(' + B.n + ',\'blend\')">' + esc(T('phonics.again')) + '</button>'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.lesson(' + B.n + ')">' + esc(T('phonics.back_parts')) + '</button>'
      + '</div></div>';
    pc().innerHTML = h;
  }

  // ── D. Read aloud ───────────────────────────────────
  // A word on the screen: the student says it, then checks. Checking uses the browser's speech recognition
  // (the same as the Speaking screens; no audio is stored) or, where there is none (iPhone Chrome), a box the
  // keyboard's 🎤 can fill. Only COMMON words are checked (the mic cannot judge rare words or names): those
  // are a separate "Challenge words" list, tap to hear only. Words that sound the same (to / two) both pass.
  var READ_MAX = 10;
  var NUMBER_WORDS = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12' };
  function readData(n) { return (P.read && P.read[n]) || { w: [], c: [] }; }

  function stopRec() {
    if (R && R.rec) {
      var r = R.rec;
      R.rec = null;
      r.onresult = r.onerror = r.onend = null;
      try { r.abort(); } catch (e) {}
    }
  }

  // Does what was heard (or typed) contain the word, or a word that sounds the same?
  function sameWord(heard, word) {
    var tokens = String(heard).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
    var ok = [word];
    (P.homo || []).forEach(function (g) { if (g.indexOf(word) !== -1) ok = ok.concat(g); });
    if (NUMBER_WORDS[word]) ok.push(NUMBER_WORDS[word]);
    return tokens.some(function (t) { return ok.indexOf(t) !== -1; });
  }

  function showReadMenu(n) {
    stopAudio();
    var l = P.lessons[n], d = readData(n);
    if (!l) return showSteps();
    if (!d.c.length) return showRead(n);                       // only common words: straight in
    if (!d.w.length) return showChallenge(n);                  // only rare words and names
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.lesson(' + n + ')" aria-label="' + esc(T('phonics.back_parts')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(lessonLabel(l)) + ' · ' + esc(T('phonics.part_read')) + '</div>'
      + '<div class="chapter-head-title">' + esc(l.title) + '</div></div></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_read')) + '</div>'
      + '<div class="part-group grp-phonics"><div class="type-grid">'
      + '<div class="type-btn"' + key(0, 'H212Phonics.read(' + n + ')') + '><span class="icon">' + H212UI.icons.speaking + '</span>'
      + '<span class="lbl">' + esc(T('phonics.read_words')) + '</span><span class="sub">' + esc(T('phonics.read_words_sub')) + '</span>'
      + (partDone(n, 'read') ? '<span class="status done">✓ ' + esc(T('phonics.done')) + '</span>' : '<span class="status take">' + esc(T('phonics.new')) + '</span>') + '</div>'
      + '<div class="type-btn"' + key(0, 'H212Phonics.challenge(' + n + ')') + '><span class="icon">' + H212UI.icons.vocabulary + '</span>'
      + '<span class="lbl">' + esc(T('phonics.read_challenge')) + '</span><span class="sub">' + esc(T('phonics.read_challenge_sub')) + '</span></div>'
      + '</div></div>';
    pc().innerHTML = h;
  }

  function showChallenge(n) {
    stopAudio();
    var l = P.lessons[n], d = readData(n);
    var back = d.w.length ? 'H212Phonics.part(' + n + ',\'read\')' : 'H212Phonics.lesson(' + n + ')';
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="' + back + '" aria-label="' + esc(T('phonics.back_parts')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(lessonLabel(l)) + ' · ' + esc(T('phonics.part_read')) + '</div>'
      + '<div class="chapter-head-title">' + esc(T('phonics.read_challenge')) + '</div></div></div>'
      + '<div class="ph-note">' + esc(T('phonics.read_challenge_intro')) + '</div>'
      + '<div class="ph-grid grp-phonics">';
    d.c.forEach(function (c) {
      var shown = c[1] ? c[0].charAt(0).toUpperCase() + c[0].slice(1) : c[0];
      h += '<div class="ph-tile"' + key(0, 'H212Phonics.hearWord(\'' + c[0] + '\')') + '><span class="ph-letter">' + esc(shown) + '</span></div>';
    });
    h += '</div>';
    pc().innerHTML = h;
  }

  function showRead(n) {
    stopAudio();
    var l = P.lessons[n], d = readData(n);
    if (!l || !d.w.length) return showLesson(n);
    R = { n: n, words: shuffle(d.w.slice()).slice(0, READ_MAX), i: 0, tried: {}, rec: null, token: 0 };
    showReadWord();
  }

  function showReadWord() {
    var w = R.words[R.i], l = P.lessons[R.n], d = readData(R.n);
    R.token++;
    var last = R.i + 1 >= R.words.length;
    var back = d.c.length ? 'H212Phonics.part(' + R.n + ',\'read\')' : 'H212Phonics.lesson(' + R.n + ')';
    var h = H212UI.qTop({ onclose: back, label: T('phonics.back_parts'), index: R.i, total: R.words.length, noScore: true })
      + '<div class="grp-phonics"><div class="q-label">' + esc(T('nav.phonics')) + ' · ' + esc(lessonLabel(l)) + ' · ' + esc(T('phonics.part_read')) + '</div></div>'
      + '<div class="question-card grp-phonics">'
      + '<div class="speak-inst">' + esc(T('phonics.read_inst')) + '</div>'
      + '<div class="ph-blend-word" style="margin-bottom:14px">' + esc(w) + '</div>'
      + '<button type="button" class="listen-btn speak-hear" onclick="H212Phonics.hearWord(\'' + w + '\')">' + esc(T('listen.button')) + '</button>'
      + ((typeof H212Listen !== 'undefined' && H212Listen.soundHint) ? H212Listen.soundHint() : '');
    if (SR) {
      h += '<button type="button" class="speak-mic" id="speak-mic" onclick="H212Phonics.readMic()">'
        + '<span class="speak-mic-ico" aria-hidden="true">🎤</span><span id="speak-mic-label">' + esc(T('speak.mic')) + '</span></button>';
    }
    h += '<div class="speak-type" id="speak-type"' + (SR ? ' hidden' : '') + '>'
      + '<div class="speak-type-hint">' + esc(T('phonics.read_type_hint')) + '</div>'
      + '<div class="speak-type-row"><input type="text" id="speak-text" class="speak-text" lang="en-US" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"'
      + ' placeholder="' + esc(T('phonics.read_type_ph')) + '" onkeydown="if(event.key===\'Enter\'){event.preventDefault();H212Phonics.readTyped();}">'
      + '<button type="button" class="speak-check" onclick="H212Phonics.readTyped()">' + esc(T('speak.type_check')) + '</button></div></div>'
      + '<div class="speak-status" id="speak-status" role="status"></div>'
      + '<div class="speak-result" id="speak-result" hidden></div>'
      + '<div class="speak-actions"><button type="button" class="speak-link" onclick="H212Phonics.readSaid()">' + esc(T('phonics.read_said')) + '</button></div>'
      + '<button class="next-btn" id="next-btn" style="display:inline-flex" onclick="H212Phonics.readNext()">' + esc(last ? T('hw.see_results') : T('phonics.blend_next')) + '</button>'
      + '<div class="speak-help"><div class="speak-help-main">' + esc(SR ? T('speak.help_works') : T('speak.help_no_sr')) + '</div>'
      + '<div class="speak-help-privacy">' + esc(T('speak.help_privacy')) + '</div></div>'
      + '</div>';
    pc().innerHTML = h;
    // If the mic is already blocked on this device, say so now
    if (SR && navigator.permissions && navigator.permissions.query) {
      var my = R.token;
      navigator.permissions.query({ name: 'microphone' }).then(function (st) {
        if (!R || R.token !== my || st.state !== 'denied') return;
        var el = document.querySelector('.speak-help-main');
        if (el) el.textContent = T('speak.help_blocked');
      }).catch(function () {});
    }
  }

  function readStatus(msg, isErr) {
    var s = document.getElementById('speak-status');
    if (!s) return;
    s.textContent = msg || '';
    s.classList[isErr ? 'add' : 'remove']('err');
  }
  function readMicOn(on) {
    var b = document.getElementById('speak-mic'), l = document.getElementById('speak-mic-label');
    if (b) b.classList[on ? 'add' : 'remove']('listening');
    if (l) l.textContent = on ? T('speak.mic_stop') : T('speak.mic');
  }

  // The big mic button: first tap starts listening, a second tap means "I am done"
  function readMic() {
    if (!R || !SR) return;
    if (R.rec) { try { R.rec.stop(); } catch (e) {} return; }
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();     // never listen to our own voice
    var my = R.token, rec = new SR(), got = false, err = '';
    rec.lang = 'en-US';
    rec.maxAlternatives = 5;
    rec.interimResults = false;
    rec.continuous = false;
    R.rec = rec;
    var box = document.getElementById('speak-result');
    if (box) { box.hidden = true; box.textContent = ''; }
    readStatus(T('speak.listening'), false);
    readMicOn(true);
    rec.onresult = function (e) {
      if (!R || R.token !== my) return;
      got = true;
      var alts = [], r = e.results[0];
      for (var j = 0; r && j < r.length; j++) alts.push(r[j].transcript);
      readCheck(alts, false);
    };
    rec.onerror = function (e) { err = (e && e.error) || ''; };
    rec.onend = function () {
      if (!R || R.token !== my) return;
      R.rec = null;
      readMicOn(false);
      if (got) return;
      if (err === 'aborted') { readStatus('', false); return; }
      if (err === 'not-allowed' || err === 'service-not-allowed') { readStatus(T('speak.mic_blocked'), true); var tb = document.getElementById('speak-type'); if (tb) tb.hidden = false; }
      else if (err === '' || err === 'no-speech') readStatus(T('speak.no_speech'), true);
      else { readStatus(T('speak.error'), true); var tb2 = document.getElementById('speak-type'); if (tb2) tb2.hidden = false; }
    };
    try { rec.start(); }
    catch (e) { R.rec = null; readMicOn(false); readStatus(T('speak.error'), true); var tb3 = document.getElementById('speak-type'); if (tb3) tb3.hidden = false; }
  }

  function readTyped() {
    if (!R) return;
    var el = document.getElementById('speak-text');
    var text = el ? el.value.replace(/\s+/g, ' ').trim() : '';
    if (!text) { readStatus(T('speak.type_empty'), true); return; }
    readStatus('', false);
    readCheck([text], true);
  }

  function readCheck(alts, typed) {
    var w = R.words[R.i], pass = false, heard = alts[0] || '';
    stopRec();                                  // we have the answer: the mic is done
    readMicOn(false);
    alts.forEach(function (a) { if (a && sameWord(a, w)) { pass = true; heard = a; } });
    if (!heard) { readStatus(T('speak.no_speech'), true); return; }
    readStatus('', false);
    R.tried[w] = true;
    var level = pass ? 'great' : 'try';
    var box = document.getElementById('speak-result');
    if (box) {
      box.className = 'speak-result ' + level;
      box.innerHTML = '<div class="speak-badge ' + level + '">' + (pass ? '🟢 ' + esc(T('speak.great')) : '🔵 ' + esc(T('phonics.read_try'))) + '</div>'
        + '<div class="speak-heard">' + esc(T(typed ? 'speak.you_wrote' : 'speak.heard')) + ' <b>“' + esc(heard) + '”</b></div>'
        + (pass ? '' : '<button type="button" class="speak-retry" onclick="H212Phonics.readMic()">' + esc(T('speak.try_again')) + '</button>');
      box.hidden = false;
    }
    if (pass) playWord(w);
  }

  // "I read it": counts as a try and plays the word
  function readSaid() {
    if (!R) return;
    var w = R.words[R.i];
    stopRec();
    readMicOn(false);
    readStatus('', false);
    R.tried[w] = true;
    playWord(w);
  }

  function readNext() {
    if (!R) return;
    if (R.i + 1 < R.words.length) { R.i++; showReadWord(); window.scrollTo(0, 0); }
    else finishRead();
  }

  function finishRead() {
    var total = R.words.length, got = Object.keys(R.tried).length, enough = got * 2 >= total;
    if (enough) save(R.n, 'read', Math.round(got * 100 / total));
    R.token++;
    stopAudio();
    var d = readData(R.n);
    var h = '<div class="question-card" style="text-align:center">'
      + '<div style="font-size:48px;margin-bottom:16px">' + (enough ? '🎉' : '👆') + '</div>'
      + '<div class="speak-finish-title">' + esc(enough ? T('phonics.finish_title') : T('phonics.read_more')) + '</div>'
      + '<div class="speak-finish-sub">' + esc(fill(T('phonics.read_done_sub'), { c: got, t: total })) + '</div>'
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.read(' + R.n + ')">' + esc(T('phonics.again')) + '</button>'
      + (d.c.length ? '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.challenge(' + R.n + ')">' + esc(T('phonics.read_challenge')) + '</button>' : '')
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.lesson(' + R.n + ')">' + esc(T('phonics.back_parts')) + '</button>'
      + '</div></div>';
    pc().innerHTML = h;
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

  // Two wrong words for `t`, from `pool`: one sound different when possible (cat / cot / cut), never the same sound
  function alike(t, pool) {
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
    return picked;
  }

  // Game 2: hear a word, pick it. Wrong answers differ by one sound when possible (cat / cot / cut).
  function buildWord(n) {
    var pool = poolWords(n);
    if (pool.length < 3) return [];
    var own = shuffle(pool.filter(function (x) { return x.l === n; }));
    var rest = shuffle(pool.filter(function (x) { return x.l !== n; }));
    var qs = [];
    own.concat(rest).slice(0, 10).forEach(function (t) {
      var picked = alike(t, pool);
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
    if (q.audio.sentence) playSentence(q.audio.sentence, q.text);
    else if (q.audio.sound) playSound(q.audio.sound, 0); else playWord(q.audio.word);
  }

  function showQ() {
    var q = G.qs[G.i], l = P.lessons[G.n];
    G.locked = false;
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    var last = G.i + 1 >= G.qs.length;
    var sen = G.game === 'sentence';
    var h = H212UI.qTop({ onclose: sen ? 'H212Phonics.lesson(' + G.n + ')' : 'H212Phonics.listenMenu(' + G.n + ')', label: T(sen ? 'phonics.back_parts' : 'phonics.back_games'), index: G.i, total: G.qs.length, noScore: true })
      + '<div class="grp-phonics"><div class="q-label">' + esc(T('nav.phonics')) + ' · ' + esc(lessonLabel(l)) + ' · ' + esc(sen ? T('phonics.part_sentences') : T('phonics.game_' + G.game)) + '</div></div>'
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
    // say the answer again: the sentence (and show it), the word, or the sound
    if (q.audio.sentence) {
      msg.innerHTML = esc(msg.textContent) + '<br>' + esc(T('phonics.sentence_was')) + ' <b>“' + esc(q.text) + '”</b>';
      playSentence(q.audio.sentence, q.text);
    }
    else if (q.audio.word) playWord(q.audio.word);
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
    var sen = G.game === 'sentence';
    save(G.n, sen ? 'sentences' : 'listen_' + G.game, pct);
    var h = '<div class="question-card" style="text-align:center">'
      + '<div style="font-size:48px;margin-bottom:16px">🎉</div>'
      + '<div class="speak-finish-title">' + esc(T('phonics.finish_title')) + '</div>'
      + '<div class="speak-finish-sub">' + esc(fill(T('phonics.finish_sub'), { c: G.correct, t: G.qs.length })) + '</div>'
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
      + (sen ? '' : '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.game(' + G.n + ',\'' + G.game + '\')">' + esc(T('phonics.again')) + '</button>')
      + (sen ? '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.part(' + G.n + ',\'sentences\')">' + esc(T('phonics.again')) + '</button>'
        + '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.lesson(' + G.n + ')">' + esc(T('phonics.back_parts')) + '</button>'
        : '<button class="next-btn" style="display:inline-flex" onclick="H212Phonics.listenMenu(' + G.n + ')">' + esc(T('phonics.back_games')) + '</button>')
      + '</div></div>';
    pc().innerHTML = h;
    stopAudio();
  }

  // ── E. Listening sentences ──────────────────────────
  // Hear a short sentence (audio/phonics/sentences/<id>.m4a, else the robot voice), then pick the word you heard:
  // 3 words from the same lessons that sound alike. The sentence is hidden until the answer. Sentences come from
  // portal/phonics/phonics-sentences.csv (P.sent: [id, lesson, target, sentence]); only sounds taught by that lesson
  // plus a few sight words are used. A round is up to 6 sentences: this lesson's first, then earlier lessons'.
  var SENT_MAX = 6;
  function sentencePool(n) {
    var words = {};
    P.game.forEach(function (x) { if (x.l <= n) words[x.w] = x; });
    return (P.sent || []).filter(function (r) { return r[1] <= n && words[r[2]]; })
      .map(function (r) { return { id: r[0], l: r[1], t: r[2], s: r[3] }; });
  }
  function buildSentences(n) {
    var pool = poolWords(n), byWord = {};
    pool.forEach(function (x) { byWord[x.w] = x; });
    var all = sentencePool(n);
    var own = shuffle(all.filter(function (x) { return x.l === n; }));
    var rest = shuffle(all.filter(function (x) { return x.l !== n; }));
    var qs = [], used = {};
    own.concat(rest).forEach(function (x) {
      if (qs.length >= SENT_MAX || used[x.t]) return;            // each target word once per round
      var t = byWord[x.t], picked = alike(t, pool);
      if (picked.length < 2) return;
      used[x.t] = true;
      var choices = shuffle([t].concat(picked)).map(function (c) { return c.w; });
      qs.push({ audio: { sentence: x.id }, text: x.s, choices: choices, answer: choices.indexOf(x.t) });
    });
    return qs;
  }
  function playSentence(id, text) {
    if (has(P.audio.sentences, id)) clip('audio/phonics/sentences/' + id + '.m4a?v=' + (P.audio.v || 0), text);
    else clip('', text);
  }
  function startSentences(n) {
    var qs = buildSentences(n);
    if (!qs.length) return showLesson(n);
    G = { n: n, game: 'sentence', qs: qs, i: 0, correct: 0, locked: false };
    showQ();
    window.scrollTo(0, 0);
  }

  // ── G / H / I. Word games: Missing Letters, Word Search, Crossword (wordgames.js) on this lesson's words ──
  // Easy only, kids first. The clue is always the recorded word (audio/phonics/words/<word>.m4a): no reading needed.
  // Words: this lesson's common words first, then earlier lessons'. Optional: they never decide whether a lesson is done.
  var WG = ['missing', 'search', 'cross'];
  var wgCache = {};
  function learnedUnits(n) {
    var seen = {}, out = [];
    knownNos(n).forEach(function (no) { var sp = P.sounds[no].sound; if (!seen[sp]) { seen[sp] = 1; out.push(sp); } });
    return out;
  }
  function learnedLetters(n) {
    var seen = {}, out = '';
    learnedUnits(n).forEach(function (u) { u.split('').forEach(function (c) { if (!seen[c]) { seen[c] = 1; out += c; } }); });
    return out;
  }
  function wordsOrdered(n, minLen, maxLen) {
    var fit = function (x) { return x.l <= n && x.w.length >= minLen && x.w.length <= maxLen; };
    var own = shuffle(P.game.filter(function (x) { return fit(x) && x.l === n; }));
    var rest = shuffle(P.game.filter(function (x) { return fit(x) && x.l !== n; }));
    return own.concat(rest).map(function (x) { return { w: x.w, ja: '', img: '' }; });
  }
  function gameCfg(n, g) {
    var l = P.lessons[n];
    var cfg = {
      group: 'phonics', mode: 'easy', clue: 'sound',
      kicker: lessonLabel(l) + ' (' + lessonBig(l) + ')',
      back: 'H212Phonics.gamesMenu(' + n + ')',
      again: 'H212Phonics.playGame(' + n + ',\'' + g + '\')',
      hear: function (word) { playWord(word); },
      done: function (pct) { save(n, 'game_' + g, pct); }
    };
    if (g === 'missing') {
      // each word cut into its sounds (sh | i | p); the blank is usually the lesson's new sound
      var all = blendPool(n);
      var own = shuffle(all.filter(function (x) { return x.l === n; })), rest = shuffle(all.filter(function (x) { return x.l !== n; }));
      cfg.words = own.concat(rest).map(function (x) { return { w: x.w, units: x.t.map(function (t) { return t.s; }), ja: '', img: '' }; });
      cfg.keepOrder = true;
      cfg.focus = l.kind === 'sound' && P.sounds[l.sound_no] ? P.sounds[l.sound_no].sound : '';
      cfg.unitPool = learnedUnits(n);
    } else if (g === 'search') {
      var size = l.step <= 3 ? 5 : 6;
      cfg.words = wordsOrdered(n, 3, size);
      cfg.search = { size: size, count: size === 5 ? 4 : 5, fill: learnedLetters(n), ordered: true };
    } else {
      cfg.words = wordsOrdered(n, 3, 4);
      cfg.cross = { minLen: 3, maxLen: 4, maxDim: 5, target: 4, least: 3 };
    }
    return cfg;
  }
  function wgAvailable(n, g) {
    var k = n + ':' + g;
    if (wgCache[k] !== undefined) return wgCache[k];
    var ok = false;
    if (typeof H212WordGames === 'undefined' || !P.lessons[n]) { return false; }
    var cfg = gameCfg(n, g);
    if (g === 'missing') ok = cfg.words.length >= 3;
    else if (g === 'search') ok = cfg.words.length >= 4 && !!H212WordGames._makeSearch(cfg.words, 'easy', cfg.search);
    else {
      for (var t = 0; t < 3 && !ok; t++) { var b = H212WordGames._buildCross(cfg.words, 'easy', cfg.cross); ok = !!(b && b.items.length >= 3); }
    }
    wgCache[k] = ok;
    return ok;
  }

  function showGamesMenu(n) {
    stopAudio();
    if (typeof H212WordGames !== 'undefined') H212WordGames.stop();
    var l = P.lessons[n];
    if (!l) return showSteps();
    var h = '<div class="chapter-head">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.lesson(' + n + ')" aria-label="' + esc(T('phonics.back_parts')) + '">' + H212UI.icons.back + '</button>'
      + '<div><div class="chapter-head-kicker">' + esc(lessonLabel(l)) + ' · ' + esc(T('phonics.part_games')) + '</div>'
      + '<div class="chapter-head-title">' + esc(l.title) + '</div></div></div>'
      + '<div class="practice-choose">' + esc(T('phonics.choose_game')) + '</div>'
      + '<div class="part-group grp-phonics"><div class="type-grid">';
    var icons = { missing: 'builder', search: 'vocabulary', cross: 'grammar' };
    WG.forEach(function (g) {
      var ok = wgAvailable(n, g), best = P.progress[n] && P.progress[n]['game_' + g];
      h += '<div class="type-btn' + (ok ? '' : ' empty') + '"' + (ok ? key(0, 'H212Phonics.playGame(' + n + ',\'' + g + '\')') : '') + '>'
        + '<span class="icon">' + H212UI.icons[icons[g]] + '</span>'
        + '<span class="lbl">' + esc(T('spell.game_' + g)) + '</span>'
        + '<span class="sub">' + esc(ok ? T('spell.game_' + g + '_sub') : T('phonics.game_locked')) + '</span>'
        + (ok ? (best ? '<span class="status done">✓ ' + esc(fill(T('phonics.best'), { n: best })) + '</span>' : '<span class="status take">' + esc(T('phonics.new')) + '</span>') : '')
        + '</div>';
    });
    h += '</div></div>';
    pc().innerHTML = h;
  }

  function playGame(n, g) {
    if (WG.indexOf(g) === -1 || !wgAvailable(n, g)) return showGamesMenu(n);
    stopAudio();
    var cfg = gameCfg(n, g), ok = false;
    if (g === 'missing') ok = H212WordGames.missing(cfg);
    else if (g === 'search') ok = H212WordGames.search(cfg);
    else ok = H212WordGames.cross(cfg);
    if (!ok) return showGamesMenu(n);
    window.scrollTo(0, 0);
  }

  // The same three games as an A4 worksheet (teacher reads the words; answers on page 2)
  function showGameSheet(n, g) {
    stopAudio();
    var l = P.lessons[n];
    if (!l || WG.indexOf(g) === -1) return showWorksheet(n);
    var cfg = gameCfg(n, g);
    cfg.imgUrl = null;
    var sheet = H212WordGames.sheet(cfg);
    pc().innerHTML = sheetToolbar(n, g) + (sheet || '<div class="ws-hint">' + esc(T('phonics.game_locked')) + '</div>');
  }
  function sheetToolbar(n, active) {
    function chip(id, label, js) {
      return '<button type="button" class="sp-mode' + (active === id ? ' is-on' : '') + '" aria-pressed="' + (active === id) + '" onclick="' + js + '">' + esc(label) + '</button>';
    }
    var again = active === 'sheet' ? 'H212Phonics.worksheet(' + n + ')' : 'H212Phonics.gameSheet(' + n + ',\'' + active + '\')';
    var chips = chip('sheet', T('phonics.ws_chip_sheet'), 'H212Phonics.worksheet(' + n + ')');
    WG.forEach(function (g) { if (wgAvailable(n, g)) chips += chip(g, T('spell.game_' + g), 'H212Phonics.gameSheet(' + n + ',\'' + g + '\')'); });
    return '<div class="ws-toolbar grp-phonics">'
      + '<button type="button" class="back-btn" onclick="H212Phonics.lesson(' + n + ')" aria-label="' + esc(T('phonics.back_parts')) + '">' + H212UI.icons.back + '</button>'
      + '<button type="button" class="next-btn" style="display:inline-flex;margin-top:0" onclick="window.print()">' + esc(T('phonics.ws_print')) + '</button>'
      + '<button type="button" class="next-btn ph-blend-skip" style="display:inline-flex;margin-top:0" onclick="' + again + '">' + esc(T('phonics.ws_again')) + '</button>'
      + '<div class="pr-chips">' + chips + '</div>'
      + '<div class="ws-hint">' + esc(T('phonics.ws_hint')) + '</div></div>';
  }

  // ── F. Worksheet (print) ────────────────────────────
  // A clean A4 page built from the same word lists as the games: 1 circle the word you hear, 2 read the words,
  // 3 blend lines, 4 which word begins with the sound. "New sheet" makes different questions. The teacher's key is
  // printed small at the bottom. Nothing is saved: it is only a printout.
  var WS_ROWS = 6, WS_WORDS = 24, WS_CHALLENGE = 6;
  function worksheetData(n) {
    var d = readData(n);
    return {
      listen: build(n, 'word').slice(0, WS_ROWS),
      begin: build(n, 'begin').slice(0, WS_ROWS),
      blend: blendRound(n).slice(0, WS_ROWS),
      read: d.w.slice(0, WS_WORDS),
      challenge: d.c.slice(0, WS_CHALLENGE)
    };
  }
  function hasWorksheet(n) {
    var d = worksheetData(n);
    return !!(d.listen.length || d.begin.length || d.blend.length || d.read.length);
  }
  function wsRows(qs) {
    return qs.map(function (q, i) {
      return '<div class="ws-row"><span class="ws-no">' + (i + 1) + '</span>'
        + q.choices.map(function (c) { return '<span class="ws-opt">' + esc(c) + '</span>'; }).join('') + '</div>';
    }).join('');
  }
  function showWorksheet(n) {
    stopAudio();
    var l = P.lessons[n];
    if (!l) return showSteps();
    var d = worksheetData(n), key = [];
    var h = sheetToolbar(n, 'sheet')
      + '<div class="ws-sheet">'
      + '<div class="ws-head"><div class="ws-title"><small>212 English · ' + esc(T('nav.phonics')) + ' · ' + esc(lessonLabel(l)) + '</small>' + esc(l.title) + '</div>'
      + '<div class="ws-fill"><span>' + esc(T('phonics.ws_name')) + '</span><span>' + esc(T('phonics.ws_date')) + '</span></div></div>';
    // Page 1: the two listening exercises (the teacher reads). Page 2: reading and writing.
    if (d.listen.length) {
      h += '<div class="ws-sec"><h3>' + esc(T('phonics.ws_s1')) + '</h3>' + wsRows(d.listen) + '</div>';
      key.push('<b>1.</b> ' + esc(T('phonics.ws_say')) + ': ' + d.listen.map(function (q, i) { return (i + 1) + ' ' + q.choices[q.answer]; }).join(' · '));
    }
    if (d.begin.length) {
      h += '<div class="ws-sec"><h3>' + esc(T('phonics.ws_s2')) + '</h3>' + wsRows(d.begin) + '</div>';
      key.push('<b>2.</b> ' + esc(T('phonics.ws_say_sounds')) + ': ' + d.begin.map(function (q, i) {
        var s = P.sounds[q.audio.sound];
        return (i + 1) + ' “' + esc(s.sound) + '” (' + esc(s.parts[0].key_word) + ') → ' + esc(q.choices[q.answer]);
      }).join(' · '));
    }
    if (d.blend.length) key.push('<b>4.</b> ' + d.blend.map(function (b) { return esc(b.w); }).join(' · '));
    if (key.length) h += '<div class="ws-key"><b>' + esc(T('phonics.ws_key')) + '</b><br>' + key.join('<br>') + '</div>';
    var page2 = '';
    if (d.read.length) {
      page2 += '<div class="ws-sec"><h3>' + esc(T('phonics.ws_s3')) + '</h3><div class="ws-words">'
        + d.read.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>';
      if (d.challenge.length) {
        page2 += '<div class="ws-sub">' + esc(T('phonics.ws_s2c')) + '</div><div class="ws-words ws-challenge">'
          + d.challenge.map(function (c) { return '<span>' + esc(c[1] ? c[0].charAt(0).toUpperCase() + c[0].slice(1) : c[0]) + '</span>'; }).join('') + '</div>';
      }
      page2 += '</div>';
    }
    if (d.blend.length) {
      page2 += '<div class="ws-sec"><h3>' + esc(T('phonics.ws_s4')) + '</h3>'
        + d.blend.map(function (b) {
          return '<div class="ws-blend"><span class="ws-tiles">' + b.t.map(function (t) { return esc(t.s); }).join(' · ') + '</span><span>→</span><span class="ws-line"></span></div>';
        }).join('') + '</div>';
    }
    if (page2) {
      h += '<div class="ws-page2"><div class="ws-head"><div class="ws-title"><small>212 English · ' + esc(T('nav.phonics')) + ' · ' + esc(lessonLabel(l)) + '</small>' + esc(l.title) + '</div>'
        + '<div class="ws-fill"><span>' + esc(T('phonics.ws_name')) + '</span><span>' + esc(T('phonics.ws_date')) + '</span></div></div>' + page2 + '</div>';
    }
    h += '</div>';
    pc().innerHTML = h;
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
      else if (p === 'blend') { showBlend(n); goTop(); }
      else if (p === 'read') { showReadMenu(n); goTop(); }
      else if (p === 'sentences') { startSentences(n); goTop(); }
      else if (p === 'listen') { showListenMenu(n); goTop(); }
      else if (p === 'games') { showGamesMenu(n); goTop(); }
    },
    gamesMenu: function (n) { showGamesMenu(n); goTop(); },
    playGame: playGame,
    gameSheet: function (n, g) { showGameSheet(n, g); goTop(); },
    _gameCfg: gameCfg,
    _wgAvailable: wgAvailable,
    listenMenu: function (n) { showListenMenu(n); goTop(); },
    game: startGame,
    hear: playQ,
    answer: answer,
    next: next,
    tap: tap,
    blend: blendGo,
    read: function (n) { showRead(n); goTop(); },
    challenge: function (n) { showChallenge(n); goTop(); },
    worksheet: function (n) { showWorksheet(n); goTop(); },
    _worksheet: worksheetData,
    hearWord: playWord,
    readMic: readMic,
    readTyped: readTyped,
    readSaid: readSaid,
    readNext: readNext,
    _same: sameWord,
    blendTile: blendTile,
    blendNext: blendNext,
    _blendPool: blendPool,
    _build: build,
    _sentences: buildSentences,
    _sentencePool: sentencePool,
    _state: function () { return P; }
  };
})();

document.addEventListener('DOMContentLoaded', H212Phonics.init);
