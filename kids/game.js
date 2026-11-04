/* 212 Kids - the game engine. Plays one game from games.json (sent by game.php as window.H212_KIDS_GAME).
 *
 * Round types:
 *   yesno  A question with two big answer buttons.
 *          kind "opinion" (default): "Do you like apples?" -> "Yes, I do!" / "No, I don't." Both are right.
 *          kind "fact": "Is it an apple?" -> "Yes, it is!" / "No, it isn't." One is right (`correct`).
 *          yes_label / no_label change the button sentences ("Yes, I am!" ...).
 *   tap    The lion asks (`english`); the child taps the answer out of 3 (max 4) choices.
 *          show: none | picture | word        what appears big on screen
 *          choice_kind: picture | word | color what the buttons are
 *          read_choices: the lion reads the word buttons aloud (for children who can't read yet)
 *          answer: the right choice (default: the item's word)
 *          after_correct: what the lion says after a right answer ("It's a banana.")
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

  var PICTURES = {
    apple: ['0 0 100 100', '<path d="M50 26 C30 10 4 26 10 54 C15 80 34 94 50 86 C66 94 85 80 90 54 C96 26 70 10 50 26Z" fill="#FF5A4F" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M56 16 C66 6 80 8 82 14 C74 22 62 22 56 16Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>'],
    banana: ['0 -20 130 130', '<path d="M8 20 C20 62 62 80 112 44 C118 40 114 32 106 36 C64 58 34 44 22 12 C18 4 6 10 8 20Z" fill="#FFD84D" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/>'],
    orange: ['0 0 100 100', '<circle cx="50" cy="56" r="38" fill="#FF9F2E" stroke="' + INK + '" stroke-width="6"/><path d="M50 18 C56 8 70 8 74 13 C67 21 56 21 50 18Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><circle cx="38" cy="48" r="3" fill="#D9780E"/><circle cx="62" cy="60" r="3" fill="#D9780E"/><circle cx="46" cy="72" r="3" fill="#D9780E"/>'],
    grapes: ['0 0 100 100', '<path d="M50 26 V10" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M52 16 C60 6 74 8 76 14 C68 22 58 22 52 16Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><g fill="#9B6BD6" stroke="' + INK + '" stroke-width="4"><circle cx="38" cy="34" r="12"/><circle cx="62" cy="34" r="12"/><circle cx="27" cy="54" r="12"/><circle cx="50" cy="54" r="12"/><circle cx="73" cy="54" r="12"/><circle cx="38" cy="73" r="12"/><circle cx="62" cy="73" r="12"/><circle cx="50" cy="90" r="9"/></g>'],
    strawberry: ['0 0 100 100', '<path d="M50 94 C24 82 10 56 17 39 C23 27 39 29 50 33 C61 29 77 27 83 39 C90 56 76 82 50 94Z" fill="#FF4D5E" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><g fill="#FFE27A"><ellipse cx="36" cy="50" rx="2.5" ry="4"/><ellipse cx="52" cy="48" rx="2.5" ry="4"/><ellipse cx="66" cy="52" rx="2.5" ry="4"/><ellipse cx="42" cy="66" rx="2.5" ry="4"/><ellipse cx="58" cy="66" rx="2.5" ry="4"/><ellipse cx="50" cy="80" rx="2.5" ry="4"/></g><path d="M30 31 L41 21 L50 28 L59 21 L70 31 L57 36 L50 31 L43 36Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>'],
    watermelon: ['0 10 100 80', '<path d="M5 34 A45 45 0 0 0 95 34 Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M15 34 A35 35 0 0 0 85 34 Z" fill="#FF5A6E"/><path d="M5 34 H95" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><g fill="' + INK + '"><ellipse cx="34" cy="46" rx="3" ry="4.5"/><ellipse cx="50" cy="54" rx="3" ry="4.5"/><ellipse cx="66" cy="46" rx="3" ry="4.5"/><ellipse cx="42" cy="62" rx="3" ry="4.5"/><ellipse cx="58" cy="62" rx="3" ry="4.5"/></g>']
  };

  function picture(wordKey, size) {
    var w = G.words[wordKey] || {};
    var label = w.english || wordKey;
    if (w.image) {
      return '<img class="g-pic" src="images/' + esc(w.image) + '" alt="' + esc(label) + '" width="' + size + '" height="' + size + '">';
    }
    var p = PICTURES[w.picture] || PICTURES.apple;
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
  function say(text, audioFile) {
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
        u.rate = 0.85;
        u.pitch = 1.1;
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
    return { type: r.type, english: r.english, japanese: r.japanese, items: shuffle(r.items).slice(0, r.per_play || r.items.length) };
  });
  var total = rounds.reduce(function (n, r) { return n + r.items.length; }, 0);
  var done = 0;
  var busy = false;

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

  function yesnoScreen(item) {
    var yes = label(item, 'yes');
    var no = label(item, 'no');
    frame(lion(item.english, item.japanese) +
      '<div class="g-stage"><div class="g-card g-card-big">' + picture(item.word, 220) + '</div></div>' +
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

  function endScreen() {
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

  // Save the stars and sticker. If saving fails the child still sees the reward.
  function saveFinish() {
    fetch('save-progress.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce: G.nonce, child: G.child.id, game: G.id, stars: STARS_PER_GAME })
    }).catch(function () {});
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
    if (!item) return endScreen();
    if (rounds[ri].type === 'yesno') yesnoScreen(item);
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
    el.classList.add(el.classList.contains('g-answer') ? 'g-picked' : 'g-right');
    root.querySelectorAll('.g-answer, .g-choice').forEach(function (b) { b.disabled = true; });
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
      if (rounds.length > 1) return roundScreen(rounds[0], 1);
      return showItem();
    }
    if (act === 'go') return showItem();
    if (act === 'again') return location.reload();
    if (act === 'replay') {
      var item = currentItem();
      if (item && !busy) {
        if (rounds[ri].type === 'tap') askTap(item);
        else say(item.english, item.audio);
      }
      return;
    }
    if (busy) return;
    if (b.hasAttribute('data-answer')) return answerYesNo(b);
    if (b.hasAttribute('data-choice')) return answerTap(b);
  });

  startScreen();
})();
