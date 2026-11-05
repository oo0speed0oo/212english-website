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
 *   memory Memory (Batch 2): flip 2 cards to find a pair. `words` + `match` picture | word, or `pairs`
 *          [["red", "apple"]]. Board size by level (boards.memory = pairs). Mismatches flip back; nothing else.
 *   bubble Pop it: bubbles with pictures float up slowly and come back from the bottom; pop the one the lion
 *          says (`word`). The others are other words of the round (boards.bubbles = how many). No timer.
 *   oddout Odd one out: 4 pictures (`choices`); tap the one that doesn't belong (`answer`, `after_correct`).
 *   match  Match it: drag each picture onto its pair: `mode` shadow (its gray shadow) | word, or `pairs`
 *          (drag the apple onto red). Tap a picture, then its pair, works too. Wrong = it slides back.
 *   sort   Sort it: 2 baskets (`groups`); drag each picture into the right one ("Apple! Fruit!").
 *   hidden Find it: a picnic picture with things around it; "Find the banana!" for each word in `find`
 *          (boards.hidden), among `others` (boards.hidden_things in all). A few are half behind leaves.
 *   pick   Pick the written answer (Batch 3): the lion asks, the child taps the written sentence (`choices`,
 *          `answer` = one sentence or a list of right ones). show: picture | count (`count` pictures).
 *          boards.read_choices (Pre-K, K): the lion reads the sentences aloud.
 *   say    Say it (Batch 4): the word, then "Your turn!". The microphone is OFF until a grown-up turns it on
 *          (this device). Fuzzy and kind ("Oh, it's close!"); nothing is recorded or graded. "I said it!" always works.
 *   elf    Elf Workshop: "Can I have a red ball, please?" -> tap it (`word` + `color`; `choices` = picture names
 *          like ball_blue; boards.elf). The child says "Yes, you may! Here you are!".
 *   wish   Dear Santa: tap presents for your letter (boards.wish; boards.wish_toys to pick from). "I want a robot!"
 *   present Pass the Present: unwrap `layers` (boards.present): "What color is the paper?", then the `toy`: "What is it?".
 *   sounds / listen / blend  ABC phonics (Batch 5; sound files = the adult phonics files, game.php sends G.phonics):
 *          sounds = tap each letter to hear it; listen = hear a sound, tap the letter; blend = tap each letter, then Blend.
 *          A bubble with `sound` pops letters: the lion plays the sound.
 *   yesno with `sack`: Santa's Sack. The picture is a shadow in the sack until it is answered.
 * Board games (memory, match, sort, hidden, search, cross, wish, present, sounds, blend) save one record per board: tries = misses + 1.
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

  // ---------- voice (one voice at a time) ----------
  // Every line is looked up in audio/voices.json (made by _work/kids/audio/kids-voices/): Kokoro files,
  // "lion" = Teacher Mike, "girl" = the customer, the child's own lines and other characters.
  // A line with no file of its own is split into sentences ("Try again! How many apples?"); if every
  // sentence has a file they play one after another. Only when a file is missing: the browser voice.
  // Mike's own recordings later simply replace the files (same names).
  // One player is used for everything (iPhone/iPad only allow sound after a tap: the Play button unlocks it).
  // A new line always stops the old one; the same line asked for again while it plays is not restarted.

  var VOICES = G.voices || {};
  var VOICE_V = G.voice_v || 0;
  var player = new Audio();
  player.preload = 'auto';
  var job = null;

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

  function voiceKey(text) {
    return String(text).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function voiceFile(text, role) {
    var k = voiceKey(text);
    if (!k) return null;
    var other = role === 'girl' ? 'lion' : 'girl';
    var f = (VOICES[role] || {})[k] || (VOICES[other] || {})[k];
    return f ? 'audio/' + f + '.m4a?v=' + VOICE_V : null;
  }
  // The files for a line: the whole line, or each of its sentences. null = use the browser voice.
  function voiceFiles(text, role) {
    var whole = voiceFile(text, role);
    if (whole) return [whole];
    var parts = String(text).match(/[^.!?…]+[.!?…]*/g) || [];
    var files = [];
    for (var i = 0; i < parts.length; i++) {
      if (!voiceKey(parts[i])) continue;
      var f = voiceFile(parts[i], role);
      if (!f) return null;
      files.push(f);
    }
    return files.length ? files : null;
  }

  var silent = 'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
  // Inside the first tap (Play): lets this page play sound later (iPhone/iPad).
  function unlockVoice() {
    try {
      player.src = silent;
      var p = player.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
    if ('speechSynthesis' in window) {
      try { speechSynthesis.speak(new SpeechSynthesisUtterance(' ')); } catch (e) {}
    }
  }

  function stopVoice() {
    if (job) job.stopped = true;
    job = null;
    try { player.pause(); } catch (e) {}
    player.onended = player.onerror = null;
    if ('speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
  }

  var lastUtterance = null; // kept so the browser doesn't throw it away mid-sentence (a Chrome bug)
  // Plays a list of urls on the one player; if one can't play, `fallback` is spoken by the browser voice.
  // A line that is stopped by a newer line never "finishes" (so nothing waiting for it moves on twice).
  function playJob(key, urls, fallback, asChild) {
    if (job && !job.stopped && job.key === key) return job.promise;
    stopVoice();
    var me = { key: key, stopped: false };
    job = me;
    me.promise = new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done || me.stopped) return;
        done = true;
        if (job === me) job = null;
        resolve();
      }
      // Never let a missing voice stop the game.
      setTimeout(finish, 1500 + String(fallback || '').length * 140 + urls.length * 800);
      function robot() {
        if (me.stopped) return;
        if (!fallback || !('speechSynthesis' in window)) return finish();
        player.onended = player.onerror = null;
        var u = new SpeechSynthesisUtterance(fallback);
        u.lang = 'en-US';
        u.rate = asChild ? 0.9 : 0.85;
        u.pitch = asChild ? 1.6 : 1.1;
        if (voice) u.voice = voice;
        u.onend = finish;
        u.onerror = finish;
        lastUtterance = u;
        // Safari and Chrome can drop a sentence started right after stopping another: wait a moment.
        setTimeout(function () {
          if (me.stopped) return;
          speechSynthesis.resume();
          speechSynthesis.speak(u);
        }, speechSynthesis.speaking ? 150 : 0);
      }
      var i = 0;
      function playNext() {
        if (me.stopped) return;
        if (i >= urls.length) return finish();
        player.onended = function () { i++; playNext(); };
        player.onerror = robot;
        player.src = urls[i];
        var p = player.play();
        if (p && p.catch) p.catch(robot);
      }
      if (urls.length) playNext();
      else robot();
    });
    return me.promise;
  }

  // asChild: a line said by the child or the customer (the girl voice).
  function say(text, audioFile, asChild) {
    var role = asChild ? 'girl' : 'lion';
    var files = voiceFiles(text, role);
    if (!files && audioFile) files = ['audio/' + audioFile];
    return playJob(role + ':' + voiceKey(text), files || [], text, asChild);
  }

  // ---------- game state ----------

  // Each play takes a random `per_play` questions from the round's pool, so it's different every time.
  var rounds = G.rounds.filter(function (r) { return r.items && r.items.length; }).map(function (r) {
    var items = shuffle(r.items).slice(0, r.per_play || r.items.length);
    if (r.type === 'missing') items.sort(function (a, b) { return missingStep(a) - missingStep(b); });
    return { type: r.type, english: r.english, japanese: r.japanese, avatar_pose: r.avatar_pose, items: items, all: r.items };
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

  // Every screen: the top bar, then a body that always fits the screen (no scrolling).
  // opts.fill: the screen fills all the room (Pop it, Find it); otherwise it is shrunk to fit when needed.
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
      '</div><div class="g-body"><div class="g-fit' + (opts.fill ? ' g-fill' : '') + '">' + inner + '</div></div></div>';
    fit();
  }

  // ---------- screen fit: shrink the screen's content until it fits (iPad, iPhone, any window) ----------
  var FIT = 1;
  var fitTimer = 0;
  function fit() {
    var body = root.querySelector('.g-body');
    var f = root.querySelector('.g-fit');
    if (!body || !f) return;
    f.style.zoom = '';
    FIT = 1;
    if (f.classList.contains('g-fill')) return;
    var z = Math.min(1, body.clientHeight / Math.max(1, f.scrollHeight), body.clientWidth / Math.max(1, f.scrollWidth));
    if (z < 1) {
      FIT = Math.max(0.45, Math.floor(z * 100) / 100);
      f.style.zoom = String(FIT);
    }
  }
  function refit() {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fit, 60);
  }
  window.addEventListener('resize', refit);
  window.addEventListener('load', refit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  // A picture (the lion) that arrives late changes the size: fit again.
  root.addEventListener('load', refit, true);
  window.addEventListener('orientationchange', refit);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', refit);
  // Something was added to the screen (the next question's buttons, a pop-up bubble): fit again.
  if (window.MutationObserver) {
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var t = list[i].target;
        if (t.nodeType === 1 && t.closest && (t.closest('.g-bubble') || t.closest('.g-you-bubble') || t.closest('.g-bub-sky'))) continue;
        return refit();
      }
    }).observe(root, { childList: true, subtree: true });
  }

  // ---------- the GOAL BAR on top of every game ----------
  // Who speaks (the lion, or the customer), one short sentence, an optional goal picture, and the child.
  // Tap it: hear it again. opts: pic (the goal picture), ask (a "?" listen button), who ('girl' = the customer),
  // nokid (the child is already big on the screen).
  var CUSTOMER = '<svg class="g-goal-who" viewBox="0 0 120 120" aria-hidden="true">' +
    '<path d="M18 70 Q14 18 60 14 Q106 18 102 70 L104 104 H16Z" fill="#7A4A2B" stroke="' + INK + '" stroke-width="5"/>' +
    '<circle cx="60" cy="62" r="36" fill="#FFD9B8" stroke="' + INK + '" stroke-width="5"/>' +
    '<path d="M26 54 Q40 24 70 30 Q90 34 94 54 Q74 40 52 46 Q36 50 26 54Z" fill="#7A4A2B"/>' +
    '<circle cx="47" cy="64" r="5" fill="' + INK + '"/><circle cx="73" cy="64" r="5" fill="' + INK + '"/>' +
    '<circle cx="38" cy="76" r="6" fill="#FF9EB5" opacity=".7"/><circle cx="82" cy="76" r="6" fill="#FF9EB5" opacity=".7"/>' +
    '<path d="M48 80 Q60 92 72 80" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<circle cx="92" cy="30" r="9" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/></svg>';
  var ASK = '<span class="g-ask-q" aria-hidden="true">?</span>';

  function lion(en, jp, opts) {
    opts = opts || {};
    var who = opts.who === 'girl' ? CUSTOMER : '<img class="g-goal-who" src="lion.svg" alt="Teacher Mike the lion">';
    return '<div class="g-goal g-mike' + (opts.who === 'girl' ? ' g-goal-girl' : '') + '">' +
      '<button type="button" class="g-goal-say" data-act="replay" aria-label="Hear it again">' + who +
      '<span class="k-bubble g-bubble"><b>' + esc(en) + '</b><small>' + esc(jp) + '</small></span></button>' +
      (opts.ask ? '<button type="button" class="g-ask k-press" data-act="replay" aria-label="Hear it again">' + ASK + '</button>' : '') +
      (opts.pic ? '<div class="g-goal-pic" aria-hidden="true">' + opts.pic + '</div>' : '') +
      (opts.nokid ? '' : meFigure()) +
      '</div>';
  }

  function setBubble(en, jp) {
    var b = root.querySelector('.g-bubble');
    if (b) b.innerHTML = '<b>' + esc(en) + '</b><small>' + esc(jp) + '</small>';
  }

  // The "?" listen button: after a pick it shows what the child picked, with a check ("Good!") or a
  // gentle wiggle ("Try again!") and then the "?" again.
  function setAsk(inner, state) {
    var a = root.querySelector('.g-ask');
    if (!a) return;
    a.classList.remove('g-ask-good', 'g-ask-try', 'g-wiggle');
    a.innerHTML = inner || ASK;
    if (state) {
      void a.offsetWidth;
      a.classList.add(state === 'good' ? 'g-ask-good' : 'g-ask-try');
      if (state === 'try') a.classList.add('g-wiggle');
    }
    if (state === 'try') {
      var mine = currentItem();
      setTimeout(function () {
        if (currentItem() === mine && !busy && a.isConnected) setAsk(null, null);
      }, 1400);
    }
  }
  function askLabel(inner, good) {
    return '<span class="g-ask-pick">' + inner + '</span><span class="g-ask-tag">' + (good ? '✓ Good!' : 'Try again!') + '</span>';
  }

  // ---------- the child's own character: always on screen (in the goal bar), idling and reacting ----------
  // G.child.avatar is where the "create a character" choices will go (face, color, ears, one accessory);
  // today only the color is used.
  function meFigure() {
    var look = G.child.avatar || {};
    var c = AVATAR[look.color || G.child.color] || AVATAR.blue;
    return '<div class="g-me" aria-hidden="true"><svg viewBox="0 0 120 130" class="g-me-svg">' +
      '<g class="g-me-arms"><path d="M30 92 L12 70 M90 92 L108 70" stroke="' + INK + '" stroke-width="7" stroke-linecap="round" fill="none"/>' +
      '<circle cx="11" cy="68" r="6" fill="' + INK + '"/><circle cx="109" cy="68" r="6" fill="' + INK + '"/></g>' +
      '<rect x="28" y="80" width="64" height="46" rx="20" fill="' + c + '" stroke="' + INK + '" stroke-width="5"/>' +
      '<circle cx="60" cy="48" r="34" fill="' + c + '" stroke="' + INK + '" stroke-width="5"/>' +
      '<g class="g-me-eyes"><circle cx="48" cy="44" r="5" fill="' + INK + '"/><circle cx="72" cy="44" r="5" fill="' + INK + '"/></g>' +
      '<path class="g-me-mouth" d="M46 58 Q60 72 74 58" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '</svg><span class="g-me-name">' + esc(G.child.name) + '</span></div>';
  }
  // mood: 'cheer' (right), 'shrug' (try again), 'dance' (Freeze Dance music), 'still' (frozen).
  function me(mood) {
    var m = root.querySelector('.g-me');
    if (!m) return;
    if (mood === 'dance' || mood === 'still') {
      m.classList.toggle('g-me-dance', mood === 'dance');
      return;
    }
    m.classList.remove('g-me-cheer', 'g-me-shrug');
    void m.offsetWidth;
    m.classList.add(mood === 'cheer' ? 'g-me-cheer' : 'g-me-shrug');
  }

  function praise() {
    var p = pick(G.praise);
    me('cheer');
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

  // A big smiling face (Yes) and a sad face (No), drawn in code.
  function faceSvg(mood, size) {
    var happy = mood === 'happy';
    return '<svg class="g-face" width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="44" fill="' + (happy ? '#FFD24D' : '#9FD3FF') + '" stroke="' + INK + '" stroke-width="6"/>' +
      '<circle cx="35" cy="42" r="6" fill="' + INK + '"/><circle cx="65" cy="42" r="6" fill="' + INK + '"/>' +
      (happy ? '<path d="M30 60 Q50 82 70 60" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/>'
        : '<path d="M32 72 Q50 56 68 72" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/>') + '</svg>';
  }
  var FACES = '<span class="g-faces">' + faceSvg('happy', 60) + faceSvg('sad', 60) + '</span>';

  // The two answer buttons. Opinion ("Do you like…?"): smiling face = Yes, sad face = No. Facts: 👍 👎.
  function yesNoButtons(yes, no, attr, faces) {
    return '<div class="g-answers">' +
      '<button class="g-answer g-yes k-press" ' + attr + '="yes">' + (faces ? faceSvg('happy', 64) : '<span class="g-thumb" aria-hidden="true">👍</span>') + two(yes.english, yes.japanese) + '</button>' +
      '<button class="g-answer g-no k-press" ' + attr + '="no">' + (faces ? faceSvg('sad', 64) : '<span class="g-thumb" aria-hidden="true">👎</span>') + two(no.english, no.japanese) + '</button>' +
      '</div>';
  }

  function yesnoScreen(item) {
    var yes = label(item, 'yes');
    var no = label(item, 'no');
    var withKid = usesAvatar(item);
    var opinion = item.kind !== 'fact';
    frame(lion(item.english, item.japanese, { pic: opinion ? FACES : '', nokid: withKid }) +
      '<div class="g-stage' + (withKid ? ' g-stage-kid' : '') + '">' + (withKid ? kidFigure() : '') +
      '<div class="g-card g-card-big' + (item.sack ? ' g-sack g-shadow' : '') + '">' + picture(item.word, 220) + '</div></div>' +
      yesNoButtons(yes, no, 'data-answer', opinion), { replay: true });
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

  // extra: a class for the choices (oddout: 'g-odd' = 4 in a row, or 2 × 2 on a narrow screen).
  // show "none" = a listening question: the goal bar has the "?" button (hear the word again) and does not
  //   write the word. show "shadow" = the picture is a dark shadow until it is answered (December: guess it!).
  // Odd one out kinds: "category" ("Which ones are the fruits?" tap every right one: `answer` is a list),
  //   "color" ("Which one is green?" a color swatch in the goal bar), or the old "which one is different?".
  function isListening(item) {
    return rounds[ri].type === 'tap' && (item.show || 'none') === 'none';
  }
  function tapScreen(item, extra) {
    var show = item.show || 'none';
    var shown = '';
    if (show === 'picture' || show === 'shadow') {
      shown = '<div class="g-card g-card-show' + (show === 'shadow' ? ' g-sack g-shadow' : '') + '">' + picture(item.word, 150) + '</div>';
    } else if (show === 'word') {
      shown = '<div class="g-card g-card-show">' + bigWord(item.word) + '</div>';
    }
    var cards = shuffle(item.choices).map(function (key) { return choiceButton(item, key); }).join('');
    var opts = {};
    var en = item.english;
    var jp = item.japanese;
    if (isListening(item)) {
      opts.ask = true;
      en = rounds[ri].english;
      jp = rounds[ri].japanese;
    }
    if (item.kind === 'color' && G.colors[item.color]) {
      opts.pic = '<span class="g-swatch" style="background:' + esc(G.colors[item.color].hex || '#ccc') + '"></span>';
    }
    if (item.kind === 'category') {
      var n = [].concat(item.answer).length;
      var marks = '';
      for (var i = 0; i < n; i++) marks += '<span class="g-cat-mark"></span>';
      opts.pic = '<span class="g-cat-marks">' + marks + '</span>';
      cat = { item: item, found: [] };
    }
    frame(lion(en, jp, opts) +
      '<div class="g-stage g-stage-col">' + shown + '<div class="g-choices' + (extra ? ' ' + extra : '') + '">' + cards + '</div></div>', { replay: true });
    askTap(item);
  }
  var cat = null;

  // "Which ones are the fruits?": every right one glows green and is said; the last one finishes.
  function answerCategory(card) {
    var c = cat;
    var item = c.item;
    var key = card.getAttribute('data-choice');
    var right = [].concat(item.answer);
    if (right.indexOf(key) === -1) {
      var left = right.filter(function (k) { return c.found.indexOf(k) === -1; });
      return wrongAnswer(card, item, left.map(function (k) { return '[data-choice="' + k + '"]'; }).join(','));
    }
    if (c.found.indexOf(key) !== -1) return;
    c.found.push(key);
    card.classList.remove('g-glow');
    card.classList.add('g-right');
    card.disabled = true;
    var mark = root.querySelectorAll('.g-cat-mark')[c.found.length - 1];
    if (mark) mark.innerHTML = picture(key, 40);
    if (c.found.length < right.length) return say(cap(wordText(key)) + '!');
    var after = item.after_correct || { english: item.english, japanese: item.japanese };
    say(cap(wordText(key)) + '!').then(function () {
      if (cat === c) rightAnswer(card, after.english, after.japanese);
    });
    busy = true;
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
    var goal = countGoal(item);
    frame(lion(goal.english, goal.japanese, { pic: '<span class="g-goal-num">' + item.count + '</span>' + picture(item.word, 54) }) +
      '<div class="g-stage g-shop">' +
      '<div class="g-shelf"><div class="g-shelf-sign">' + picture(item.word, 76) + '</div><div class="g-shelf-items">' + fruits + '</div></div>' +
      '<div class="g-basket g-drop" aria-label="Basket">' + BASKET +
      '<div class="g-basket-fruits"></div><div class="g-basket-num" aria-live="polite"><b>0</b><small>of ' + item.count + '</small></div></div>' +
      '</div>', { replay: true });
    shop = { item: item, count: 0, full: false, extra: false, speech: say(goal.spoken), hint: 0 };
    shopHint();
  }

  // The goal: "Put 3 bananas in the basket!" (the voice says "three").
  function countGoal(item) {
    var w = G.words[item.word] || {};
    var name = item.count === 1 ? (w.english || item.word) : (w.plural || w.english || item.word);
    return {
      english: 'Put ' + item.count + ' ' + name + ' in the basket!',
      spoken: 'Put ' + NUMBER_WORDS[item.count] + ' ' + name + ' in the basket!',
      japanese: (w.japanese || '') + 'を ' + item.count + 'こ かごに いれてね！'
    };
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
    num.querySelector('b').textContent = s.count;
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
    drag.el.style.transform = 'translate(' + dx / FIT + 'px,' + dy / FIT + 'px) scale(1.15)';
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

  // ---------- pizza: Pizza Shop (Lesson 3). The child is ALWAYS the shopkeeper. ----------
  // The customer (the girl voice) orders: "Hello! I want mushrooms, please." The goal bar shows her order card
  // (the topping pictures). The child puts each topping on the pizza (tap or drag): "Here you are!" and the
  // customer "Thank you!". Wrong = wiggle and the order again; glow after 2 tries. At the end the customer says
  // "I like mushrooms and cheese!" with the toppings that are on the pizza.
  // How many toppings one order has: pizza.order in games.json, per level (Pre-K 1, K and up 2).
  // (A free-play pizza, drag anything, is saved for a later version: a separate tile, mode "free".)

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
    var n = Math.max(1, Math.min(2, (G.pizza && G.pizza.order) || 1));
    var others = item.choices.filter(function (w) { return w !== item.word; });
    var order = [item.word].concat(shuffle(others).slice(0, n - 1));
    // The tray: the order, plus others (clearly different), as many as this level sees.
    var rest = others.filter(function (w) { return order.indexOf(w) === -1; });
    var choices = shuffle(order.concat(rest.slice(0, Math.max(3, G.pizza.choices) - order.length)));
    var tray = choices.map(function (w) {
      return '<button class="g-topping k-press" data-top="' + esc(w) + '">' + picture(w, 58) +
        '<span>' + esc(wordText(w)) + '</span></button>';
    }).join('');
    var card = '<span class="g-order">' + order.map(function (w) {
      return '<span class="g-order-item" data-order="' + esc(w) + '">' + picture(w, 46) + '</span>';
    }).join('') + '</span>';
    pizza = { item: item, order: order, placed: [], spot: 0, misses: 0 };
    var o = orderText(order);
    frame(lion(o.english, o.japanese, { who: 'girl', pic: card }) +
      '<div class="g-stage g-pizzeria">' +
      '<div class="g-pizza g-drop" aria-label="Pizza">' + pizzaBase() + '<div class="g-pizza-tops"></div></div>' +
      '<div class="g-tray">' + tray + '</div></div>' + youRow(),
      { replay: true });
    sayOrder();
  }

  function orderText(order) {
    return {
      english: 'Hello! I want ' + joinNames(order) + ', please.',
      japanese: 'こんにちは！' + order.map(wordJa).join('と') + 'を ください。'
    };
  }
  // The customer says (again) what is still missing.
  function sayOrder() {
    var p = pizza;
    if (!p) return;
    var left = p.order.filter(function (w) { return p.placed.indexOf(w) === -1; });
    var o = orderText(left.length ? left : p.order);
    setBubble(o.english, o.japanese);
    return say(o.english, null, true);
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
    var left = p.order.filter(function (w) { return p.placed.indexOf(w) === -1; });
    if (left.indexOf(word) === -1) {
      el.style.transform = '';
      p.misses++;
      wrong++;
      wiggle(el);
      me('shrug');
      setBubble('Try again!', 'もういちど！');
      say('Try again!').then(function () { if (pizza === p && !busy) sayOrder(); });
      if (wrong >= 2) left.forEach(function (w) {
        var r = root.querySelector('[data-top="' + w + '"]');
        if (r) r.classList.add('g-glow');
      });
      return;
    }
    busy = true;
    wrong = 0;
    p.placed.push(word);
    el.disabled = true;
    el.classList.remove('g-glow');
    el.classList.add('g-right');
    var mark = root.querySelector('[data-order="' + word + '"]');
    if (mark) mark.classList.add('g-order-done');
    landTopping(el, word, fly);
    youSay('Here you are!', 'はい、どうぞ！');
    var all = p.placed.length === p.order.length;
    say('Here you are!', null, true).then(function () {
      if (pizza !== p) return;
      setBubble('Thank you!', 'ありがとう！');
      return say('Thank you!', null, true);
    }).then(function () {
      if (pizza !== p) return;
      if (!all) {
        busy = false;
        var you = root.querySelector('.g-you');
        if (you) you.classList.remove('g-you-on');
        return sayOrder();
      }
      root.querySelectorAll('.g-topping').forEach(function (b) { b.disabled = true; });
      saveAnswer(item, Math.min(9, p.misses + 1));
      var likes = 'I like ' + joinNames(p.placed) + '!';
      setBubble(likes, p.placed.map(wordJa).join('と') + 'が すき！');
      return say(likes, null, true).then(praise).then(function () { return wait(400); }).then(next);
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
    me('dance');
    freeze.timer = setTimeout(stopTheMusic, ms);
  }

  function stopTheMusic() {
    var f = freeze;
    if (!f || f.phase !== 'dance') return;
    f.phase = 'frozen';
    if (hasMusic) window.H212Music.stop();
    me('still');
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
    frame(lion(item.like.english, item.like.japanese, { pic: FACES, nokid: withKid }) +
      '<div class="g-stage' + (withKid ? ' g-stage-kid' : '') + '">' + (withKid ? kidFigure() : '') +
      '<div class="g-card g-card-big">' + picture(item.word, 220) + '</div></div>' +
      yesNoButtons(yes, no, 'data-like', true), { replay: true });
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

  // ---------- Batch 2: memory, bubble, oddout, match, sort, hidden ----------
  // A board (memory, match, sort, hidden) is one question: it saves one record when it is finished.

  var BOARDS = G.boards || {};
  function boardSize(name, dflt, lo, hi) {
    return Math.max(lo, Math.min(hi, BOARDS[name] || dflt));
  }
  function cap(s) {
    s = String(s);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function wordJa(key) {
    return (G.words[key] && G.words[key].japanese) || '';
  }
  function wiggle(el) {
    el.classList.remove('g-wiggle');
    void el.offsetWidth;
    el.classList.add('g-wiggle');
  }
  function boardDone(item, misses) {
    busy = true;
    saveAnswer(item, Math.min(9, misses + 1));
    return wait(300).then(praise).then(function () { return wait(400); }).then(next);
  }

  // ----- memory: flip two cards, find the pairs -----
  var mem = null;

  function memoryScreen(item) {
    var n = boardSize('memory', 4, 2, 8);
    var cards = [];
    if (item.pairs) {
      shuffle(item.pairs).slice(0, n).forEach(function (p, i) {
        cards.push({ pair: i, key: p[0], face: 'picture', first: true }, { pair: i, key: p[1], face: 'picture' });
      });
    } else {
      var type = cardType(item);
      shuffle(item.words).slice(0, n).forEach(function (k, i) {
        cards.push({ pair: i, key: k, face: 'picture', first: true }, { pair: i, key: k, face: type === 'picture-word' ? 'word' : 'picture' });
      });
    }
    cards = shuffle(cards);
    mem = { item: item, cards: cards, open: [], left: cards.length / 2, misses: 0 };
    var cols = cards.length <= 6 ? 3 : (cards.length === 10 ? 5 : 4);
    var html = cards.map(function (c, i) {
      var front = c.face === 'word' ? bigWord(c.key) : picture(c.key, 110);
      return '<button class="g-mem-card k-press" data-mem="' + i + '" aria-label="Card ' + (i + 1) + '">' +
        '<span class="g-mem-back" aria-hidden="true">?</span><span class="g-mem-front">' + front + '</span></button>';
    }).join('');
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage"><div class="g-mem" style="--cols:' + cols + '">' + html + '</div></div>', { replay: true });
    say(item.english, item.audio);
  }

  // Memory cards for the WHOLE play: "picture-picture" (two same pictures) or "picture-word" (a picture and
  // its written word). A game's own card_type wins (a word, or one per level); otherwise memory_cards for
  // this level in games.json (Pre-K picture-picture, K and up picture-word).
  function cardType(item) {
    var t = item.card_type;
    if (t && typeof t === 'object') t = t[G.child.level];
    t = t || G.memory_cards || (item.match === 'word' ? 'picture-word' : 'picture-picture');
    return t === 'picture-word' ? 'picture-word' : 'picture-picture';
  }

  function tapMemory(btn) {
    var m = mem;
    var i = +btn.getAttribute('data-mem');
    var c = m.cards[i];
    if (c.open || m.open.length >= 2) return;
    c.open = true;
    btn.classList.add('g-mem-open');
    m.open.push(i);
    if (m.open.length < 2) return say(wordText(c.key));
    var a = m.cards[m.open[0]];
    var b = m.cards[m.open[1]];
    var els = m.open.map(function (k) { return root.querySelector('[data-mem="' + k + '"]'); });
    if (a.pair !== b.pair) {
      m.misses++;
      say(wordText(c.key));
      return wait(1300).then(function () {
        if (mem !== m) return;
        a.open = b.open = false;
        els.forEach(function (e) { e.classList.remove('g-mem-open'); });
        m.open = [];
      });
    }
    // A pair: "Banana!" or, for 2 different pictures, "Red apple!".
    m.open = [];
    m.left--;
    els.forEach(function (e) { e.classList.add('g-mem-done'); e.disabled = true; });
    var one = a.first ? a : b;
    var two_ = a.first ? b : a;
    var en = one.key === two_.key ? cap(wordText(one.key)) + '!' : cap(wordText(one.key)) + ' ' + wordText(two_.key) + '!';
    var jp = one.key === two_.key ? wordJa(one.key) : wordJa(one.key) + '・' + wordJa(two_.key);
    setBubble(en, jp);
    // Only the LAST pair ends the board (an earlier pair's sentence may still be playing).
    var last = m.left === 0;
    if (last) busy = true;
    say(en).then(function () {
      if (last && mem === m) boardDone(m.item, m.misses);
    });
  }

  // ----- bubble: Pop it -----
  // The balloons drift slowly in straight lines and bounce off the walls and each other (like an old
  // screensaver). They never leave the screen and never run away; no timer. Speed: boards.bubble_speed
  // (pixels a second, per level). How many: boards.bubbles; the first question of a play has only 2.
  // The goal bar shows the picture to pop ("Pop the apple!"); a letter-sound balloon has the "?" instead.
  var bub = null;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bubbleScreen(item) {
    var n = ii === 0 ? 2 : boardSize('bubbles', 3, 2, 6);
    var others = [];
    rounds[ri].all.forEach(function (it) {
      if (it.word && it.word !== item.word && others.indexOf(it.word) === -1) others.push(it.word);
    });
    var keys = shuffle([item.word].concat(shuffle(others).slice(0, n - 1)));
    var html = keys.map(function (k) {
      return '<span class="g-bub-at"><button class="g-choice g-bub" data-choice="' + esc(k) + '" aria-label="' + esc(wordText(k)) + '">' + picture(k, 96) + '</button></span>';
    }).join('');
    var opts = item.sound ? { ask: true } : { pic: picture(item.word, 60) };
    frame(lion(item.english, item.japanese, opts) + '<div class="g-stage g-bub-stage"><div class="g-bub-sky">' + html + '</div></div>', { replay: true, fill: true });
    startBubbles();
    if (item.sound) playSound(item.sound, true);
    else say(item.english, item.audio);
  }

  function stopBubbles() {
    if (bub) cancelAnimationFrame(bub.raf);
    bub = null;
  }
  function startBubbles() {
    stopBubbles();
    var sky = root.querySelector('.g-bub-sky');
    if (!sky) return;
    var speed = (BOARDS.bubble_speed || 50) * (REDUCED ? 0.4 : 1);
    var W = sky.clientWidth;
    var H = sky.clientHeight;
    var list = [];
    sky.querySelectorAll('.g-bub-at').forEach(function (el, i) {
      var d = el.firstChild.offsetWidth || 110;
      var x, y, tries = 0;
      // A free spot: not on top of another balloon.
      do {
        x = Math.random() * Math.max(1, W - d);
        y = Math.random() * Math.max(1, H - d);
        tries++;
      } while (tries < 40 && list.some(function (o) { return Math.hypot(o.x - x, o.y - y) < d; }));
      var a = Math.random() * Math.PI * 2;
      list.push({ el: el, btn: el.firstChild, d: d, x: x, y: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed });
    });
    var me_ = { raf: 0, list: list };
    bub = me_;
    var last = 0;
    function step(t) {
      if (bub !== me_ || !sky.isConnected) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      W = sky.clientWidth;
      H = sky.clientHeight;
      list.forEach(function (b) {
        if (b.btn.classList.contains('g-bub-popped')) return;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); }
        if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy); }
        if (b.x > W - b.d) { b.x = Math.max(0, W - b.d); b.vx = -Math.abs(b.vx); }
        if (b.y > H - b.d) { b.y = Math.max(0, H - b.d); b.vy = -Math.abs(b.vy); }
      });
      // Two balloons touching bounce off each other (they swap their speed along the line between them).
      for (var i = 0; i < list.length; i++) {
        for (var j = i + 1; j < list.length; j++) {
          var p = list[i];
          var q = list[j];
          if (p.btn.classList.contains('g-bub-popped') || q.btn.classList.contains('g-bub-popped')) continue;
          var dx = q.x - p.x;
          var dy = q.y - p.y;
          var dist = Math.hypot(dx, dy) || 1;
          var min = (p.d + q.d) / 2;
          if (dist >= min) continue;
          var nx = dx / dist;
          var ny = dy / dist;
          var rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
          if (rel > 0) {
            p.vx -= rel * nx; p.vy -= rel * ny;
            q.vx += rel * nx; q.vy += rel * ny;
          }
          var push = (min - dist) / 2;
          p.x -= nx * push; p.y -= ny * push;
          q.x += nx * push; q.y += ny * push;
        }
      }
      list.forEach(function (b) { b.el.style.transform = 'translate(' + b.x.toFixed(1) + 'px,' + b.y.toFixed(1) + 'px)'; });
      me_.raf = requestAnimationFrame(step);
    }
    me_.raf = requestAnimationFrame(step);
  }

  function answerBubble(b) {
    var item = currentItem();
    var good = b.getAttribute('data-choice') === item.word;
    if (item.sound) setAsk(askLabel(picture(b.getAttribute('data-choice'), 56), good), good ? 'good' : 'try');
    if (!good) {
      wrongAnswer(b, item, '[data-choice="' + item.word + '"]');
      if (item.sound) wait(1500).then(function () { if (currentItem() === item && !busy) playSound(item.sound, true); });
      return;
    }
    b.classList.add('g-bub-popped');
    if (item.sound) {
      busy = true;
      saveAnswer(item, wrong + 1);
      return playSound(item.sound, false).then(praise).then(function () { return wait(400); }).then(next);
    }
    rightAnswer(b, cap(wordText(item.word)) + '!', wordJa(item.word));
  }

  // ----- match and sort: drag a picture (.g-drag) onto a target (.g-target) -----
  // A short touch picks the picture up (it says its word); then a tap on a target puts it there.
  var mt = null;
  var st = null;
  var pd = null;
  var picked = null;

  function pieces(keys) {
    return '<div class="g-pieces">' + keys.map(function (k) {
      return '<button class="g-drag" data-drag="' + esc(k) + '" aria-label="' + esc(wordText(k)) + '">' + picture(k, 80) + '</button>';
    }).join('') + '</div>';
  }

  function matchScreen(item) {
    var n = boardSize('match', 3, 2, 5);
    var answer = {};
    var targets = [];
    var drags = [];
    if (item.pairs) {
      shuffle(item.pairs).slice(0, n).forEach(function (p) {
        answer[p[1]] = p[0];
        targets.push(p[0]);
        drags.push(p[1]);
      });
    } else {
      shuffle(item.words).slice(0, n).forEach(function (k) {
        answer[k] = k;
        targets.push(k);
        drags.push(k);
      });
    }
    var mode = item.pairs ? 'pairs' : (item.mode || 'shadow');
    mt = { item: item, answer: answer, mode: mode, left: drags.length, misses: 0, wrong: {} };
    var html = shuffle(targets).map(function (k) {
      var inner = mode === 'word' ? bigWord(k) : '<span class="' + (mode === 'shadow' ? 'g-shadow' : '') + '">' + picture(k, 96) + '</span>';
      return '<button class="g-target g-mt-target g-mt-' + mode + '" data-target="' + esc(k) + '" aria-label="' + esc(wordText(k)) + '">' + inner + '</button>';
    }).join('');
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-stage-col"><div class="g-mt-targets">' + html + '</div>' + pieces(shuffle(drags)) + '</div>', { replay: true });
    say(item.english, item.audio);
  }

  function sortScreen(item) {
    var n = boardSize('sort', 6, 2, 10);
    var g = item.groups;
    var a = shuffle(g[0].words);
    var b = shuffle(g[1].words);
    var nb = Math.min(b.length, Math.floor(n / 2));
    var na = Math.min(a.length, n - nb);
    nb = Math.min(b.length, n - na);
    var group = {};
    a.forEach(function (k) { group[k] = 0; });
    b.forEach(function (k) { group[k] = 1; });
    st = { item: item, group: group, left: na + nb, misses: 0, wrong: {} };
    var baskets = g.map(function (gr, i) {
      return '<button class="g-target g-sort-basket" data-target="' + i + '" style="--bc:' + esc(gr.color || '#FFFFFF') + '">' +
        '<span class="g-sort-label">' + two(cap(gr.english), gr.japanese) + '</span><span class="g-sort-in"></span></button>';
    }).join('');
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-stage-col"><div class="g-sort-baskets">' + baskets + '</div>' +
      pieces(shuffle(a.slice(0, na).concat(b.slice(0, nb)))) + '</div>', { replay: true });
    say(item.english, item.audio);
  }

  function rightTarget(key) {
    if (mt) return root.querySelector('.g-target[data-target="' + mt.answer[key] + '"]');
    return root.querySelector('.g-target[data-target="' + st.group[key] + '"]');
  }

  function dropPiece(el, t) {
    unpick();
    var key = el.getAttribute('data-drag');
    var b = mt || st;
    var good = rightTarget(key) === t;
    el.style.transform = '';
    if (!good) {
      b.misses++;
      b.wrong[key] = (b.wrong[key] || 0) + 1;
      wiggle(el);
      me('shrug');
      setBubble('Try again!', 'もういちど！');
      say('Try again!').then(function () {
        if ((mt || st) === b && !busy) setBubble(b.item.english, b.item.japanese);
      });
      if (b.wrong[key] >= 2) rightTarget(key).classList.add('g-glow');
      return;
    }
    root.querySelectorAll('.g-target.g-glow').forEach(function (x) { x.classList.remove('g-glow'); });
    el.disabled = true;
    el.classList.add('g-drag-gone');
    b.left--;
    var en;
    var jp;
    if (mt) {
      t.disabled = true;
      t.classList.add('g-mt-done');
      if (mt.mode === 'shadow') {
        var sh = t.querySelector('.g-shadow');
        if (sh) sh.className = 'g-unshadow';
      } else {
        t.insertAdjacentHTML('beforeend', '<span class="g-mt-in">' + picture(key, 70) + '</span>');
      }
      var tk = mt.answer[key];
      en = mt.mode === 'pairs' ? cap(wordText(tk)) + ' ' + wordText(key) + '!' : cap(wordText(key)) + '!';
      jp = mt.mode === 'pairs' ? wordJa(tk) + '・' + wordJa(key) : wordJa(key);
    } else {
      var gr = st.item.groups[st.group[key]];
      t.querySelector('.g-sort-in').insertAdjacentHTML('beforeend', '<span class="g-sort-thing">' + picture(key, 54) + '</span>');
      t.classList.remove('g-pop-in');
      void t.offsetWidth;
      t.classList.add('g-pop-in');
      en = cap(wordText(key)) + '! ' + cap(gr.english) + '!';
      jp = wordJa(key) + '・' + gr.japanese;
    }
    setBubble(en, jp);
    // Only the LAST picture ends the board (an earlier picture's sentence may still be playing).
    var last = b.left === 0;
    if (last) busy = true;
    say(en).then(function () {
      if (last && (mt || st) === b) boardDone(b.item, b.misses);
    });
  }

  function pickPiece(el) {
    unpick();
    picked = el;
    el.classList.add('g-picked-up');
    say(wordText(el.getAttribute('data-drag')));
  }
  function unpick() {
    if (picked) picked.classList.remove('g-picked-up');
    picked = null;
  }

  function tapTarget(t) {
    if (picked && !picked.disabled) return dropPiece(picked, t);
    if (st) {
      var gr = st.item.groups[+t.getAttribute('data-target')];
      return say(cap(gr.english) + '.');
    }
    if (mt && mt.mode !== 'shadow') say(wordText(t.getAttribute('data-target')) + '.');
  }

  function targetAt(e) {
    var hit = null;
    root.querySelectorAll('.g-target').forEach(function (t) {
      if (t.disabled) return;
      var r = t.getBoundingClientRect();
      if (e.clientX > r.left - 12 && e.clientX < r.right + 12 && e.clientY > r.top - 12 && e.clientY < r.bottom + 12) hit = t;
    });
    return hit;
  }
  function hoverTarget(t) {
    root.querySelectorAll('.g-target.g-drop-hover').forEach(function (x) { if (x !== t) x.classList.remove('g-drop-hover'); });
    if (t) t.classList.add('g-drop-hover');
  }

  root.addEventListener('pointerdown', function (e) {
    var el = e.target.closest('.g-drag');
    if (!el || el.disabled || busy) return;
    e.preventDefault();
    pd = { el: el, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
  });
  root.addEventListener('pointermove', function (e) {
    if (!pd || e.pointerId !== pd.id) return;
    var dx = e.clientX - pd.x;
    var dy = e.clientY - pd.y;
    if (!pd.moved && Math.abs(dx) + Math.abs(dy) < 10) return;
    if (!pd.moved) unpick();
    pd.moved = true;
    pd.el.classList.add('g-dragging');
    pd.el.style.transform = 'translate(' + dx / FIT + 'px,' + dy / FIT + 'px) scale(1.12)';
    hoverTarget(targetAt(e));
  });
  function endPieceDrag(e, cancelled) {
    if (!pd || e.pointerId !== pd.id) return;
    var d = pd;
    pd = null;
    d.el.classList.remove('g-dragging');
    hoverTarget(null);
    if (cancelled || busy) {
      d.el.style.transform = '';
      return;
    }
    if (!d.moved) return pickPiece(d.el);
    var t = targetAt(e);
    if (t) return dropPiece(d.el, t);
    d.el.style.transform = ''; // not on a target: it slides back
  }
  root.addEventListener('pointerup', function (e) { endPieceDrag(e, false); });
  root.addEventListener('pointercancel', function (e) { endPieceDrag(e, true); });

  // ----- hidden: Find it in the picnic picture -----
  var hd = null;
  // Where things can be (percent of the picture, the middle of the thing): grass, blanket, tree, bushes.
  var HIDE_SPOTS = [[12, 30], [24, 46], [8, 66], [30, 70], [44, 56], [56, 74], [70, 58], [84, 72], [40, 86], [62, 90],
    [78, 88], [20, 86], [92, 50], [52, 40], [88, 30], [34, 40]];
  var LEAVES = '<svg class="g-leaves" viewBox="0 0 100 80" aria-hidden="true">' +
    '<path d="M10 70 C0 40 30 20 50 40 C60 10 95 20 90 50 C100 60 90 80 70 78 Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M30 70 Q45 50 52 42 M70 74 Q72 58 78 46" stroke="#3E9E68" stroke-width="5" fill="none" stroke-linecap="round"/></svg>';
  var PICNIC = '<svg class="g-scene-bg" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<rect width="1000" height="640" fill="#BDE6FF"/>' +
    '<circle cx="890" cy="86" r="52" fill="#FFD24D" stroke="' + INK + '" stroke-width="6"/>' +
    '<g fill="#FFFFFF" stroke="' + INK + '" stroke-width="5"><path d="M470 96 a34 34 0 0 1 60 -20 a40 40 0 0 1 72 18 a28 28 0 0 1 -6 54 H476 a28 28 0 0 1 -6 -52Z"/>' +
    '<path d="M640 190 a24 24 0 0 1 44 -12 a28 28 0 0 1 52 14 a20 20 0 0 1 -4 38 H646 a20 20 0 0 1 -6 -40Z"/></g>' +
    '<path d="M0 300 Q250 220 520 296 T1000 262 V640 H0Z" fill="#A6E3A0" stroke="' + INK + '" stroke-width="6"/>' +
    '<path d="M0 380 Q500 330 1000 392 V640 H0Z" fill="#7CCB78" stroke="' + INK + '" stroke-width="6"/>' +
    '<rect x="96" y="150" width="50" height="250" rx="12" fill="#A86E35" stroke="' + INK + '" stroke-width="6"/>' +
    '<g fill="#5CC98B" stroke="' + INK + '" stroke-width="6"><circle cx="70" cy="190" r="72"/><circle cx="190" cy="180" r="74"/><circle cx="124" cy="110" r="88"/></g>' +
    '<path d="M330 470 L770 440 L840 620 L260 640 Z" fill="#FF8FA8" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>' +
    '<path d="M400 465 L360 636 M500 458 L480 632 M600 451 L600 628 M700 445 L720 624 M300 548 L800 528" stroke="#FFFFFF" stroke-width="12" opacity=".75"/>' +
    '<g fill="#8ED6A0" stroke="' + INK + '" stroke-width="6"><circle cx="890" cy="420" r="62"/><circle cx="960" cy="440" r="56"/><circle cx="40" cy="470" r="58"/></g>' +
    '<g stroke="' + INK + '" stroke-width="4"><circle cx="230" cy="560" r="11" fill="#FFD24D"/><circle cx="905" cy="560" r="11" fill="#FF7DA8"/><circle cx="560" cy="380" r="10" fill="#FFFFFF"/><circle cx="300" cy="400" r="10" fill="#C9B8FF"/></g></svg>';

  function hiddenScreen(item) {
    var nf = Math.max(1, Math.min(item.find.length, boardSize('hidden', 3, 1, 5)));
    var find = shuffle(item.find).slice(0, nf);
    var total = Math.max(nf + 2, boardSize('hidden_things', 8, 3, HIDE_SPOTS.length));
    var others = shuffle((item.others || []).filter(function (k) { return find.indexOf(k) === -1; })).slice(0, total - nf);
    var things = shuffle(find.concat(others));
    var spots = shuffle(HIDE_SPOTS).slice(0, things.length);
    // About 1 in 4 things are half behind leaves (still easy to tap: the leaves are part of the button).
    var covered = shuffle(things.map(function (_, i) { return i; })).slice(0, Math.floor(things.length / 4));
    hd = { item: item, find: find, at: 0, misses: 0, wrong: 0 };
    var html = things.map(function (k, i) {
      var s = spots[i];
      return '<span class="g-hide-at" style="left:' + s[0] + '%;top:' + s[1] + '%">' +
        '<button class="g-hide" data-hide="' + esc(k) + '" aria-label="' + esc(wordText(k)) + '" style="--rot:' + Math.round(Math.random() * 40 - 20) + 'deg">' +
        picture(k, 90) + (covered.indexOf(i) !== -1 ? LEAVES : '') + '</button></span>';
    }).join('');
    var list = find.map(function (k, i) {
      return '<button class="g-hd-find" data-hdfind="' + i + '" aria-label="' + esc(wordText(k)) + '">' + picture(k, 54) + '<span class="g-hd-check" aria-hidden="true"></span></button>';
    }).join('');
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-stage-col g-hd-stage"><div class="g-hd-list">' + list + '</div>' +
      '<div class="g-scene">' + PICNIC + html + '</div></div>', { replay: true });
    hiddenAsk();
  }

  function hiddenAsk(before) {
    var k = hd.find[hd.at];
    var en = 'Find the ' + wordText(k) + '!';
    setBubble(en, wordJa(k) + 'を さがして！');
    root.querySelectorAll('.g-hd-find').forEach(function (b, i) { b.classList.toggle('g-hd-now', i === hd.at); });
    return say((before ? before + ' ' : '') + en);
  }

  function tapHidden(b) {
    var h = hd;
    var key = b.getAttribute('data-hide');
    var want = h.find[h.at];
    if (key !== want) {
      h.misses++;
      h.wrong++;
      wiggle(b);
      me('shrug');
      setBubble('Try again!', 'もういちど！');
      say(cap(wordText(key)) + '? Try again! Find the ' + wordText(want) + '!').then(function () {
        if (hd === h && !busy && h.find[h.at] === want) setBubble('Find the ' + wordText(want) + '!', wordJa(want) + 'を さがして！');
      });
      if (h.wrong >= 2) {
        var right = root.querySelector('.g-hide[data-hide="' + want + '"]');
        if (right) right.classList.add('g-glow');
      }
      return;
    }
    b.classList.remove('g-glow');
    b.classList.add('g-hide-found');
    b.disabled = true;
    var card = root.querySelector('[data-hdfind="' + h.at + '"]');
    if (card) card.classList.add('g-hd-done');
    h.at++;
    h.wrong = 0;
    var en = cap(wordText(key)) + '!';
    if (h.at < h.find.length) return hiddenAsk(en);
    root.querySelectorAll('.g-hd-find').forEach(function (x) { x.classList.remove('g-hd-now'); });
    busy = true;
    setBubble(en, wordJa(key));
    say(en).then(function () { boardDone(h.item, h.misses); });
  }

  // ---------- Batch 3: pick — Pick the written answer ----------
  // The lion asks; the child reads and taps the written sentence. boards.read_choices (Pre-K, K): the lion reads them.

  function youRow() {
    var face = '<svg width="54" height="54" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="' + (AVATAR[G.child.color] || AVATAR.blue) + '" stroke="' + INK + '" stroke-width="6"/>' +
      '<circle cx="42" cy="52" r="7" fill="' + INK + '"/><circle cx="78" cy="52" r="7" fill="' + INK + '"/>' +
      '<path d="M38 74 Q60 96 82 74" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/></svg>';
    return '<div class="g-you">' + face + '<div class="k-bubble g-you-bubble"><b>…</b><small>' + esc(G.child.name) + '</small></div></div>';
  }
  // "a robot", "an apple", "blocks" (a word whose plural is itself has no "a").
  function withArticle(key) {
    var w = G.words[key] || {};
    var e = w.english || key;
    if (w.plural === e) return e;
    return (/^[aeiou]/i.test(e) ? 'an ' : 'a ') + e;
  }
  function pictureOf(name, size, label) {
    var p = PICTURES[name] || PICTURES.apple;
    return '<svg class="g-pic" width="' + size + '" height="' + size + '" viewBox="' + p[0] + '" role="img" aria-label="' + esc(label || name) + '">' + p[1] + '</svg>';
  }

  function pickScreen(item) {
    var shown;
    if (item.show === 'count') {
      var many = '';
      for (var i = 0; i < item.count; i++) many += picture(item.word, item.count > 6 ? 54 : (item.count > 3 ? 66 : 84));
      shown = '<div class="g-card g-card-show g-count-show">' + many + '</div>';
    } else {
      shown = '<div class="g-card g-card-show">' + picture(item.word, 150) + '</div>';
    }
    var btns = shuffle(item.choices).map(function (s) {
      return '<button class="g-sentence k-press" data-sentence="' + esc(s) + '">' + esc(s) + '</button>';
    }).join('');
    frame(lion(item.english, item.japanese) + '<div class="g-stage g-stage-col">' + shown + '<div class="g-sentences">' + btns + '</div></div>', { replay: true });
    askPick(item);
  }

  function askPick(item) {
    var chain = say(item.english, item.audio);
    if (!BOARDS.read_choices) return;
    root.querySelectorAll('.g-sentence').forEach(function (b) {
      chain = chain.then(function () {
        if (currentItem() !== item || busy) return;
        b.classList.add('g-reading');
        return say(b.getAttribute('data-sentence')).then(function () { b.classList.remove('g-reading'); });
      });
    });
  }

  function answerPick(b) {
    var item = currentItem();
    var s = b.getAttribute('data-sentence');
    var right = [].concat(item.answer);
    if (right.indexOf(s) !== -1) return rightAnswer(b, s, item.answer_japanese || '');
    wrongAnswer(b, item, '[data-sentence="' + right[0].replace(/"/g, '\\"') + '"]');
  }

  // ---------- Batch 4: say — Say it (microphone, optional, nothing recorded, never graded) ----------
  // The microphone is OFF until a grown-up turns it on (remembered on this device). "I said it!" always works.

  var MIC_KEY = 'h212_kids_mic';
  var Recognizer = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var sy = null;
  function micOn() {
    try { return localStorage.getItem(MIC_KEY) === '1'; } catch (e) { return false; }
  }
  function setMic(on) {
    try { localStorage.setItem(MIC_KEY, on ? '1' : '0'); } catch (e) {}
  }

  function sayScreen(item) {
    if (sy && sy.rec) try { sy.rec.abort(); } catch (e) {}
    sy = { item: item, rec: null, tries: 0 };
    var mic = '';
    if (Recognizer && micOn()) {
      mic = '<button class="g-mic k-press" data-act="listen" aria-label="Say it into the microphone">' +
        '<svg width="46" height="46" viewBox="0 0 40 40" aria-hidden="true"><rect x="13" y="4" width="14" height="22" rx="7" fill="' + INK + '"/><path d="M8 19 Q8 31 20 31 Q32 31 32 19 M20 31 V37 M13 37 H27" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>' +
        two('Say it', 'マイクで いう') + '</button>';
    }
    var off = !Recognizer ? '' : (micOn()
      ? '<button class="g-mic-switch" data-act="mic-off">マイク: オン（おとなの かた：オフに する）</button>'
      : '<button class="g-mic-switch" data-act="mic-on">🎤 マイクを つかう（おとなの かたへ：きろくは されません）</button>');
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-stage-col"><div class="g-card g-card-big">' + picture(item.word, 200) + '</div>' +
      '<div class="g-say-row">' + mic +
      '<button class="k-big-btn k-green k-press g-said" data-act="said">' + two('I said it!', 'いったよ！') + '</button></div>' + off + '</div>', { replay: true });
    say(item.english + ' Your turn!', item.audio);
  }

  // Close enough? Fuzzy and kind: "teddy bear" ~ "teddy", "3" = "three", one or two letters off is fine.
  var DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  function distance(a, b) {
    var row = [];
    for (var j = 0; j <= b.length; j++) row[j] = j;
    for (var i = 1; i <= a.length; i++) {
      var prev = row[0];
      row[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var tmp = row[k];
        row[k] = Math.min(row[k] + 1, row[k - 1] + 1, prev + (a.charAt(i - 1) === b.charAt(k - 1) ? 0 : 1));
        prev = tmp;
      }
    }
    return row[b.length];
  }
  function closeTo(heard, target) {
    var h = String(heard).toLowerCase().replace(/\b(10|[0-9])\b/g, function (n) { return DIGITS[+n]; }).replace(/[^a-z ]/g, '').trim();
    if (!h) return false;
    var t = target.toLowerCase();
    var slack = Math.max(1, Math.floor(t.length / 4));
    if (h.indexOf(t) !== -1 || distance(h, t) <= slack) return true;
    return h.split(' ').some(function (w) { return distance(w, t.split(' ')[0]) <= slack || distance(w, t.replace(/s$/, '')) <= slack; });
  }

  function listenSay() {
    var s = sy;
    if (!s || s.rec || !Recognizer) return;
    var r;
    try { r = new Recognizer(); } catch (e) { return; }
    s.rec = r;
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 5;
    var heard = [];
    var btn = root.querySelector('.g-mic');
    if (btn) btn.classList.add('g-mic-live');
    setBubble("I'm listening…", 'きいてるよ…');
    r.onresult = function (e) {
      for (var i = 0; i < e.results.length; i++) {
        for (var j = 0; j < e.results[i].length; j++) heard.push(e.results[i][j].transcript);
      }
    };
    // No permission for the microphone (or none on this device): turn it off again; "I said it!" still works.
    r.onerror = function (e) {
      if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture')) s.denied = true;
    };
    r.onend = function () {
      if (sy !== s) return;
      s.rec = null;
      if (btn) btn.classList.remove('g-mic-live');
      if (s.denied) {
        setMic(false);
        sayScreen(s.item);
        return;
      }
      heardIt(s, heard);
    };
    stopVoice();
    try { r.start(); } catch (e) { s.rec = null; if (btn) btn.classList.remove('g-mic-live'); }
  }

  function heardIt(s, heard) {
    var target = wordText(s.item.word);
    if (heard.some(function (h) { return closeTo(h, target); })) return finishSay('Great! ' + cap(target) + '!', 'じょうず！' + wordJa(s.item.word));
    s.tries++;
    if (!heard.length && s.tries < 3) {
      setBubble("I didn't hear you. Try again!", 'きこえなかったよ。もういちど！');
      return say("I didn't hear you. Try again!");
    }
    if (s.tries < 2) {
      setBubble("Oh, it's close! " + cap(target) + '!', 'おしい！もういちど！');
      return say("Oh, it's close! " + cap(target) + '! Try again!');
    }
    finishSay('Good try! ' + cap(target) + '!', 'がんばったね！' + wordJa(s.item.word));
  }

  function finishSay(en, jp) {
    var s = sy;
    if (!s || busy) return;
    if (s.rec) try { s.rec.abort(); } catch (e) {}
    busy = true;
    saveAnswer(s.item, 1);
    root.querySelectorAll('.g-mic, .g-said').forEach(function (b) { b.disabled = true; });
    setBubble(en, jp);
    say(en).then(praise).then(function () { return wait(250); }).then(next);
  }

  // ---------- December: Santa's Sack (yesno "sack"), Elf Workshop, Dear Santa, Pass the Present ----------

  // Elf Workshop: the lion is the elf ("Can I have a red ball, please?"), the child is Santa.
  function elfName(key) {
    var p = key.split('_');
    return p[1] + ' ' + wordText(p[0]);
  }
  function elfScreen(item) {
    var n = boardSize('elf', 3, 2, 4);
    var right = item.word + '_' + item.color;
    var keys = shuffle([right].concat(shuffle(item.choices.filter(function (k) { return k !== right; })).slice(0, n - 1)));
    var cards = keys.map(function (k) {
      return '<button class="g-card g-choice g-choice-picture k-press" data-elf="' + esc(k) + '">' + pictureOf(k, 140, elfName(k)) + '</button>';
    }).join('');
    frame(lion(item.english, item.japanese) + '<div class="g-stage g-stage-col"><div class="g-choices">' + cards + '</div></div>' + youRow(), { replay: true });
    say(item.english, item.audio);
  }
  function answerElf(b) {
    var item = currentItem();
    var right = item.word + '_' + item.color;
    if (b.getAttribute('data-elf') !== right) return wrongAnswer(b, item, '[data-elf="' + right + '"]');
    busy = true;
    saveAnswer(item, wrong + 1);
    b.classList.add('g-right');
    root.querySelectorAll('[data-elf]').forEach(function (x) { x.disabled = true; });
    youSay('Yes, you may! Here you are!', 'はい、どうぞ！');
    say('Yes, you may! Here you are!', null, true).then(function () {
      setBubble('Thank you!', 'ありがとう！');
      return say('Thank you!');
    }).then(praise).then(function () { return wait(250); }).then(next);
  }

  // Dear Santa: pick presents for your letter. "I want a robot!" Every choice is right.
  var wsh = null;
  function wishScreen(item) {
    var n = boardSize('wish', 3, 1, 3);
    var keys = shuffle(item.toys).slice(0, boardSize('wish_toys', 6, 3, 10));
    wsh = { item: item, n: n, picked: [] };
    var boxes = '';
    for (var i = 0; i < n; i++) boxes += '<span class="g-wish-box" data-wishbox="' + i + '"></span>';
    var toys = keys.map(function (k) {
      return '<button class="g-card g-wish-toy k-press" data-wish="' + esc(k) + '">' + picture(k, 92) + '</button>';
    }).join('');
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage g-wish"><div class="g-letter"><b>Dear Santa,</b><div class="g-wish-boxes">' + boxes + '</div>' +
      '<span class="g-letter-from">From ' + esc(G.child.name) + '</span></div><div class="g-wish-toys">' + toys + '</div></div>' + youRow(), { replay: true });
    say(item.english);
  }
  function tapWish(b) {
    var w = wsh;
    var k = b.getAttribute('data-wish');
    if (w.picked.length >= w.n || w.picked.indexOf(k) !== -1) return;
    w.picked.push(k);
    b.disabled = true;
    b.classList.add('g-wish-used');
    var box = root.querySelector('[data-wishbox="' + (w.picked.length - 1) + '"]');
    if (box) {
      box.innerHTML = picture(k, 64);
      box.classList.add('g-wish-full');
    }
    var line = 'I want ' + withArticle(k) + '!';
    var last = w.picked.length === w.n;
    if (last) {
      busy = true;
      root.querySelectorAll('[data-wish]').forEach(function (x) { x.disabled = true; });
    }
    youSay(line, wordJa(k) + 'が ほしい！');
    say(line, null, true).then(function () {
      if (!last || wsh !== w || w.n < 2) return last && wsh === w ? boardDone(w.item, 0) : null;
      var names = w.picked.map(withArticle);
      var all = 'I want ' + names.slice(0, -1).join(', ') + (names.length > 2 ? ',' : '') + ' and ' + names[names.length - 1] + '.';
      youSay(all, w.picked.map(wordJa).join('と') + 'が ほしい！');
      // The voice says each wish again ("I want a robot! I want a doll!"): every one has its own voice file.
      return wait(300).then(function () {
        return say(w.picked.map(function (k) { return 'I want ' + withArticle(k) + '!'; }).join(' '), null, true);
      }).then(function () { boardDone(w.item, 0); });
    });
  }

  // Pass the Present: it goes round, "Stop!", unwrap one layer ("What color is the paper?"),
  // and the last layer shows the toy ("What is it?" → "It's a teddy bear!" → "I want a teddy bear!").
  var pr = null;
  var PAPER = ['red', 'yellow', 'blue', 'green', 'purple', 'orange', 'pink'];
  function presentScreen(item) {
    pr = { item: item, layers: item.layers.slice(0, boardSize('present', 2, 1, 3)), at: 0, misses: 0, wrong: 0 };
    passLayer();
  }
  function passLayer() {
    var p = pr;
    var c = p.layers[p.at];
    frame(lion('Pass the present!', 'プレゼントを まわそう！') +
      '<div class="g-stage g-stage-col"><div class="g-present g-present-pass">' + pictureOf('present_' + c, 190, 'present') + '</div>' +
      '<div class="g-choices g-present-q"></div></div>', { replay: true });
    say('Pass, pass, pass…').then(function () { return wait(900); }).then(function () {
      if (pr !== p) return;
      root.querySelector('.g-present').classList.remove('g-present-pass');
      setBubble('Stop! What color is the paper?', 'ストップ！つつみがみは なにいろ？');
      var opts = shuffle([c].concat(shuffle(PAPER.filter(function (x) { return x !== c; })).slice(0, 2)));
      root.querySelector('.g-present-q').innerHTML = opts.map(function (k) {
        var col = G.colors[k] || {};
        return '<button class="g-card g-choice g-choice-color k-press" data-paper="' + k + '"><span class="g-color-dot" style="background:' + esc(col.hex || '#ccc') + '"></span>' + two(col.english || k, col.japanese || '') + '</button>';
      }).join('');
      p.wrong = 0;
      return say('Stop! What color is the paper?');
    });
  }
  function presentWrong(b, q, sel) {
    var p = pr;
    p.wrong++;
    p.misses++;
    wiggle(b);
    me('shrug');
    setBubble('Try again!', 'もういちど！');
    say('Try again! ' + q);
    if (p.wrong >= 2) {
      var r = root.querySelector(sel);
      if (r) r.classList.add('g-glow');
    }
  }
  function tapPaper(b) {
    var p = pr;
    var c = p.layers[p.at];
    if (b.getAttribute('data-paper') !== c) return presentWrong(b, 'What color is the paper?', '[data-paper="' + c + '"]');
    busy = true;
    b.classList.add('g-right');
    var col = G.colors[c] || { english: c, japanese: '' };
    setBubble("It's " + col.english + '!', col.japanese + 'です！');
    say("It's " + col.english + '!').then(function () {
      if (pr !== p) return;
      root.querySelector('.g-present').classList.add('g-present-open');
      return wait(650);
    }).then(function () {
      if (pr !== p) return;
      busy = false;
      p.at++;
      if (p.at < p.layers.length) return passLayer();
      showToy();
    });
  }
  function showToy() {
    var p = pr;
    var item = p.item;
    var cards = shuffle(item.choices).map(function (k) {
      return '<button class="g-card g-choice g-choice-word k-press" data-ptoy="' + esc(k) + '">' + bigWord(k) + '</button>';
    }).join('');
    frame(lion('What is it? Guess the shadow!', 'なにかな？ かげを みて あてよう！') +
      '<div class="g-stage g-stage-col"><div class="g-card g-card-show g-present-toy g-sack g-shadow">' + picture(item.toy, 160) + '</div>' +
      '<div class="g-choices">' + cards + '</div></div>' + youRow(), { replay: true });
    p.wrong = 0;
    var chain = say('What is it? Guess the shadow!');
    if (BOARDS.read_choices) {
      root.querySelectorAll('[data-ptoy]').forEach(function (b) {
        chain = chain.then(function () {
          if (pr !== p || busy) return;
          b.classList.add('g-reading');
          return say(wordText(b.getAttribute('data-ptoy')) + '?').then(function () { b.classList.remove('g-reading'); });
        });
      });
    }
  }
  function tapToy(b) {
    var p = pr;
    var k = p.item.toy;
    if (b.getAttribute('data-ptoy') !== k) return presentWrong(b, 'What is it?', '[data-ptoy="' + k + '"]');
    busy = true;
    b.classList.add('g-right');
    root.querySelectorAll('[data-ptoy]').forEach(function (x) { x.disabled = true; });
    var toy = root.querySelector('.g-present-toy');
    if (toy) toy.classList.remove('g-shadow');
    var its = "It's " + withArticle(k) + '!';
    setBubble(its, wordJa(k) + 'です！');
    say(its).then(function () {
      setBubble('What do you want?', 'なにが ほしい？');
      return say('What do you want?');
    }).then(function () {
      youSay('I want ' + withArticle(k) + '!', wordJa(k) + 'が ほしい！');
      return say('I want ' + withArticle(k) + '!', null, true);
    }).then(function () {
      if (pr === p) boardDone(p.item, p.misses);
    });
  }

  // ---------- Batch 5: ABC phonics (sounds, listen, blend + letter bubbles) ----------
  // The sound files are the adult phonics files (portal/audio/phonics/): sounds/<no> = the sound + its key word,
  // alone/<no> = the sound alone, words/<word>. game.php says which exist; a missing file = the browser voice.

  var PH = G.phonics || { base: '', v: 0, sounds: {}, words: {} };
  function playFile(url, fallback) {
    return playJob('file:' + (url || fallback), url ? [url] : [], fallback, false);
  }
  function soundUrl(no, alone) {
    var s = PH.sounds[no];
    if (!s) return '';
    if (alone && s.alone) return PH.base + 'alone/' + no + '.m4a?v=' + PH.v;
    return s.file ? PH.base + 'sounds/' + no + '.m4a?v=' + PH.v : '';
  }
  // alone: just the sound (/h/); otherwise the sound and the key word (/h/ … hat).
  function playSound(no, alone) {
    var s = PH.sounds[no] || {};
    return playFile(soundUrl(no, alone), (s.letter || '') + '. ' + (s.key || ''));
  }
  function playWord(w) {
    return playFile(PH.words[w] ? PH.base + 'words/' + encodeURIComponent(w) + '.m4a?v=' + PH.v : '', w);
  }

  // Sound board: "Tap a letter. Listen!" Each letter plays its sound and key word and gets a check mark.
  // Lowercase. More than 12 sounds: pages of 12 with big arrows (never scrolling). Done when every sound on
  // the board was heard, or (a big board) with the Finish button once the first page is heard.
  var SB_PAGE = 12;
  var SPEAKER = '<svg width="54" height="54" viewBox="0 0 36 36" aria-hidden="true"><path d="M5 14 H12 L21 6 V30 L12 22 H5Z" fill="' + INK + '"/><path d="M26 12 Q31 18 26 24 M29 8 Q37 18 29 28" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>';
  var sb = null;
  function soundsScreen(item) {
    sb = { item: item, heard: {}, page: 0, pages: Math.ceil(item.sounds.length / SB_PAGE) };
    soundsPage();
    say(item.english);
  }
  function soundsPage() {
    var s = sb;
    var nos = s.item.sounds.slice(s.page * SB_PAGE, (s.page + 1) * SB_PAGE);
    var tiles = nos.map(function (no) {
      var x = PH.sounds[no] || {};
      var key = x.key || '';
      return '<button class="g-sound-tile k-press' + (s.heard[no] ? ' g-sound-done' : '') + '" data-sound="' + no + '">' +
        '<span class="g-sound-letter">' + esc(String(x.letter || '?').toLowerCase()) + '</span>' +
        (PICTURES[key] ? picture(key, 88) : '') + '<span class="g-sound-key">' + esc(key) + '</span>' +
        '<span class="g-sound-check" aria-hidden="true">✓</span></button>';
    }).join('');
    var arrows = s.pages > 1
      ? '<div class="g-sb-nav"><button class="g-sb-arrow k-press" data-sbpage="-1" aria-label="Back"' + (s.page ? '' : ' disabled') + '>◀</button>' +
        '<span class="g-sb-count">' + (s.page + 1) + ' / ' + s.pages + '</span>' +
        '<button class="g-sb-arrow k-press" data-sbpage="1" aria-label="Next"' + (s.page < s.pages - 1 ? '' : ' disabled') + '>▶</button>' +
        '<button class="k-big-btn k-green k-press g-sb-finish" data-act="sbfinish"' + (s.finish ? '' : ' hidden') + '>' + two('Finish', 'おわり') + '</button></div>'
      : '';
    frame(lion(s.item.english, s.item.japanese, { pic: SPEAKER }) +
      '<div class="g-stage g-stage-col"><div class="g-sounds' + (nos.length > 6 ? ' g-sounds-many' : '') + '">' + tiles + '</div>' + arrows + '</div>', { replay: true });
  }
  function turnSoundsPage(d) {
    var s = sb;
    s.page = Math.max(0, Math.min(s.pages - 1, s.page + d));
    soundsPage();
  }
  function tapSound(b) {
    var s = sb;
    var no = +b.getAttribute('data-sound');
    if (s.playing) return;
    s.playing = true;
    s.heard[no] = true;
    b.classList.add('g-sound-on');
    var all = s.item.sounds.every(function (n) { return s.heard[n]; });
    var pageNos = s.item.sounds.slice(s.page * SB_PAGE, (s.page + 1) * SB_PAGE);
    var pageDone = pageNos.every(function (n) { return s.heard[n]; });
    if (all) busy = true;
    playSound(no, false).then(function () {
      s.playing = false;
      if (sb !== s) return;
      b.classList.remove('g-sound-on');
      b.classList.add('g-sound-done');
      if (all) return boardDone(s.item, 0);
      if (pageDone && s.pages > 1) {
        s.finish = true;
        var f = root.querySelector('.g-sb-finish');
        if (f) f.hidden = false;
        var nx = root.querySelector('[data-sbpage="1"]');
        if (nx && !nx.disabled) nx.classList.add('g-glow');
      }
    });
  }

  // Listen and pick: hear a sound, tap its letter.
  function listenScreen(item) {
    var tiles = shuffle(item.choices).map(function (l) {
      return '<button class="g-card g-choice g-big-letter k-press" data-heard="' + esc(l) + '">' + esc(String(l).toLowerCase()) + '</button>';
    }).join('');
    frame(lion(item.english, item.japanese, { ask: true }) + '<div class="g-stage g-stage-col">' +
      '<div class="g-choices">' + tiles + '</div></div>', { replay: true });
    say('Listen!').then(function () {
      if (currentItem() === item && !busy) return playSound(item.sound, true);
    });
  }
  function answerListen(b) {
    var item = currentItem();
    var good = b.getAttribute('data-heard') === item.letter;
    setAsk(askLabel('<span class="g-ask-letter">' + esc(String(b.getAttribute('data-heard')).toLowerCase()) + '</span>', good), good ? 'good' : 'try');
    if (!good) {
      wrongAnswer(b, item, '[data-heard="' + item.letter + '"]');
      return wait(1800).then(function () {
        if (currentItem() === item && !busy) playSound(item.sound, true);
      });
    }
    busy = true;
    saveAnswer(item, wrong + 1);
    b.classList.add('g-right');
    root.querySelectorAll('[data-heard]').forEach(function (x) { x.disabled = true; });
    var s = PH.sounds[item.sound] || {};
    setBubble(String(item.letter).toLowerCase() + ' … ' + (s.key || ''), '');
    playSound(item.sound, false).then(praise).then(function () { return wait(400); }).then(next);
  }

  // Blend it: tap each letter (its sound), then Blend (the whole word). The picture shows if there is one.
  var bl = null;
  function blendScreen(item) {
    bl = { item: item, tapped: {} };
    var tiles = item.tiles.map(function (t, i) {
      return '<button class="g-blend-tile k-press' + (i === 0 ? ' g-glow' : '') + '" data-blend="' + i + '">' + esc(t[0]) + '</button>';
    }).join('');
    frame(lion(item.english, item.japanese) + '<div class="g-stage g-stage-col">' +
      '<div class="g-blend-pic">' + (PICTURES[item.word] ? picture(item.word, 120) : '') + '</div>' +
      '<div class="g-blend">' + tiles + '</div>' +
      '<button class="k-big-btn k-green k-press g-blend-go" data-act="blend" disabled>' + two('Blend!', 'つなげて よもう！') + '</button></div>', { replay: true });
    say('Tap each letter!');
  }
  function tapBlend(b) {
    var x = bl;
    var i = +b.getAttribute('data-blend');
    var t = x.item.tiles[i];
    x.tapped[i] = true;
    root.querySelectorAll('.g-blend-tile').forEach(function (e) { e.classList.remove('g-glow'); });
    b.classList.add('g-blend-on');
    playSound(t[1], true).then(function () {
      if (bl !== x) return;
      var nextTile = root.querySelector('[data-blend="' + (i + 1) + '"]');
      var all = x.item.tiles.every(function (_, k) { return x.tapped[k]; });
      if (all) {
        var go = root.querySelector('.g-blend-go');
        go.disabled = false;
        go.classList.add('g-glow');
      } else if (nextTile && !x.tapped[i + 1]) {
        nextTile.classList.add('g-glow');
      }
    });
  }
  function blendGo() {
    var x = bl;
    busy = true;
    root.querySelector('.g-blend').classList.add('g-blend-joined');
    root.querySelector('.g-blend-go').disabled = true;
    var pic = root.querySelector('.g-blend-pic');
    if (pic) pic.classList.add('g-blend-pic-on');
    setBubble(x.item.word + '!', '');
    playWord(x.item.word).then(function () {
      if (bl === x) boardDone(x.item, 0);
    });
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
    mem = mt = st = hd = pd = picked = cat = null;
    stopBubbles();
    if (sy && sy.rec) try { sy.rec.abort(); } catch (e) {}
    sy = pr = wsh = sb = bl = null;
    if (!item) return endScreen();
    if (rounds[ri].type === 'yesno') yesnoScreen(item);
    else if (rounds[ri].type === 'count') countScreen(item);
    else if (rounds[ri].type === 'pizza') pizzaScreen(item);
    else if (rounds[ri].type === 'freeze') freezeScreen(item);
    else if (rounds[ri].type === 'missing') missingScreen(item);
    else if (rounds[ri].type === 'search') searchScreen(item);
    else if (rounds[ri].type === 'cross') crossScreen(item);
    else if (rounds[ri].type === 'memory') memoryScreen(item);
    else if (rounds[ri].type === 'bubble') bubbleScreen(item);
    else if (rounds[ri].type === 'oddout') tapScreen(item, 'g-odd');
    else if (rounds[ri].type === 'match') matchScreen(item);
    else if (rounds[ri].type === 'sort') sortScreen(item);
    else if (rounds[ri].type === 'hidden') hiddenScreen(item);
    else if (rounds[ri].type === 'pick') pickScreen(item);
    else if (rounds[ri].type === 'say') sayScreen(item);
    else if (rounds[ri].type === 'elf') elfScreen(item);
    else if (rounds[ri].type === 'wish') wishScreen(item);
    else if (rounds[ri].type === 'present') presentScreen(item);
    else if (rounds[ri].type === 'sounds') soundsScreen(item);
    else if (rounds[ri].type === 'listen') listenScreen(item);
    else if (rounds[ri].type === 'blend') blendScreen(item);
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
    root.querySelectorAll('.g-answer, .g-choice, .g-letter-tile, .g-sentence').forEach(function (b) { b.disabled = true; });
    setBubble(en, jp);
    say(en).then(praise).then(function () { return wait(400); }).then(next);
  }

  // Wrong answer: a gentle wiggle, never a red cross, and the question again.
  // After 2 wrong tries the right one (or ones) glow.
  function wrongAnswer(el, item, rightSelector) {
    wrong++;
    el.classList.remove('g-wiggle');
    void el.offsetWidth;
    el.classList.add('g-wiggle');
    me('shrug');
    var b = root.querySelector('.g-bubble');
    var was = b ? b.innerHTML : '';
    setBubble('Try again!', 'もういちど！');
    say('Try again! ' + item.english).then(function () {
      if (currentItem() === item && !busy && b && b.isConnected) b.innerHTML = was;
    });
    if (wrong >= 2) {
      root.querySelectorAll(rightSelector).forEach(function (r) { r.classList.add('g-glow'); });
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
    var sack = root.querySelector('.g-sack');
    if (sack) sack.classList.remove('g-shadow');
    // A fact answer also says the whole sentence: "No, it isn't. It's a banana."
    var after = item.kind === 'fact' && item.after_correct ? item.after_correct : null;
    rightAnswer(btn, ans.english + (after ? ' ' + after.english : ''), ans.japanese + (after ? ' ' + after.japanese : ''));
  }

  function answerTap(card) {
    var item = currentItem();
    if (item.kind === 'category' && cat) return answerCategory(card);
    var answer = item.answer || item.word;
    var key = card.getAttribute('data-choice');
    var good = key === answer;
    if (isListening(item)) setAsk(askLabel(picture(key, 56), good), good ? 'good' : 'try');
    if (good) {
      var sh = root.querySelector('.g-card-show.g-shadow');
      if (sh) sh.classList.remove('g-shadow');
      var after = item.after_correct || { english: item.english, japanese: item.japanese };
      return rightAnswer(card, after.english, after.japanese);
    }
    wrongAnswer(card, item, '[data-choice="' + answer + '"]');
  }

  var lastReplay = 0;
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-act');
    if (act === 'start') {
      // The Play tap also wakes up the music maker (iPhone/iPad only allow sound after a tap).
      if (hasMusic) window.H212Music.unlock();
      unlockVoice();
      saveStart();
      if (rounds.length > 1) return roundScreen(rounds[0], 1);
      return showItem();
    }
    if (act === 'go') return showItem();
    if (act === 'again') return location.reload();
    if (act === 'replay') {
      var item = currentItem();
      // A quick second tap is ignored (no stacked voices).
      var now = Date.now();
      if (now - lastReplay < 700) return;
      lastReplay = now;
      if (item && !busy) {
        if (rounds[ri].type === 'tap') askTap(item);
        else if (shop) say(countGoal(item).spoken);
        else if (pizza) sayOrder();
        else if (rounds[ri].type === 'sounds') say(item.english);
        else if (freeze && freeze.phase === 'like') say(item.like.english);
        else if (freeze && freeze.phase !== 'pick') say(freeze.phase === 'dance' ? 'Dance!' : 'Freeze!');
        else if (cw) say(cw.b.words[cw.active].text + '.');
        else if (hd) hiddenAsk();
        else if (rounds[ri].type === 'pick') askPick(item);
        else if (rounds[ri].type === 'listen') playSound(item.sound, true);
        else if (rounds[ri].type === 'blend') playWord(item.word);
        else if (rounds[ri].type === 'bubble' && item.sound) playSound(item.sound, true);
        else if (pr) say(root.querySelector('[data-ptoy]') ? 'What is it? Guess the shadow!' : 'What color is the paper?');
        else say(item.english, item.audio);
      }
      return;
    }
    if (act === 'freeze') return tapFreeze(b);
    if (act === 'mic-on' || act === 'mic-off') {
      setMic(act === 'mic-on');
      if (sy && !busy) {
        sayScreen(sy.item);
        if (act === 'mic-on') listenSay();
      }
      return;
    }
    if (busy) return;
    if (act === 'listen') return listenSay();
    if (act === 'said') return finishSay('Great! ' + cap(wordText(currentItem().word)) + '!', 'じょうず！' + wordJa(currentItem().word));
    if (act === 'hearsound') return playSound(currentItem().sound, true);
    if (act === 'sbfinish' && sb) {
      busy = true;
      return boardDone(sb.item, 0);
    }
    if (b.hasAttribute('data-sbpage') && sb) return turnSoundsPage(+b.getAttribute('data-sbpage'));
    if (act === 'blend' && bl) return blendGo();
    if (b.hasAttribute('data-answer')) return answerYesNo(b);
    if (b.hasAttribute('data-sentence')) return answerPick(b);
    if (b.hasAttribute('data-elf')) return answerElf(b);
    if (b.hasAttribute('data-wish') && wsh) return tapWish(b);
    if (b.hasAttribute('data-paper') && pr) return tapPaper(b);
    if (b.hasAttribute('data-ptoy') && pr) return tapToy(b);
    if (b.hasAttribute('data-sound') && sb) return tapSound(b);
    if (b.hasAttribute('data-heard')) return answerListen(b);
    if (b.hasAttribute('data-blend') && bl) return tapBlend(b);
    if (b.hasAttribute('data-choice')) return rounds[ri].type === 'bubble' ? answerBubble(b) : answerTap(b);
    if (b.hasAttribute('data-mem') && mem) return tapMemory(b);
    if (b.hasAttribute('data-hide') && hd) return tapHidden(b);
    if (b.hasAttribute('data-hdfind') && hd) return say(cap(wordText(hd.find[+b.getAttribute('data-hdfind')])) + '.');
    if (b.hasAttribute('data-target') && (mt || st)) return tapTarget(b);
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
