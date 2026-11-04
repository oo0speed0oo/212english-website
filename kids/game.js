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
    watermelon: ['0 10 100 80', '<path d="M5 34 A45 45 0 0 0 95 34 Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M15 34 A35 35 0 0 0 85 34 Z" fill="#FF5A6E"/><path d="M5 34 H95" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><g fill="' + INK + '"><ellipse cx="34" cy="46" rx="3" ry="4.5"/><ellipse cx="50" cy="54" rx="3" ry="4.5"/><ellipse cx="66" cy="46" rx="3" ry="4.5"/><ellipse cx="42" cy="62" rx="3" ry="4.5"/><ellipse cx="58" cy="62" rx="3" ry="4.5"/></g>'],
    // Pizza toppings (Pizza Shop) and the pizza sticker.
    cheese: ['0 0 100 100', '<path d="M10 74 L90 30 L90 74 Z" fill="#FFD84D" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M10 74 L90 30" stroke="#FFF1A8" stroke-width="5" stroke-linecap="round" opacity=".8"/><g fill="#E8B92E"><circle cx="70" cy="58" r="7"/><circle cx="82" cy="44" r="4"/><circle cx="48" cy="66" r="4.5"/></g>'],
    mushrooms: ['0 0 100 100', '<rect x="38" y="50" width="24" height="36" rx="10" fill="#FFF1D6" stroke="' + INK + '" stroke-width="6"/><path d="M12 56 Q14 14 50 12 Q86 14 88 56 Z" fill="#C98A4B" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><g fill="#FFF1D6"><circle cx="34" cy="38" r="6"/><circle cx="58" cy="28" r="5"/><circle cx="68" cy="44" r="4.5"/></g>'],
    tomato: ['0 0 100 100', '<circle cx="50" cy="56" r="36" fill="#FF4D4D" stroke="' + INK + '" stroke-width="6"/><path d="M50 22 L58 12 M34 26 L50 26 L66 26 M40 18 L50 26 L60 18" stroke="#3FA864" stroke-width="6" stroke-linecap="round"/><ellipse cx="36" cy="44" rx="7" ry="4" fill="#FF8A8A" transform="rotate(-30 36 44)"/>'],
    corn: ['0 0 100 100', '<ellipse cx="50" cy="48" rx="18" ry="36" fill="#FFD84D" stroke="' + INK + '" stroke-width="6"/><g stroke="#E8B92E" stroke-width="3"><path d="M36 30 H64 M33 42 H67 M33 54 H67 M36 66 H64"/><path d="M44 16 V80 M56 16 V80"/></g><path d="M50 90 Q24 80 22 46 Q36 62 44 78 Z M50 90 Q76 80 78 46 Q64 62 56 78 Z" fill="#5CC98B" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>'],
    onion: ['0 0 100 100', '<path d="M50 12 Q54 30 72 44 Q90 62 72 82 Q50 96 28 82 Q10 62 28 44 Q46 30 50 12 Z" fill="#C9A0DC" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="M50 26 Q40 50 44 86 M50 26 Q62 50 58 86" stroke="#9B6BD6" stroke-width="4" fill="none"/><path d="M42 92 L40 98 M50 93 V99 M58 92 L60 98" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>'],
    pineapple: ['0 0 100 100', '<path d="M50 30 L38 6 L48 18 L50 2 L52 18 L62 6 Z" fill="#3FA864" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><ellipse cx="50" cy="62" rx="26" ry="32" fill="#FFC233" stroke="' + INK + '" stroke-width="6"/><g stroke="#C98A1E" stroke-width="3"><path d="M30 46 L66 86 M34 36 L74 80 M30 66 L50 90"/><path d="M70 46 L34 86 M66 36 L26 80 M70 66 L50 90"/></g>'],
    music: ['0 0 70 70', '<path d="M28 50 V14 L56 8 V42" stroke="' + INK + '" stroke-width="6" fill="none" stroke-linejoin="round"/><path d="M28 24 L56 18" stroke="' + INK + '" stroke-width="6"/><ellipse cx="21" cy="50" rx="10" ry="8" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/><ellipse cx="49" cy="43" rx="10" ry="8" fill="#FF7DA8" stroke="' + INK + '" stroke-width="4"/>'],
    broccoli: ['0 0 100 100', '<path d="M42 58 L40 90 H60 L58 58 Z" fill="#8ED6A0" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><g fill="#3FA864" stroke="' + INK + '" stroke-width="5"><circle cx="32" cy="48" r="16"/><circle cx="68" cy="48" r="16"/><circle cx="50" cy="34" r="20"/><circle cx="50" cy="56" r="14"/></g>'],
    pizza: ['0 0 100 100', '<circle cx="50" cy="50" r="44" fill="#E8B465" stroke="' + INK + '" stroke-width="6"/><circle cx="50" cy="50" r="35" fill="#E8453C"/><path d="M22 46 Q30 24 52 20 Q76 24 80 48 Q78 74 54 80 Q28 78 22 46 Z" fill="#FFD84D"/><g fill="#B8322C" stroke="' + INK + '" stroke-width="3"><circle cx="38" cy="40" r="7"/><circle cx="62" cy="38" r="7"/><circle cx="56" cy="62" r="7"/><circle cx="36" cy="62" r="6"/></g>']
  };

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
    return { type: r.type, english: r.english, japanese: r.japanese, avatar_pose: r.avatar_pose, items: shuffle(r.items).slice(0, r.per_play || r.items.length) };
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

  function endScreen() {
    if (window.H212Music) window.H212Music.stop();
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
    if (!item) return endScreen();
    if (rounds[ri].type === 'yesno') yesnoScreen(item);
    else if (rounds[ri].type === 'count') countScreen(item);
    else if (rounds[ri].type === 'pizza') pizzaScreen(item);
    else if (rounds[ri].type === 'freeze') freezeScreen(item);
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
  });

  startScreen();
})();
