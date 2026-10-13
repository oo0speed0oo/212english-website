// Listening questions: the quoted part of the question (e.g. You hear
// "I live in Osaka.") is hidden on screen and played when the student taps
// the Listen button.
//
// Conversation questions (homework part 6): You hear "line 1" "line 2" Question?
// Only a big Play button and the text after the quotes are shown at first. Two
// quoted lines = two people (two different voices, a short pause between).
// After the student answers, reveal() shows the conversation text.
//
// Conversation questions play a recorded file (audio/conversation/<id>.m4a) when there is one,
// otherwise the robot voice.
//
// Voices: a recorded mp3 voice (American/British, woman/man - files in
// portal/audio/<voice>/<id>.mp3) or, if there is no mp3 or it fails to load,
// the robot (the device's built-in English voice, no files needed).
// The student's choice is remembered in a cookie.
//
// Used by homework.php and tests.php:
//   var listenHtml = H212Listen.render(q);   // null = show the question as normal
//
// Needs window.H212_T (listen.* strings, see h212_js_strings in each page)
// and window.H212_VOICES (which ids have an mp3, from inc/voices.php).
var H212Listen = (function () {
  var lines    = [];   // the sentence(s) to speak for the question on screen
  var voices   = [];   // English voices on this device, best first
  var speaking = false;
  var playId   = 0;    // so a cancelled earlier play cannot reset the button of a newer one
  var VOICE_KEYS = ['us_woman', 'us_man', 'uk_woman', 'uk_man'];
  var COOKIE   = 'h212_voice';
  var cur      = { type: '', id: null, avail: [], sel: 'robot', effective: 'robot', mixPick: null, audio: null };

  // macOS ships some joke voices - never use these for teaching.
  var NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox)\b/i;
  var MALE    = /^(Daniel|Tom|Alex|Fred|Aaron|Arthur|Oliver|Gordon|Rishi|Evan|Nathan|Reed|Eddy|Ralph|Lee|Junior|David|Mark|James|George|Guy|Ryan|Rocko)\b/i;
  var FEMALE  = /^(Samantha|Ava|Allison|Susan|Karen|Moira|Tessa|Serena|Victoria|Kate|Fiona|Nicky|Zoe|Flo|Sandy|Shelley|Martha|Catherine|Jenny|Aria|Libby|Sonia|Emma|Amy|Joanna|Kathy|Princess|Grandma)\b/i;

  function supported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  function score(v) {
    var s = 0;
    if (/^en[-_]US$/i.test(v.lang)) s += 10;
    else if (/^en[-_](GB|AU|CA|IE|ZA|IN)$/i.test(v.lang)) s += 5;
    if (/enhanced|premium|natural|neural/i.test(v.name)) s += 6;
    if (/compact/i.test(v.name)) s -= 3;
    if (/^(Samantha|Ava|Allison|Daniel|Tom|Google US English)\b/i.test(v.name)) s += 2;
    return s;
  }

  function loadVoices() {
    if (!supported()) return;
    var all = window.speechSynthesis.getVoices() || [];
    voices = all.filter(function (v) {
      // English only - students use Japanese phones, so never fall back to a Japanese voice.
      return /^en([-_]|$)/i.test(v.lang) && !NOVELTY.test(v.name);
    }).sort(function (a, b) { return score(b) - score(a); });
  }

  // Voices load late on some browsers, so ask early and again when they arrive.
  if (supported()) {
    loadVoices();
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    window.addEventListener('pagehide', function () { window.speechSynthesis.cancel(); });
  }

  // Pick two different-sounding voices for a two-person dialogue.
  function pickTwo() {
    var a = voices[0];
    var b = null;
    var wantMale = a && FEMALE.test(a.name);
    var wantFemale = a && MALE.test(a.name);
    var i;
    for (i = 1; i < voices.length && !b; i++) {
      if (voices[i].name === a.name) continue;
      if ((wantMale && MALE.test(voices[i].name)) || (wantFemale && FEMALE.test(voices[i].name))) b = voices[i];
    }
    for (i = 1; i < voices.length && !b; i++) {
      if (voices[i].name !== a.name) b = voices[i];
    }
    return [a, b]; // b is null if the device only has one English voice
  }

  // Split a question into: text to keep on screen before the Listen button,
  // the sentence(s) to speak, and the question text after the button.
  // Returns null if the question has no quoted text.
  function parse(question, type) {
    var s = String(question);
    var marker = s.search(/you hear/i);
    var from = marker >= 0 ? marker : 0;
    var re = /"([^"]+)"/g;
    var m, spoken = [], first = -1, lastEnd = -1;
    re.lastIndex = from;
    while ((m = re.exec(s)) !== null) {
      if (first < 0) first = m.index;
      lastEnd = re.lastIndex;
      spoken.push(m[1].trim());
    }
    if (!spoken.length) {
      // A Conversation line with no quote marks: the whole text is what the student hears.
      if (type === 'conversation' && s.trim()) return { prefix: '', spoken: [s.trim()], suffix: '' };
      return null;
    }
    // Anything before "You hear" stays visible (e.g. You ask Tom, "Are you busy?").
    var prefix = marker >= 0 ? s.slice(0, marker) : s.slice(0, first);
    var suffix = s.slice(lastEnd);
    return { prefix: prefix.trim(), spoken: spoken, suffix: suffix.trim() };
  }

  function stop() {
    speaking = false;
    playId++;
    if (cur.audio) { try { cur.audio.pause(); } catch (e) {} }
    if (supported()) window.speechSynthesis.cancel();
  }

  // ── Student's voice choice (cookie) ──
  function getPref() {
    var m = document.cookie.match(/(?:^|; )h212_voice=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : 'mix';
  }
  function setPref(v) {
    document.cookie = COOKIE + '=' + encodeURIComponent(v) + '; path=/; max-age=31536000; SameSite=Lax';
  }

  // Which mp3 voices exist for this question id?
  function availableVoices(id) {
    var out = [], ids = (window.H212_VOICES && window.H212_VOICES.ids) || {};
    for (var i = 0; i < VOICE_KEYS.length; i++) {
      var list = ids[VOICE_KEYS[i]] || [];
      if (list.indexOf(String(id)) >= 0) out.push(VOICE_KEYS[i]);
    }
    return out;
  }

  // Work out which chip is highlighted and which voice will actually play.
  function resolve() {
    var pref = getPref(), a = cur.avail;
    if (!a.length || pref === 'robot') {
      cur.sel = 'robot'; cur.effective = 'robot';
    } else if (a.indexOf(pref) >= 0) {
      cur.sel = pref; cur.effective = pref;
    } else {
      // Mix (the default), or a voice this question doesn't have: random available voice
      if (!cur.mixPick || a.indexOf(cur.mixPick) < 0) cur.mixPick = a[Math.floor(Math.random() * a.length)];
      cur.sel = a.length > 1 ? 'mix' : a[0];
      cur.effective = cur.mixPick;
    }
    prepareAudio();
  }

  // Load the mp3 now (they are tiny) so a broken file is known before the tap.
  function prepareAudio() {
    cur.audio = null;
    if (cur.effective === 'robot') return;
    var a = new Audio();
    a.preload = 'auto';
    var v = (window.H212_VOICES && window.H212_VOICES.v) || 0;
    a.src = 'audio/' + cur.effective + '/' + cur.id + '.mp3?v=' + v;
    cur.audio = a;
  }

  function refreshChips() {
    var chips = document.querySelectorAll('.listen-who-opt');
    for (var i = 0; i < chips.length; i++) {
      var on = chips[i].getAttribute('data-voice') === cur.sel;
      chips[i].classList.toggle('selected', on);
      chips[i].setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  // Called when the student taps a face / Robot / Mix.
  function choose(key) {
    stop();
    setButton(false);
    setPref(key);
    cur.mixPick = null;
    resolve();
    refreshChips();
  }

  function setButton(playing) {
    var btn = document.getElementById('listen-btn');
    if (!btn) return;
    var idle = cur.type === 'conversation' ? window.H212_T['listen.play'] : window.H212_T['listen.button'];
    btn.textContent = playing ? window.H212_T['listen.playing'] : idle;
    btn.classList.toggle('playing', playing);
  }

  // No English voice (or no speech support): show the sentence instead,
  // so the student is never stuck on a question they cannot answer.
  function showFallback() {
    var msg = document.getElementById('listen-msg');
    var rev = document.getElementById('listen-reveal');
    if (msg) msg.textContent = window.H212_T['listen.no_voice'];
    if (rev) {
      rev.textContent = '';
      for (var i = 0; i < lines.length; i++) {
        var p = document.createElement('div');
        p.textContent = '“' + lines[i] + '”';
        rev.appendChild(p);
      }
      rev.hidden = false;
    }
  }

  // Show the conversation text (Conversation questions, after the student has answered)
  function reveal() {
    var rev = document.getElementById('listen-reveal');
    if (!rev || !lines.length) return;
    rev.textContent = '';
    var label = document.createElement('div');
    label.className = 'listen-reveal-label';
    label.textContent = window.H212_T['conv.text_label'] || '';
    rev.appendChild(label);
    for (var i = 0; i < lines.length; i++) {
      var p = document.createElement('div');
      p.textContent = '“' + lines[i] + '”';
      rev.appendChild(p);
    }
    rev.hidden = false;
  }

  // Called from the Listen button. Must run straight from the tap (iPhone rule).
  function play() {
    if (!lines.length) return;
    stop();
    var a = cur.audio;
    if (cur.effective !== 'robot' && a && !a.error) {
      var myId = ++playId;
      setButton(true);
      a.currentTime = 0;
      a.onended = function () { if (myId === playId) setButton(false); };
      a.onerror = function () { if (myId === playId) { setButton(false); speakRobot(); } };
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function (e) {
        if (myId !== playId || (e && e.name === 'AbortError')) return;
        setButton(false);
        speakRobot();   // mp3 would not play: use the robot instead
      });
      return;
    }
    speakRobot();
  }

  // Say any English text with the robot voice (Sentence Builder answers).
  // Works only if the English voice is available; silently does nothing otherwise.
  function speakText(text) {
    if (!supported() || !text) return;
    if (!voices.length) loadVoices();
    if (!voices.length) return;
    var synth = window.speechSynthesis;
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.voice = voices[0];
    u.lang  = voices[0].lang || 'en-US';
    u.rate  = 0.9;
    synth.speak(u);
  }

  function speakRobot() {
    if (!supported()) { showFallback(); return; }
    if (!voices.length) loadVoices();
    if (!voices.length) { showFallback(); return; }

    var synth = window.speechSynthesis;
    synth.cancel();
    var pair = lines.length > 1 ? pickTwo() : [voices[0], null];
    speaking = true;
    var myId = ++playId;
    setButton(true);

    // Conversation: say line 1, wait a moment, then line 2 in the other voice
    if (cur.type === 'conversation' && lines.length > 1) {
      var say = function (i) {
        if (myId !== playId) return;
        var u = new SpeechSynthesisUtterance(lines[i]);
        var v = (i % 2 === 1 && pair[1]) ? pair[1] : pair[0];
        u.voice = v; u.lang = v.lang || 'en-US'; u.rate = 0.9;
        if (i % 2 === 1 && !pair[1]) u.pitch = 0.75;
        u.onend = u.onerror = function () {
          if (myId !== playId) return;
          if (i + 1 < lines.length) { setTimeout(function () { say(i + 1); }, 500); }
          else { speaking = false; setButton(false); }
        };
        synth.speak(u);
      };
      say(0);
      return;
    }

    for (var i = 0; i < lines.length; i++) {
      var u = new SpeechSynthesisUtterance(lines[i]);
      var v = (i % 2 === 1 && pair[1]) ? pair[1] : pair[0];
      u.voice = v;
      u.lang  = v.lang || 'en-US';
      u.rate  = 0.9;
      // Only one English voice on the device: make the second speaker deeper.
      if (i % 2 === 1 && !pair[1]) u.pitch = 0.75;
      if (i === lines.length - 1) {
        u.onend = u.onerror = function () {
          if (myId !== playId) return;
          speaking = false;
          setButton(false);
        };
      }
      synth.speak(u);
    }
  }

  function chip(key, face, label) {
    var on = key === cur.sel;
    return '<button type="button" class="listen-who-opt' + (on ? ' selected' : '') + '" role="radio" aria-checked="' + (on ? 'true' : 'false')
      + '" data-voice="' + key + '" onclick="H212Listen.choose(\'' + key + '\')">'
      + face + '<span class="listen-who-label">' + label + '</span></button>';
  }

  // Returns the HTML for the Listen part of a question, or null if the
  // question is not a Listening question with quoted text.
  function render(q) {
    stop();
    lines = [];
    if (!q || (q.type !== 'listening' && q.type !== 'conversation')) return null;
    var p = parse(q.question, q.type);
    if (!p) return null;
    // Conversation: after the line, ask for the best reply.
    if (q.type === 'conversation' && !p.suffix) p.suffix = window.H212_T['conv.prompt'] || '';
    lines = p.spoken;
    cur.type = q.type;

    var T = window.H212_T;
    if (q.type === 'conversation') {
      // Conversation: only a big Play button (robot voice) and the part after the quotes
      cur.id = q.id; cur.avail = []; cur.mixPick = null; cur.audio = null; cur.sel = 'robot'; cur.effective = 'robot';
      // A recorded file for this question (audio/conversation/<id>.m4a) plays when it exists;
      // if it is missing or fails to load, play() falls back to the robot voice.
      var cv = window.H212_VOICES && window.H212_VOICES.conv;
      if (cv && cv[q.id] && typeof Audio !== 'undefined') {
        var a = new Audio();
        a.preload = 'auto';
        a.src = 'audio/conversation/' + q.id + '.m4a?v=' + cv[q.id];
        cur.audio = a;
        cur.effective = 'file';
      }
      var h = '<button type="button" class="listen-btn listen-btn-big" id="listen-btn" onclick="H212Listen.play()">' + T['listen.play'] + '</button>'
        + '<div class="listen-msg" id="listen-msg" role="status"></div>'
        + '<div class="listen-reveal" id="listen-reveal" hidden></div>';
      if (p.suffix) h += '<div class="question-text listen-suffix">' + p.suffix + '</div>';
      return h;
    }

    cur.id = q.id;
    cur.avail = availableVoices(q.id);
    cur.mixPick = null;
    resolve();

    var chips = [];
    if (cur.avail.length > 1) chips.push(chip('mix', '<span class="listen-face listen-face-emoji">🎲</span>', T['listen.mix']));
    chips.push(chip('robot', '<span class="listen-face listen-face-emoji">🤖</span>', T['listen.robot']));
    for (var i = 0; i < VOICE_KEYS.length; i++) {
      if (cur.avail.indexOf(VOICE_KEYS[i]) < 0) continue;
      chips.push(chip(VOICE_KEYS[i],
        '<img class="listen-face" src="images/voices/' + VOICE_KEYS[i] + '.svg" alt="" width="48" height="48">',
        T['listen.' + VOICE_KEYS[i]]));
    }
    var html = '<div class="listen-who">'
      + '<div class="listen-who-title">' + T['listen.who'] + '</div>'
      + '<div class="listen-who-options" role="radiogroup" aria-label="' + T['listen.who'] + '">'
      + chips.join('')
      + '</div></div>';
    if (p.prefix) html += '<div class="question-text listen-prefix">' + p.prefix + '</div>';
    html += '<button type="button" class="listen-btn" id="listen-btn" onclick="H212Listen.play()">' + T['listen.button'] + '</button>'
      + '<div class="listen-msg" id="listen-msg" role="status"></div>'
      + '<div class="listen-reveal" id="listen-reveal" hidden></div>';
    if (p.suffix) html += '<div class="question-text listen-suffix">' + p.suffix + '</div>';
    return html;
  }

  return { render: render, play: play, stop: stop, parse: parse, choose: choose, speakText: speakText, reveal: reveal };
})();
