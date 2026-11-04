/* 212 Kids - the game engine. Plays one game from games.json (sent by game.php as window.H212_KIDS_GAME).
 *
 * Round types:
 *   yesno  A question with two big answer buttons.
 *          kind "opinion" (default): "Do you like apples?" -> "Yes, I do!" / "No, I don't." Both are right.
 *          kind "fact": "Is it an apple?" -> "Yes, it is!" / "No, it isn't." One is right (`correct`).
 *          yes_label / no_label change the button sentences ("Yes, I am!" ...).
 *          Opinion questions show the child's own avatar: it stands up for Yes and stays sitting for No.
 *          avatar_pose: false (on a question, a round or a game) turns that off.
 *   tap    The lion asks (`english`); the child taps the answer out of 3 (max 4) choices.
 *          show: none | picture | word        what appears big on screen
 *          choice_kind: picture | word | color what the buttons are
 *          read_choices: the lion reads the word buttons aloud (for children who can't read yet)
 *          answer: the right choice (default: the item's word)
 *          after_correct: what the lion says after a right answer ("It's a banana.")
 *   count  "How many bananas?" -> drag or tap fruit into the basket; it counts out loud (`count`: how many).
 *          An extra pops back out: "That's enough! Three bananas!"; after 5 quiet seconds a fruit pulses.
 *   pizza  Pizza Shop. mode "customer": free choice of toppings (child's lines in a higher voice);
 *          mode "shopkeeper": the lion orders, the child finds the topping. Tap or drag onto the pizza.
 *   freeze Freeze Dance: fruit dance to code-made music (music.js); it stops, "Freeze!", tap FREEZE,
 *          tap the fruit the lion names, then "Do you like ___?" (`like`) with the avatar.
 *   missing Missing Letters (word games, tiny): the picture, the word said aloud, ONE letter missing
 *          (`at`: 0 = the first letter), 2 big letter tiles (the right one and `other`).
 *          A play shows first-letter questions first, then last letter, then middle.
 *   search Word Search (word games, tiny): `words` (3) hidden left to right, one per row, in a grid as
 *          wide as the longest word. Pictures above show what to find (tap = hear it). Drag across a word,
 *          or tap its first and last letter. Found = colors + the word said. 15 quiet seconds = a first letter glows.
 *   cross  Crossword (word games, tiny): `words` [across, down] that share a letter. Picture clues (tap = hear).
 *          Every letter is given except 1 per word (Pre-K, K) or 2 (Grade 1+), never the first letter or the
 *          crossing. Letter tiles = that word's missing letters + 1 extra. Across first, then down.
 * Wrong = gentle wiggle + "Try again!" + the question again; after 2 wrong tries the right one glows.
 * game.php already picked this play's questions (per_play for the child's level).
 * Every game ends with 3 stars and the game's sticker, no matter what.
 */
(function () {
  'use strict';

  var G = window.H212_KIDS_GAME;
  var root = document.getElementById('kids-game');
  if (!G || !root) return;

  var INK = '#2B2350';
  var STARS_PER_GAME = 3;

  // ---------- helpers ----------

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function two(en, jp) {
    return '<span class="k-two"><b>' + esc(en) + '</b><small>' + esc(jp) + '</small></span>';
  }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }
  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // ---------- pictures (simple flat cartoons, same look as the menu) ----------

  // The pictures live in pictures.js (shared with the printable worksheets).
  var PICTURES = window.H212_KIDS_PICTURES || {};

  function picture(wordKey, size) {
    var w = G.words[wordKey] || {};
    var label = w.english || wordKey;
    if (w.image) {
      return '<img class="g-pic" src="images/' + esc(w.image) + '" alt="' + esc(label) + '" width="' + size + '" height="' + size + '">';
    }
    // A sticker can be a picture name that isn't a word ("pizza").
    var p = PICTURES[w.picture] || PICTURES[wordKey] || PICTURES.apple;
    return '<svg class="g-pic" width="' + size + '" height="' + size + '" viewBox="' + p[0] + '" role="img" aria-label="' + esc(label) + '">' + p[1] + '</svg>';
  }

  function star(size, cls) {
    return '<svg class="' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 15,9 22.5,9.5 16.8,14.4 18.7,22 12,17.8 5.3,22 7.2,14.4 1.5,9.5 9,9" fill="#FFC933" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }

  // ---------- voice ----------
  // A recorded file (item.audio in games.json, kept in kids/audio/) if there is one; otherwise the browser voice.
  // iPhone/iPad: sound only starts after a tap, which is why the game begins with a big Play button.

  var voice = null;
  function chooseVoice() {
    if (!('speechSynthesis' in window)) return;
    var list = speechSynthesis.getVoices().filter(function (v) { return /^en[-_]US/i.test(v.lang); });
    var liked = ['Samantha', 'Google US English', 'Ava', 'Allison', 'Susan', 'Zira', 'Jenny', 'Aria'];
    for (var i = 0; i < liked.length && !voice; i++) {
      voice = list.filter(function (v) { return v.name.indexOf(liked[i]) !== -1; })[0] || null;
    }
    voice = voice || list[0] || null;
  }
  if ('speechSynthesis' in window) {
    chooseVoice();
    speechSynthesis.onvoiceschanged = chooseVoice;
  }

  var currentAudio = null;
  var lastUtterance = null; // kept so the browser doesn't throw it away mid-sentence (a Chrome bug)
  // asChild: the line is the child's ("I want mushrooms, please!"), spoken in a higher voice than the lion's.
  function say(text, audioFile, asChild) {
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (!done) { done = true; resolve(); }
      }
      // Never let a missing voice stop the game.
      setTimeout(finish, 600 + text.length * 120);
      if (currentAudio) currentAudio.pause();

      function speakNow() {
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = asChild ? 0.9 : 0.85;
        u.pitch = asChild ? 1.6 : 1.1;
        u.volume = 1;
        if (voice) u.voice = voice;
        u.onend = finish;
        u.onerror = finish;
        lastUtterance = u;
        speechSynthesis.resume();
        speechSynthesis.speak(u);
      }
      function robot() {
        if (!('speechSynthesis' in window)) return finish();
        // Safari and Chrome can silently drop a sentence started right after stopping another,
        // so only stop when something is playing, and wait a moment before speaking again.
        // The very first sentence (nothing playing) is spoken at once, inside the child's tap,
        // which iPhone/iPad need before they allow sound.
        if (speechSynthesis.speaking || speechSynthesis.pending) {
          speechSynthesis.cancel();
          setTimeout(speakNow, 150);
        } else {
          speakNow();
        }
      }
      if (audioFile) {
        currentAudio = new Audio('audio/' + audioFile);
        currentAudio.onended = finish;
        currentAudio.play().catch(robot);
      } else {
        robot();
      }
    });
  }

  // ---------- game state ----------

  // Each play takes a random `per_play` questions from the round's pool, so it's different every time.
  var rounds = G.rounds.filter(function (r) { return r.items && r.items.length; }).map(function (r) {
    var items = shuffle(r.items).slice(0, r.per_play || r.items.length);
    if (r.type === 'missing') items.sort(function (a, b) { return missingStep(a) - missingStep(b); });
    return { type: r.type, english: r.english, japanese: r.japanese, avatar_pose: r.avatar_pose, items: items };
  });

  // Missing Letters gets harder inside a play: first letter (0), then the last letter (1), then a middle one (2).
  function missingStep(item) {
    var len = wordText(item.word).length;
    return item.at === 0 ? 0 : (item.at === len - 1 ? 1 : 2);
  }
  var total = rounds.reduce(function (n, r) { return n + r.items.length; }, 0);
  var done = 0;
  var busy = false;

  // The music on/off button (top bar). Freeze Dance has its own beat, so background music waits.
  var musicBtn = window.H212Music && window.H212Music.bg ? window.H212Music.bg.button() : '';
  var hasDance = !!musicBtn && G.rounds.some(function (r) { return r.type === 'freeze'; });
  if (hasDance) window.H212Music.bg.pause();

  function frame(inner, opts) {
    opts = opts || {};
    var dots = '';
    for (var i = 0; i < total; i++) {
      dots += '<span class="g-dot' + (i < done ? ' g-dot-on' : '') + '"></span>';
    }
    root.innerHTML =
      '<div class="g-wrap">' +
      '<div class="g-top">' +
      '<a class="g-round-btn k-press" href="' + esc(G.back) + '" aria-label="Back to the menu">' +
      '<svg width="28" height="28" viewBox="0 0 26 30" aria-hidden="true"><path d="M22 3 L3 15 L22 27Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/></svg></a>' +
      '<div class="g-dots" aria-label="' + done + ' of ' + total + '">' + dots + '</div>' +
      musicBtn +
      (opts.replay ? '<button class="g-round-btn k-press" data-act="replay" aria-label="Hear it again">' +
        '<svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true"><path d="M5 14 H12 L21 6 V30 L12 22 H5Z" fill="' + INK + '"/><path d="M26 12 Q31 18 26 24 M29 8 Q37 18 29 28" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg></button>'
        : '<span class="g-round-spacer"></span>') +
      '</div>' + inner + '</div>';
  }

  function lion(en, jp) {
    return '<div class="g-mike"><img src="lion.svg" alt="Teacher Mike the lion">' +
      '<div class="k-bubble g-bubble"><b>' + esc(en) + '</b><small>' + esc(jp) + '</small></div></div>';
  }

  function setBubble(en, jp) {
    var b = root.querySelector('.g-bubble');
    if (b) b.innerHTML = '<b>' + esc(en) + '</b><small>' + esc(jp) + '</small>';
  }

  function praise() {
    var p = pick(G.praise);
    setBubble(p.english, p.japanese);
    var pop = document.createElement('div');
    pop.className = 'g-star-pop';
    pop.innerHTML = star(90);
    root.querySelector('.g-wrap').appendChild(pop);
    return say(p.english);
  }

  // ---------- screens ----------

  function startScreen() {
    frame('<div class="g-center">' + lion("Let's play!", 'あそぼう！') +
      '<h1 class="k-title">' + esc(G.english) + '</h1><p class="k-sub">' + esc(G.japanese) + '</p>' +
      '<button class="k-big-btn k-green k-press g-play" data-act="start">' +
      '<svg width="30" height="34" viewBox="0 0 26 30" aria-hidden="true"><path d="M4 3 L23 15 L4 27Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/></svg>' +
      two('Play', 'スタート') + '</button>' +
      '<p class="k-gate-note jp">🔊 Turn on sound! おとを だしてね（マナーモードを オフに）</p></div>');
  }

  function roundScreen(r, n) {
    frame('<div class="g-center">' + lion(r.english, r.japanese) +
      '<p class="g-round-label">Round ' + n + ' <small>ラウンド' + n + '</small></p>' +
      '<button class="k-big-btn k-green k-press g-play" data-act="go">' + two('Go!', 'いくよ！') + '</button></div>');
    say(r.english.replace('…', ''));
  }

  function label(item, which) {
    return item[which + '_label'] || G.answers[which];
  }

  // ---------- the child's own avatar: sits on a stool, stands up for "Yes" ----------
  // Lesson 1 in class: "Yes, I do!" = stand up, "No, I don't." = sit down. On screen the avatar does it.

  var AVATAR = { pink: '#FF7DA8', blue: '#4DA3FF', green: '#5CC98B', yellow: '#FFD24D', orange: '#FFB46B', purple: '#C9B8FF' };

  function kidFigure() {
    var c = AVATAR[G.child.color] || AVATAR.blue;
    var line = 'stroke="' + INK + '" stroke-width="6" stroke-linecap="round" fill="none"';
    function face(cy) {
      return '<circle cx="80" cy="' + cy + '" r="32" fill="' + c + '" stroke="' + INK + '" stroke-width="5"/>' +
        '<circle cx="69" cy="' + (cy - 4) + '" r="4.5" fill="' + INK + '"/><circle cx="91" cy="' + (cy - 4) + '" r="4.5" fill="' + INK + '"/>' +
        '<path d="M66 ' + (cy + 8) + ' Q80 ' + (cy + 22) + ' 94 ' + (cy + 8) + '" ' + line + ' stroke-width="4.5"/>';
    }
    var stool = '<g class="g-stool"><path d="M50 180 L44 230 M110 180 L116 230" stroke="#A86E35" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="40" y="168" width="80" height="14" rx="7" fill="#C98A4B" stroke="' + INK + '" stroke-width="4"/></g>';
    var sit = '<g class="g-pose-sit">' +
      '<path d="M68 166 L50 192 V226 M92 166 L110 192 V226" ' + line + ' stroke-width="8"/>' +
      '<path d="M40 228 H54 M106 228 H120" ' + line + ' stroke-width="10"/>' +
      '<rect x="52" y="118" width="56" height="52" rx="18" fill="' + c + '" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M56 130 L46 186 M104 130 L114 186" ' + line + '/>' +
      '<circle cx="46" cy="188" r="6" fill="' + INK + '"/><circle cx="114" cy="188" r="6" fill="' + INK + '"/>' +
      face(88) + '</g>';
    var stand = '<g class="g-pose-stand">' +
      '<path d="M68 136 V224 M92 136 V224" ' + line + ' stroke-width="8"/>' +
      '<path d="M58 228 H72 M88 228 H102" ' + line + ' stroke-width="10"/>' +
      '<path d="M58 90 L34 54 M102 90 L126 54" ' + line + '/>' +
      '<circle cx="33" cy="51" r="6" fill="' + INK + '"/><circle cx="127" cy="51" r="6" fill="' + INK + '"/>' +
      '<rect x="52" y="80" width="56" height="60" rx="18" fill="' + c + '" stroke="' + INK + '" stroke-width="5"/>' +
      face(48) + '</g>';
    return '<div class="g-kid g-kid-sit" aria-hidden="true">' +
      '<svg viewBox="0 0 160 240" width="180" height="270">' + stool + sit + stand + '</svg>' +
      '<span class="g-kid-name">' + esc(G.child.name) + '</span></div>';
  }

  // "stand" = stands up with a small happy bounce; "shrug" = stays sitting with a little shrug.
  function kidPose(pose) {
    var kid = root.querySelector('.g-kid');
    if (!kid) return;
    kid.classList.remove('g-kid-sit', 'g-kid-stand', 'g-kid-shrug');
    void kid.offsetWidth;
    kid.classList.add(pose === 'stand' ? 'g-kid-stand' : 'g-kid-sit');
    if (pose === 'shrug') kid.classList.add('g-kid-shrug');
  }

  // Only opinion questions ("Do you like…?"). avatar_pose: false on a question, round or game turns it off.
  function usesAvatar(item) {
    if (item.kind === 'fact') return false;
    if (item.avatar_pose === false || rounds[ri].avatar_pose === false || G.avatar_pose === false) return false;
    return true;
  }

  function yesnoScreen(item) {
    var yes = label(item, 'yes');
    var no = label(item, 'no');
    var withKid = usesAvatar(item);
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage' + (withKid ? ' g-stage-kid' : '') + '">' + (withKid ? kidFigure() : '') +
      '<div class="g-card g-card-big">' + picture(item.word, 220) + '</div></div>' +
      '<div class="g-answers">' +
      '<button class="g-answer g-yes k-press" data-answer="yes"><span class="g-thumb" aria-hidden="true">👍</span>' + two(yes.english, yes.japanese) + '</button>' +
      '<button class="g-answer g-no k-press" data-answer="no"><span class="g-thumb" aria-hidden="true">👎</span>' + two(no.english, no.japanese) + '</button>' +
      '</div>', { replay: true });
    say(item.english, item.audio);
  }

  function wordText(key) {
    return (G.words[key] && G.words[key].english) || key;
  }

  // A big written word; long words ("strawberry") get slightly smaller letters so they fit.
  function bigWord(key) {
    var text = wordText(key).toLowerCase();
    return '<span class="g-word' + (text.length > 7 ? ' g-word-long' : '') + '">' + esc(text) + '</span>';
  }

  // One answer button: a picture, a big written word, or a color circle.
  function choiceButton(item, key) {
    var kind = item.choice_kind || 'picture';
    var inner;
    if (kind === 'word') {
      inner = bigWord(key);
    } else if (kind === 'color') {
      var c = G.colors[key] || {};
      inner = '<span class="g-color-dot" style="background:' + esc(c.hex || '#ccc') + '"></span>' + two(c.english || key, c.japanese || '');
    } else {
      inner = picture(key, 150);
    }
    return '<button class="g-card g-choice g-choice-' + kind + ' k-press" data-choice="' + esc(key) + '">' + inner + '</button>';
  }

  function tapScreen(item) {
    var show = item.show || 'none';
    var shown = '';
    if (show === 'picture') {
      shown = '<div class="g-card g-card-show">' + picture(item.word, 150) + '</div>';
    } else if (show === 'word') {
      shown = '<div class="g-card g-card-show">' + bigWord(item.word) + '</div>';
    }
    var cards = shuffle(item.choices).map(function (key) { return choiceButton(item, key); }).join('');
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-stage-col">' + shown + '<div class="g-choices">' + cards + '</div></div>', { replay: true });
    askTap(item);
  }

  // Say the question; for read_choices, then read each word button aloud while it lights up.
  function askTap(item) {
    var chain = say(item.english, item.audio);
    if (!item.read_choices) return chain;
    root.querySelectorAll('.g-choice').forEach(function (b) {
      chain = chain.then(function () {
        if (currentItem() !== item || busy) return;
        b.classList.add('g-reading');
        return say(wordText(b.getAttribute('data-choice')) + '?').then(function () { b.classList.remove('g-reading'); });
      });
    });
    return chain;
  }

  // ---------- missing: Missing Letters (word games, tiny) ----------
  // The picture (tap it to hear the word again), the word with ONE empty box, and 2 big letter tiles.
  // Right: the letter drops into the box and the lion says the word. Wrong: wiggle + "Try again!".

  function missingScreen(item) {
    var text = wordText(item.word).toLowerCase();
    var right = text.charAt(item.at);
    var boxes = text.split('').map(function (ch, i) {
      return i === item.at
        ? '<span class="g-miss-box g-miss-blank" aria-label="missing letter">?</span>'
        : '<span class="g-miss-box">' + esc(ch) + '</span>';
    }).join('');
    var tiles = shuffle([right, item.other]).map(function (ch) {
      return '<button class="g-letter-tile k-press" data-letter="' + esc(ch) + '" aria-label="' + esc(ch) + '">' + esc(ch) + '</button>';
    }).join('');
    var r = rounds[ri];
    frame(lion(r.english, r.japanese) +
      '<div class="g-stage g-stage-col">' +
      '<button class="g-card g-card-show g-miss-pic k-press" data-act="replay" aria-label="Hear it again">' + picture(item.word, 140) + '</button>' +
      '<div class="g-miss-word' + (text.length > 5 ? ' g-miss-long' : '') + '">' + boxes + '</div>' +
      '<div class="g-miss-tiles">' + tiles + '</div></div>', { replay: true });
    say((ii === 0 ? r.english + ' ' : '') + item.english, item.audio);
  }

  function answerLetter(tile) {
    var item = currentItem();
    var right = wordText(item.word).toLowerCase().charAt(item.at);
    if (tile.getAttribute('data-letter') !== right) {
      return wrongAnswer(tile, item, '[data-letter="' + right + '"]');
    }
    var box = root.querySelector('.g-miss-blank');
    if (box) {
      box.textContent = right;
      box.classList.remove('g-miss-blank');
      box.classList.add('g-miss-filled');
    }
    rightAnswer(tile, item.english, item.japanese);
  }

  // ---------- search: Word Search (word games, tiny) ----------

  var ws = null;
  var WS_COLORS = ['#FFD24D', '#8ED6A0', '#9FD3FF', '#FFB0C8'];
  var FILL = window.H212KidsPuzzles.FILL;

  // Builds the grid (puzzles.js): one word per row, left to right, the rest random letters.
  function buildSearch(words) {
    var b = window.H212KidsPuzzles.search(words.map(function (k) { return wordText(k).toLowerCase(); }));
    if (b) b.words.forEach(function (w, i) { w.key = words[i]; w.found = false; });
    return b;
  }

  function searchScreen(item) {
    var b = buildSearch(item.words);
    if (!b) return next();
    ws = { item: item, b: b, anchor: null, drag: null, misses: 0, hint: 0 };
    var pics = b.words.map(function (w, i) {
      return '<button class="g-ws-pic k-press" data-wsword="' + i + '" aria-label="' + esc(w.text) + '">' + picture(w.key, 76) + '</button>';
    }).join('');
    var cells = '';
    for (var r = 0; r < b.rows; r++) {
      for (var c = 0; c < b.cols; c++) {
        cells += '<div class="g-ws-cell" data-r="' + r + '" data-c="' + c + '">' + esc(b.grid[r][c]) + '</div>';
      }
    }
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-stage-col"><div class="g-ws-pics">' + pics + '</div>' +
      '<div class="g-ws-grid" style="--cols:' + b.cols + '">' + cells + '</div></div>', { replay: true });
    say(item.english, item.audio);
    searchHint();
  }

  function wsCell(r, c) {
    return root.querySelector('.g-ws-cell[data-r="' + r + '"][data-c="' + c + '"]');
  }

  function wsMark(row, from, to, cls, on) {
    for (var c = Math.min(from, to); c <= Math.max(from, to); c++) {
      var e = wsCell(row, c);
      if (e) e.classList[on ? 'add' : 'remove'](cls);
    }
  }

  // After 15 quiet seconds, the first letter of a word not found yet glows (and its picture).
  function searchHint() {
    if (!ws) return;
    clearTimeout(ws.hint);
    var mine = ws;
    ws.hint = setTimeout(function () {
      if (ws !== mine) return;
      var left = mine.b.words.filter(function (w) { return !w.found; });
      if (!left.length) return;
      var w = left[0];
      var e = wsCell(w.row, w.start);
      if (e) e.classList.add('g-glow');
      var p = root.querySelector('[data-wsword="' + mine.b.words.indexOf(w) + '"]');
      if (p) p.classList.add('g-glow');
    }, 15000);
  }

  // A stretch of one row was chosen (from column a to column b): is it a word?
  function searchPick(row, a, b) {
    var from = Math.min(a, b);
    var to = Math.max(a, b);
    var hit = null;
    ws.b.words.forEach(function (w) {
      if (!w.found && w.row === row && w.start === from && w.start + w.text.length - 1 === to) hit = w;
    });
    if (!hit) {
      ws.misses++;
      wsMark(row, from, to, 'g-ws-bad', true);
      setTimeout(function () { if (ws) wsMark(row, from, to, 'g-ws-bad', false); }, 500);
      return;
    }
    var i = ws.b.words.indexOf(hit);
    hit.found = true;
    root.querySelectorAll('.g-ws-cell.g-glow, .g-ws-pic.g-glow').forEach(function (e) { e.classList.remove('g-glow'); });
    for (var c = from; c <= to; c++) {
      var cell = wsCell(row, c);
      cell.style.background = WS_COLORS[i % WS_COLORS.length];
      cell.classList.add('g-ws-found');
    }
    var pic = root.querySelector('[data-wsword="' + i + '"]');
    if (pic) {
      pic.style.background = WS_COLORS[i % WS_COLORS.length];
      pic.classList.add('g-ws-done');
    }
    var left = ws.b.words.filter(function (w) { return !w.found; }).length;
    var en = hit.text.charAt(0).toUpperCase() + hit.text.slice(1) + '!';
    var jp = (G.words[hit.key] && G.words[hit.key].japanese) || '';
    setBubble(en, jp);
    if (left) {
      say(en);
      searchHint();
      return;
    }
    // All found: one record for the puzzle (tries = 1 + the wrong picks), then praise and go on.
    clearTimeout(ws.hint);
    busy = true;
    saveAnswer(ws.item, Math.min(9, ws.misses + 1));
    say(en).then(praise).then(function () { return wait(400); }).then(next);
  }

  function wsAt(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    el = el && el.closest ? el.closest('.g-ws-cell') : null;
    return el ? [+el.getAttribute('data-r'), +el.getAttribute('data-c')] : null;
  }

  root.addEventListener('pointerdown', function (e) {
    if (!ws || busy || !e.target.closest || !e.target.closest('.g-ws-cell')) return;
    e.preventDefault();
    ws.drag = { start: wsAt(e), last: wsAt(e), moved: false };
  });
  root.addEventListener('pointermove', function (e) {
    if (!ws || !ws.drag || !ws.drag.start) return;
    var at = wsAt(e);
    if (!at || at[0] !== ws.drag.start[0]) return;
    var d = ws.drag;
    wsMark(d.start[0], d.start[1], d.last[1], 'g-ws-sel', false);
    if (at[1] !== d.start[1]) d.moved = true;
    d.last = at;
    wsMark(d.start[0], d.start[1], at[1], 'g-ws-sel', true);
  });
  function wsUp() {
    if (!ws || !ws.drag) return;
    var d = ws.drag;
    ws.drag = null;
    if (!d.start) return;
    wsMark(d.start[0], d.start[1], d.last[1], 'g-ws-sel', false);
    if (busy) return;
    if (d.moved) {
      if (ws.anchor) wsMark(ws.anchor[0], ws.anchor[1], ws.anchor[1], 'g-ws-sel', false);
      ws.anchor = null;
      return searchPick(d.start[0], d.start[1], d.last[1]);
    }
    // A tap: first letter, then last letter (same row). Tapping the same letter again cancels.
    var t = d.start;
    var a = ws.anchor;
    if (a) wsMark(a[0], a[1], a[1], 'g-ws-sel', false);
    ws.anchor = null;
    if (!a || a[0] !== t[0]) {
      ws.anchor = t;
      wsMark(t[0], t[1], t[1], 'g-ws-sel', true);
      return;
    }
    if (a[1] === t[1]) return;
    searchPick(t[0], a[1], t[1]);
  }
  root.addEventListener('pointerup', wsUp);
  root.addEventListener('pointercancel', function () {
    if (ws && ws.drag && ws.drag.start) wsMark(ws.drag.start[0], ws.drag.start[1], ws.drag.last[1], 'g-ws-sel', false);
    if (ws) ws.drag = null;
  });

  // ---------- cross: Crossword (word games, tiny) ----------

  var cw = null;
  var CW_COLORS = ['#FFD24D', '#9FD3FF'];

  // Builds the crossword (puzzles.js): 1 missing letter per word for Pre-K and K, 2 for Grade 1+.
  function buildCross(words) {
    var blanksPer = (G.child.level === 'prek' || G.child.level === 'k') ? 1 : 2;
    var b = window.H212KidsPuzzles.cross(wordText(words[0]).toLowerCase(), wordText(words[1]).toLowerCase(), blanksPer);
    if (b) b.words.forEach(function (w, i) { w.key = words[i]; w.filled = 0; });
    return b;
  }

  function cwCell(rc) {
    return root.querySelector('.g-cw-cell[data-r="' + rc[0] + '"][data-c="' + rc[1] + '"]');
  }

  function crossScreen(item) {
    var b = buildCross(item.words);
    if (!b) return next();
    cw = { item: item, b: b, active: 0, misses: 0, wrongHere: 0 };
    var letters = {};
    var blank = {};
    b.words.forEach(function (w) {
      w.cells.forEach(function (rc, k) {
        letters[rc] = w.text.charAt(k);
        if (w.blanks.indexOf(k) !== -1) blank[rc] = true;
      });
    });
    var cells = '';
    for (var r = 0; r < b.rows; r++) {
      for (var c = 0; c < b.cols; c++) {
        var key = [r, c];
        if (!(key in letters)) {
          cells += '<div class="g-cw-empty"></div>';
        } else {
          cells += '<div class="g-cw-cell' + (blank[key] ? ' g-cw-blank' : '') + '" data-r="' + r + '" data-c="' + c + '">' +
            (blank[key] ? '' : esc(letters[key])) + '</div>';
        }
      }
    }
    var clues = b.words.map(function (w, i) {
      return '<button class="g-cw-clue k-press" data-cwword="' + i + '" aria-label="' + esc(w.text) + '">' +
        '<span class="g-cw-arrow">' + (i === 0 ? '→' : '↓') + '</span>' + picture(w.key, 70) + '</button>';
    }).join('');
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-stage-col"><div class="g-cw-top"><div class="g-cw-clues">' + clues + '</div>' +
      '<div class="g-cw-grid" style="--cols:' + b.cols + '">' + cells + '</div></div>' +
      '<div class="g-cw-tiles"></div></div>', { replay: true });
    crossWord(true);
  }

  // Shows the active word: its clue lights up, its next empty box blinks, its letter tiles appear.
  function crossWord(first) {
    var w = cw.b.words[cw.active];
    root.querySelectorAll('.g-cw-clue').forEach(function (c, i) { c.classList.toggle('g-cw-on', i === cw.active); });
    var need = [];
    w.blanks.forEach(function (k) { if (need.indexOf(w.text.charAt(k)) === -1) need.push(w.text.charAt(k)); });
    var extra = FILL.split('').filter(function (ch) { return w.text.indexOf(ch) === -1; });
    var tiles = shuffle(need.concat(pick(extra))).map(function (ch) {
      return '<button class="g-letter-tile g-cw-tile k-press" data-cwletter="' + esc(ch) + '" aria-label="' + esc(ch) + '">' + esc(ch) + '</button>';
    }).join('');
    root.querySelector('.g-cw-tiles').innerHTML = tiles;
    crossActive();
    say((first ? cw.item.english + ' ' : '') + w.text + '.');
  }

  function crossActive() {
    root.querySelectorAll('.g-cw-active').forEach(function (e) { e.classList.remove('g-cw-active'); });
    var w = cw.b.words[cw.active];
    var k = w.blanks[w.filled];
    if (k === undefined) return;
    var e = cwCell(w.cells[k]);
    if (e) e.classList.add('g-cw-active');
  }

  function crossLetter(tile) {
    var w = cw.b.words[cw.active];
    var k = w.blanks[w.filled];
    var want = w.text.charAt(k);
    if (tile.getAttribute('data-cwletter') !== want) {
      cw.misses++;
      cw.wrongHere++;
      tile.classList.remove('g-wiggle');
      void tile.offsetWidth;
      tile.classList.add('g-wiggle');
      setBubble('Try again!', 'もういちど！');
      say('Try again! ' + w.text + '.');
      if (cw.wrongHere >= 2) {
        var right = root.querySelector('[data-cwletter="' + want + '"]');
        if (right) right.classList.add('g-glow');
      }
      return;
    }
    cw.wrongHere = 0;
    root.querySelectorAll('.g-cw-tile.g-glow').forEach(function (t) { t.classList.remove('g-glow'); });
    var cell = cwCell(w.cells[k]);
    cell.textContent = want;
    cell.classList.remove('g-cw-blank');
    cell.classList.add('g-cw-filled');
    w.filled++;
    if (w.filled < w.blanks.length) return crossActive();
    // The word is done: color it, tick its clue, say it.
    w.cells.forEach(function (rc, k) {
      if (cw.active > 0 && k === w.cross) return; // the crossing box keeps the first word's color
      var e = cwCell(rc);
      if (e) e.style.background = CW_COLORS[cw.active];
    });
    var clue = root.querySelector('[data-cwword="' + cw.active + '"]');
    if (clue) clue.classList.add('g-ws-done');
    var en = w.text.charAt(0).toUpperCase() + w.text.slice(1) + '!';
    setBubble(en, (G.words[w.key] && G.words[w.key].japanese) || '');
    root.querySelectorAll('.g-cw-tile').forEach(function (t) { t.disabled = true; });
    if (cw.active + 1 < cw.b.words.length) {
      busy = true;
      var mine = cw;
      say(en).then(function () { return wait(300); }).then(function () {
        if (cw !== mine) return;
        busy = false;
        cw.active++;
        setBubble(cw.item.english, cw.item.japanese);
        crossWord(false);
      });
      return;
    }
    root.querySelectorAll('.g-cw-active').forEach(function (e) { e.classList.remove('g-cw-active'); });
    busy = true;
    saveAnswer(cw.item, Math.min(9, cw.misses + 1));
    say(en).then(praise).then(function () { return wait(400); }).then(next);
  }

  function endScreen() {
    // Freeze Dance is over: its beat stops and the calm background music may come back.
    if (hasDance) {
      window.H212Music.stop();
      window.H212Music.bg.resume();
    }
    var stars = '';
    for (var i = 0; i < STARS_PER_GAME; i++) stars += star(96, 'g-end-star');
    frame('<div class="g-center">' + lion('You did it!', 'できたね！') +
      '<div class="g-end-stars">' + stars + '</div>' +
      (G.sticker ? '<div class="g-sticker"><span class="g-sticker-pic">' + picture(G.sticker, 90) + '</span>' + two('New sticker!', 'シール ゲット！') + '</div>' : '') +
      '<div class="k-sheet-btns">' +
      '<button class="k-big-btn k-yellow k-press" data-act="again">' + two('Play again', 'もういちど') + '</button>' +
      '<a class="k-big-btn k-green k-press" href="' + esc(G.back) + '">' + two('Back', 'もどる') + '</a>' +
      '</div></div>');
    say('You did it! Three stars!');
    saveFinish();
  }

  // ---------- records for the teacher (the child never sees them) ----------
  // Nothing here ever stops or slows the game: if saving fails, the child just keeps playing.

  function post(data) {
    data.nonce = G.nonce;
    data.child = G.child.id;
    return fetch('save-progress.php', {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  }

  var playId = Promise.resolve(0);
  function saveStart() {
    playId = post({ action: 'start', game: G.id })
      .then(function (d) { return (d && d.play) || 0; })
      .catch(function () { return 0; });
  }

  // tries 1 = right on the first try; glowed = the right answer had to glow.
  function saveAnswer(item, tries) {
    playId.then(function (id) {
      if (id) return post({ action: 'answer', play: id, item: item.id, tries: tries, glowed: tries > 2 });
    }).catch(function () {});
  }

  // Save the stars and sticker. If saving fails the child still sees the reward.
  function saveFinish() {
    playId.then(function (id) {
      return post({ game: G.id, stars: STARS_PER_GAME, play: id || undefined });
    }).catch(function () {});
  }

  // ---------- count: "How many bananas?" -> drag (or tap) fruit into the basket ----------
  // Lesson 2 in class: Fruit Shopping. Each fruit that lands is counted out loud and the number shows
  // big on the basket. Too many? The extra pops back out: "That's enough! Three bananas!"
  // Nothing happening for a while? One fruit gently pulses to show where to start.

  var NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  var HINT_MS = 5000;
  var shop = null;

  var BASKET = '<svg class="g-basket-pic" viewBox="0 0 240 180" aria-hidden="true">' +
    '<path d="M44 84 Q120 -6 196 84" stroke="#A86E35" stroke-width="12" fill="none" stroke-linecap="round"/>' +
    '<path d="M44 84 Q120 -6 196 84" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".35"/>' +
    '<path d="M14 82 H226 L200 172 H40 Z" fill="#D99A55" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
    '<path d="M24 112 H216 M32 142 H208" stroke="#A86E35" stroke-width="6"/>' +
    '<path d="M70 82 L80 172 M120 82 V172 M170 82 L160 172" stroke="#A86E35" stroke-width="6"/>' +
    '<rect x="8" y="72" width="224" height="20" rx="10" fill="#C98A4B" stroke="' + INK + '" stroke-width="6"/></svg>';

  function countScreen(item) {
    var shelf = Math.min(10, item.count + 3);
    var fruits = '';
    for (var i = 0; i < shelf; i++) {
      fruits += '<button class="g-fruit k-press" data-fruit="' + i + '" aria-label="' + esc(wordText(item.word)) + '">' + picture(item.word, 54) + '</button>';
    }
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-shop">' +
      '<div class="g-shelf"><div class="g-shelf-sign">' + picture(item.word, 76) + '</div><div class="g-shelf-items">' + fruits + '</div></div>' +
      '<div class="g-basket g-drop" aria-label="Basket">' + BASKET +
      '<div class="g-basket-fruits"></div><div class="g-basket-num" aria-live="polite">0</div></div>' +
      '</div>', { replay: true });
    shop = { item: item, count: 0, full: false, extra: false, speech: say(item.english, item.audio), hint: 0 };
    shopHint();
  }

  // After a few quiet seconds, the next fruit pulses to show what to do.
  function shopHint() {
    clearTimeout(shop.hint);
    var mine = shop;
    root.querySelectorAll('.g-pulse').forEach(function (f) { f.classList.remove('g-pulse'); });
    shop.hint = setTimeout(function () {
      if (shop !== mine || mine.full) return;
      var f = root.querySelector('.g-fruit:not(.g-gone)');
      if (f) f.classList.add('g-pulse');
    }, HINT_MS);
  }

  function addFruit(el, fly) {
    var s = shop;
    if (!s || el.classList.contains('g-gone')) return;
    var item = s.item;
    if (s.count >= item.count) {
      // One too many: it pops back out, gently. (Not "first try" in the records; nothing bad for the child.)
      s.extra = true;
      el.style.transform = '';
      el.classList.remove('g-wiggle');
      void el.offsetWidth;
      el.classList.add('g-wiggle');
      setBubble("That's enough! " + item.after_correct.english, item.after_correct.japanese);
      s.speech = say("That's enough! " + item.after_correct.english);
      return;
    }
    var basket = root.querySelector('.g-basket');
    var into = root.querySelector('.g-basket-fruits');
    var landed = document.createElement('span');
    landed.className = 'g-landed';
    landed.innerHTML = picture(item.word, 34);
    into.appendChild(landed);
    if (fly) flyTo(el, landed);
    el.classList.add('g-gone');
    el.disabled = true;
    el.style.transform = '';

    s.count++;
    var num = root.querySelector('.g-basket-num');
    num.textContent = s.count;
    num.classList.remove('g-num-pop');
    void num.offsetWidth;
    num.classList.add('g-num-pop');
    basket.classList.add('g-basket-on');
    shopHint();

    if (s.count < item.count) {
      s.speech = say(NUMBER_WORDS[s.count] + '!');
      return;
    }
    // Full: "Three bananas!" Wait until the lion is quiet (extras can still pop back), then praise and go on.
    s.full = true;
    clearTimeout(s.hint);
    setBubble(item.after_correct.english, item.after_correct.japanese);
    s.speech = say(NUMBER_WORDS[s.count] + '!').then(function () { return say(item.after_correct.english); });
    (function waitQuiet(last) {
      last.then(function () { return wait(700); }).then(function () {
        if (shop !== s) return;
        if (s.speech !== last) return waitQuiet(s.speech);
        busy = true;
        root.querySelectorAll('.g-fruit').forEach(function (b) { b.disabled = true; });
        saveAnswer(item, s.extra ? 2 : 1);
        praise().then(function () { return wait(250); }).then(next);
      });
    })(s.speech);
  }

  // A tapped fruit flies from the shelf into the basket.
  function flyTo(from, to) {
    var a = from.getBoundingClientRect();
    var b = to.getBoundingClientRect();
    var ghost = from.querySelector('.g-pic').cloneNode(true);
    ghost.classList.add('g-flying');
    ghost.style.left = a.left + 'px';
    ghost.style.top = a.top + 'px';
    ghost.style.width = a.width * 0.8 + 'px';
    ghost.style.height = a.height * 0.8 + 'px';
    document.body.appendChild(ghost);
    to.style.visibility = 'hidden';
    requestAnimationFrame(function () {
      ghost.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px) scale(.6)';
    });
    setTimeout(function () {
      ghost.remove();
      to.style.visibility = '';
    }, 380);
  }

  // Drag a fruit (into the basket) or a topping (onto the pizza) with a finger or the mouse.
  // A short touch without moving counts as a tap. The drop target is the screen's .g-drop.
  var drag = null;
  function dropped(el, fly) {
    if (el.classList.contains('g-fruit')) addFruit(el, fly);
    else useTopping(el, fly);
  }
  root.addEventListener('pointerdown', function (e) {
    var f = e.target.closest('.g-fruit, .g-topping');
    if (!f || f.disabled || busy) return;
    e.preventDefault();
    drag = { el: f, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    try { f.setPointerCapture(e.pointerId); } catch (err) {}
  });
  root.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    var dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 10) return;
    drag.moved = true;
    drag.el.classList.add('g-dragging');
    drag.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.15)';
    var target = root.querySelector('.g-drop');
    if (target) target.classList.toggle('g-drop-hover', overDrop(e));
  });
  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    d.el.classList.remove('g-dragging');
    var target = root.querySelector('.g-drop');
    if (target) target.classList.remove('g-drop-hover');
    if (cancelled) {
      d.el.style.transform = '';
      return;
    }
    if (!d.moved) return dropped(d.el, true);
    if (overDrop(e)) return dropped(d.el, false);
    d.el.style.transform = ''; // not on the target: it slides back
  }
  root.addEventListener('pointerup', function (e) { endDrag(e, false); });
  root.addEventListener('pointercancel', function (e) { endDrag(e, true); });
  function overDrop(e) {
    var target = root.querySelector('.g-drop');
    if (!target) return false;
    var r = target.getBoundingClientRect();
    var pad = 24;
    return e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad;
  }

  // ---------- pizza: Pizza Shop (Lesson 3). The lion is the shopkeeper. ----------
  // Round 1, mode "customer": the child picks ANY topping. The child's line "I want mushrooms, please!"
  //   (higher voice), the lion "Here you are!", the topping lands on the pizza, the child "Thank you!".
  //   After the level's number of toppings: "I like mushrooms and cheese!" with the child's real choices.
  // Round 2, mode "shopkeeper": the lion orders "Hello! I want corn, please." The child gives the right
  //   topping: "Here you are!" / lion: "Thank you!". Wrong = wiggle and the order again; glow after 2 tries.

  // Where pieces land on the pizza (percent of its size): 3 pieces per topping, up to 5 toppings.
  var PIZZA_SPOTS = [[50, 28], [28, 52], [70, 64], [72, 34], [32, 74], [52, 50], [26, 32], [56, 76], [76, 50],
    [42, 38], [62, 44], [44, 62], [38, 22], [64, 22], [50, 86]];
  var pizza = null;

  function pizzaBase() {
    return '<svg class="g-pizza-pic" viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="46" fill="#E8B465" stroke="' + INK + '" stroke-width="4"/>' +
      '<circle cx="50" cy="50" r="37" fill="#E8453C"/>' +
      '<path d="M20 48 Q26 22 52 17 Q80 22 83 48 Q80 78 52 84 Q24 80 20 48 Z" fill="#FFE27A" opacity=".55"/></svg>';
  }

  function youSay(en, jp) {
    var b = root.querySelector('.g-you-bubble');
    if (b) b.innerHTML = '<b>' + esc(en) + '</b><small>' + esc(jp) + '</small>';
    var you = root.querySelector('.g-you');
    if (you) you.classList.add('g-you-on');
  }

  function pizzaScreen(item) {
    var shopkeeper = item.mode === 'shopkeeper';
    var choices = item.choices;
    if (shopkeeper) {
      // The right topping plus the first others (clearly different), as many as this level sees.
      choices = shuffle(choices.slice(0, Math.max(3, G.pizza.choices)));
    }
    var tray = choices.map(function (w) {
      return '<button class="g-topping k-press" data-top="' + esc(w) + '">' + picture(w, 58) +
        '<span>' + esc(wordText(w)) + '</span></button>';
    }).join('');
    var face = '<svg width="54" height="54" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="' + (AVATAR[G.child.color] || AVATAR.blue) + '" stroke="' + INK + '" stroke-width="6"/>' +
      '<circle cx="42" cy="52" r="7" fill="' + INK + '"/><circle cx="78" cy="52" r="7" fill="' + INK + '"/>' +
      '<path d="M38 74 Q60 96 82 74" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/></svg>';
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-pizzeria">' +
      '<div class="g-pizza g-drop" aria-label="Pizza">' + pizzaBase() + '<div class="g-pizza-tops"></div></div>' +
      '<div class="g-tray">' + tray + '</div></div>' +
      '<div class="g-you">' + face + '<div class="k-bubble g-you-bubble"><b>…</b><small>' + esc(G.child.name) + '</small></div></div>',
      { replay: true });
    pizza = { item: item, picked: [], spot: 0 };
    say(item.english, item.audio);
  }

  // Put 3 pieces of a topping on the pizza.
  function landTopping(el, word, fly) {
    var tops = root.querySelector('.g-pizza-tops');
    var first = null;
    for (var i = 0; i < 3; i++) {
      var at = PIZZA_SPOTS[pizza.spot % PIZZA_SPOTS.length];
      pizza.spot++;
      var piece = document.createElement('span');
      piece.className = 'g-piece';
      piece.style.left = at[0] + '%';
      piece.style.top = at[1] + '%';
      piece.innerHTML = picture(word, 40);
      tops.appendChild(piece);
      first = first || piece;
    }
    el.style.transform = '';
    if (fly) flyTo(el, first);
  }

  // "mushrooms", "mushrooms and cheese", "mushrooms, cheese and corn" (up to 3 by name).
  function joinNames(words) {
    var names = words.slice(0, 3).map(function (w) { return (G.words[w] && G.words[w].plural) || w; });
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function useTopping(el, fly) {
    var p = pizza;
    if (!p || busy) return;
    var item = p.item;
    var word = el.getAttribute('data-top');
    var w = G.words[word] || {};

    if (item.mode === 'shopkeeper') {
      if (word !== item.word) {
        el.style.transform = '';
        return wrongAnswer(el, item, '[data-top="' + item.word + '"]');
      }
      busy = true;
      saveAnswer(item, wrong + 1);
      root.querySelectorAll('.g-topping').forEach(function (b) { b.disabled = true; });
      el.classList.add('g-right');
      landTopping(el, word, fly);
      youSay('Here you are!', 'はい、どうぞ！');
      say('Here you are!', null, true).then(function () {
        setBubble('Thank you!', 'ありがとう！');
        return say('Thank you!');
      }).then(praise).then(function () { return wait(250); }).then(next);
      return;
    }

    // Customer: any topping is fine.
    busy = true;
    if (p.picked.indexOf(word) === -1) p.picked.push(word);
    p.count = (p.count || 0) + 1;
    var plural = w.plural || word;
    youSay('I want ' + plural + ', please!', (w.japanese || '') + 'を ください！');
    say('I want ' + plural + ', please!', null, true).then(function () {
      setBubble('Here you are!', 'はい、どうぞ！');
      landTopping(el, word, fly);
      return say('Here you are!');
    }).then(function () {
      youSay('Thank you!', 'ありがとう！');
      return say('Thank you!', null, true);
    }).then(function () {
      if (pizza !== p) return;
      if (p.count < G.pizza.picks) {
        busy = false;
        var you = root.querySelector('.g-you');
        if (you) you.classList.remove('g-you-on');
        setBubble(item.english, item.japanese);
        return say(item.english, item.audio);
      }
      // The pizza is ready: the lion says what the child likes, naming their real choices.
      var likes = 'I like ' + joinNames(p.picked) + '!';
      var likesJa = p.picked.slice(0, 3).map(function (k) { return (G.words[k] && G.words[k].japanese) || k; }).join('と') + 'が すき！';
      setBubble(likes, likesJa);
      saveAnswer(item, 1);
      return say(likes).then(praise).then(function () { return wait(250); }).then(next);
    });
  }

  // ---------- freeze: Freeze Freeze Dance (Lesson 4) ----------
  // The fruit dance while code-made music plays (5 to 9 seconds). The music stops: "Freeze!" and a
  // colored flash (in case the sound is off). The child taps FREEZE (too early = "Not yet! Keep dancing!"),
  // then taps the fruit the lion names, then answers "Do you like ___?" with the avatar standing or sitting.

  var freeze = null;
  var hasMusic = !!(window.H212Music && window.H212Music.supported());

  function freezeScreen(item) {
    var n = Math.max(3, Math.min(item.dancers.length, G.freeze.dancers));
    var dancers = shuffle(item.dancers.slice(0, n)).map(function (w, i) {
      // The dance moves the inner picture, so a wiggle or glow on the button never jumps it back.
      return '<button class="g-dancer" data-dancer="' + esc(w) + '" disabled><span class="g-dancer-in g-dance-' + (i % 4) + '">' + picture(w, 96) + '</span></button>';
    }).join('');
    frame(lion('Dance!', 'おどろう！') +
      '<div class="g-stage g-stage-col"><div class="g-floor g-floor-' + n + '">' + dancers + '</div>' +
      '<button class="g-freeze-btn k-press" data-act="freeze">' + two('FREEZE!', 'フリーズ！') + '</button></div>',
      { replay: true });
    freeze = { item: item, phase: 'dance', timer: 0 };
    var secs = G.freeze.seconds || [5, 9];
    var ms = 1000 * (secs[0] + Math.random() * (secs[1] - secs[0]));
    if (hasMusic) window.H212Music.start('dance');
    freeze.timer = setTimeout(stopTheMusic, ms);
  }

  function stopTheMusic() {
    var f = freeze;
    if (!f || f.phase !== 'dance') return;
    f.phase = 'frozen';
    if (hasMusic) window.H212Music.stop();
    root.querySelector('.g-floor').classList.add('g-frozen');
    var wrap = root.querySelector('.g-wrap');
    wrap.classList.remove('g-flash');
    void wrap.offsetWidth;
    wrap.classList.add('g-flash');
    root.querySelector('.g-freeze-btn').classList.add('g-freeze-now');
    setBubble('Freeze!', 'フリーズ！');
    say('Freeze!');
  }

  function tapFreeze(btn) {
    var f = freeze;
    if (!f) return;
    if (f.phase === 'dance') {
      // Too early: nothing bad, keep dancing.
      setBubble('Not yet! Keep dancing!', 'まだだよ！おどってね！');
      say('Not yet! Keep dancing!').then(function () {
        if (freeze === f && f.phase === 'dance') setBubble('Dance!', 'おどろう！');
      });
      return;
    }
    if (f.phase !== 'frozen') return;
    f.phase = 'pick';
    btn.classList.add('g-freeze-done');
    btn.disabled = true;
    root.querySelectorAll('.g-dancer').forEach(function (d) { d.disabled = false; });
    setBubble(f.item.english, f.item.japanese);
    say(f.item.english, f.item.audio);
  }

  function tapDancer(el) {
    var f = freeze;
    if (!f || f.phase !== 'pick') return;
    var item = f.item;
    if (el.getAttribute('data-dancer') !== item.word) {
      return wrongAnswer(el, item, '[data-dancer="' + item.word + '"]');
    }
    f.phase = 'like';
    busy = true;
    saveAnswer(item, wrong + 1);
    el.classList.add('g-right');
    root.querySelectorAll('.g-dancer').forEach(function (d) { d.disabled = true; });
    say(item.english).then(function () {
      if (freeze !== f) return;
      wrong = 0;
      busy = false;
      likeStep(item);
    });
  }

  // "Do you like bananas?" with the child's avatar (Prompt A). Both answers are right.
  function likeStep(item) {
    var yes = G.answers.yes;
    var no = G.answers.no;
    var withKid = G.avatar_pose !== false && item.avatar_pose !== false;
    frame(lion(item.like.english, item.like.japanese) +
      '<div class="g-stage' + (withKid ? ' g-stage-kid' : '') + '">' + (withKid ? kidFigure() : '') +
      '<div class="g-card g-card-big">' + picture(item.word, 220) + '</div></div>' +
      '<div class="g-answers">' +
      '<button class="g-answer g-yes k-press" data-like="yes"><span class="g-thumb" aria-hidden="true">👍</span>' + two(yes.english, yes.japanese) + '</button>' +
      '<button class="g-answer g-no k-press" data-like="no"><span class="g-thumb" aria-hidden="true">👎</span>' + two(no.english, no.japanese) + '</button>' +
      '</div>', { replay: true });
    say(item.like.english);
  }

  function answerLike(btn) {
    var picked = btn.getAttribute('data-like');
    var ans = G.answers[picked];
    if (root.querySelector('.g-kid')) kidPose(picked === 'yes' ? 'stand' : 'shrug');
    busy = true;
    btn.classList.add('g-picked');
    root.querySelectorAll('.g-answer').forEach(function (b) { b.disabled = true; });
    setBubble(ans.english, ans.japanese);
    say(ans.english).then(praise).then(function () { return wait(250); }).then(next);
  }

  // ---------- flow ----------

  var ri = 0;
  var ii = 0;
  var wrong = 0;

  function currentItem() {
    return rounds[ri] && rounds[ri].items[ii];
  }

  function showItem() {
    var item = currentItem();
    wrong = 0;
    busy = false;
    if (shop) clearTimeout(shop.hint);
    shop = null;
    pizza = null;
    if (freeze) clearTimeout(freeze.timer);
    freeze = null;
    if (ws) clearTimeout(ws.hint);
    ws = null;
    cw = null;
    if (!item) return endScreen();
    if (rounds[ri].type === 'yesno') yesnoScreen(item);
    else if (rounds[ri].type === 'count') countScreen(item);
    else if (rounds[ri].type === 'pizza') pizzaScreen(item);
    else if (rounds[ri].type === 'freeze') freezeScreen(item);
    else if (rounds[ri].type === 'missing') missingScreen(item);
    else if (rounds[ri].type === 'search') searchScreen(item);
    else if (rounds[ri].type === 'cross') crossScreen(item);
    else tapScreen(item);
  }

  function next() {
    done++;
    ii++;
    if (ii >= rounds[ri].items.length) {
      ri++;
      ii = 0;
      if (ri < rounds.length) return roundScreen(rounds[ri], ri + 1);
    }
    showItem();
  }

  // Right answer: say the full sentence, praise, go on.
  function rightAnswer(el, en, jp) {
    busy = true;
    saveAnswer(currentItem(), wrong + 1);
    el.classList.add(el.classList.contains('g-answer') ? 'g-picked' : 'g-right');
    root.querySelectorAll('.g-answer, .g-choice, .g-letter-tile').forEach(function (b) { b.disabled = true; });
    setBubble(en, jp);
    say(en).then(praise).then(function () { return wait(250); }).then(next);
  }

  // Wrong answer: a gentle wiggle, never a red cross, and the question again.
  // After 2 wrong tries the right one glows.
  function wrongAnswer(el, item, rightSelector) {
    wrong++;
    el.classList.remove('g-wiggle');
    void el.offsetWidth;
    el.classList.add('g-wiggle');
    setBubble('Try again!', 'もういちど！');
    say('Try again! ' + item.english).then(function () {
      if (currentItem() === item && !busy) setBubble(item.english, item.japanese);
    });
    if (wrong >= 2) {
      var right = root.querySelector(rightSelector);
      if (right) right.classList.add('g-glow');
    }
  }

  function answerYesNo(btn) {
    var item = currentItem();
    var picked = btn.getAttribute('data-answer');
    var ans = label(item, picked);
    if (item.kind === 'fact' && picked !== item.correct) {
      return wrongAnswer(btn, item, '[data-answer="' + item.correct + '"]');
    }
    if (usesAvatar(item)) kidPose(picked === 'yes' ? 'stand' : 'shrug');
    // A fact answer also says the whole sentence: "No, it isn't. It's a banana."
    var after = item.kind === 'fact' && item.after_correct ? item.after_correct : null;
    rightAnswer(btn, ans.english + (after ? ' ' + after.english : ''), ans.japanese + (after ? ' ' + after.japanese : ''));
  }

  function answerTap(card) {
    var item = currentItem();
    var answer = item.answer || item.word;
    if (card.getAttribute('data-choice') === answer) {
      var after = item.after_correct || { english: item.english, japanese: item.japanese };
      return rightAnswer(card, after.english, after.japanese);
    }
    wrongAnswer(card, item, '[data-choice="' + answer + '"]');
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-act');
    if (act === 'start') {
      // The Play tap also wakes up the music maker (iPhone/iPad only allow sound after a tap).
      if (hasMusic) window.H212Music.unlock();
      saveStart();
      if (rounds.length > 1) return roundScreen(rounds[0], 1);
      return showItem();
    }
    if (act === 'go') return showItem();
    if (act === 'again') return location.reload();
    if (act === 'replay') {
      var item = currentItem();
      if (item && !busy) {
        if (rounds[ri].type === 'tap') askTap(item);
        else if (freeze && freeze.phase === 'like') say(item.like.english);
        else if (freeze && freeze.phase !== 'pick') say(freeze.phase === 'dance' ? 'Dance!' : 'Freeze!');
        else if (cw) say(cw.b.words[cw.active].text + '.');
        else say(item.english, item.audio);
      }
      return;
    }
    if (act === 'freeze') return tapFreeze(b);
    if (busy) return;
    if (b.hasAttribute('data-answer')) return answerYesNo(b);
    if (b.hasAttribute('data-choice')) return answerTap(b);
    if (b.hasAttribute('data-dancer')) return tapDancer(b);
    if (b.hasAttribute('data-like')) return answerLike(b);
    if (b.hasAttribute('data-letter')) return answerLetter(b);
    if (b.hasAttribute('data-cwletter') && cw) return crossLetter(b);
    if (b.hasAttribute('data-cwword') && cw) return say(cw.b.words[+b.getAttribute('data-cwword')].text);
    if (b.hasAttribute('data-wsword') && ws) {
      var w = ws.b.words[+b.getAttribute('data-wsword')];
      if (w) say(w.text);
    }
  });

  startScreen();
})();
