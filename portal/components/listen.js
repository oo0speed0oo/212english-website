// "Robot voice" for Listening questions.
//
// The quoted part of a Listening question (e.g. You hear "I live in Osaka.")
// is hidden on screen and read aloud by the device's built-in voice when the
// student taps the Listen button. No audio files, nothing is sent anywhere.
//
// Used by homework.php and tests.php:
//   var listenHtml = H212Listen.render(q);   // null = show the question as normal
//
// Needs window.H212_T to contain: listen.who, listen.robot, listen.button,
// listen.playing, listen.no_voice  (see h212_js_strings in each page).
var H212Listen = (function () {
  var lines    = [];   // the sentence(s) to speak for the question on screen
  var voices   = [];   // English voices on this device, best first
  var speaking = false;
  var playId   = 0;    // so a cancelled earlier play cannot reset the button of a newer one

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
  function parse(question) {
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
    if (!spoken.length) return null;
    // Anything before "You hear" stays visible (e.g. You ask Tom, "Are you busy?").
    var prefix = marker >= 0 ? s.slice(0, marker) : s.slice(0, first);
    var suffix = s.slice(lastEnd);
    return { prefix: prefix.trim(), spoken: spoken, suffix: suffix.trim() };
  }

  function stop() {
    speaking = false;
    playId++;
    if (supported()) window.speechSynthesis.cancel();
  }

  function setButton(playing) {
    var btn = document.getElementById('listen-btn');
    if (!btn) return;
    btn.textContent = playing ? window.H212_T['listen.playing'] : window.H212_T['listen.button'];
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

  // Called from the Listen button. Must run straight from the tap (iPhone rule).
  function play() {
    if (!lines.length) return;
    if (!supported()) { showFallback(); return; }
    if (!voices.length) loadVoices();
    if (!voices.length) { showFallback(); return; }

    var synth = window.speechSynthesis;
    synth.cancel();
    var pair = lines.length > 1 ? pickTwo() : [voices[0], null];
    speaking = true;
    var myId = ++playId;
    setButton(true);

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

  // Returns the HTML for the Listen part of a question, or null if the
  // question is not a Listening question with quoted text.
  function render(q) {
    stop();
    lines = [];
    if (!q || q.type !== 'listening') return null;
    var p = parse(q.question);
    if (!p) return null;
    lines = p.spoken;

    var T = window.H212_T;
    var html = '<div class="listen-who">'
      + '<div class="listen-who-title">' + T['listen.who'] + '</div>'
      + '<div class="listen-who-options" role="radiogroup" aria-label="' + T['listen.who'] + '">'
      + '<span class="listen-who-opt selected" role="radio" aria-checked="true">🤖 ' + T['listen.robot'] + '</span>'
      + '</div></div>';
    if (p.prefix) html += '<div class="question-text listen-prefix">' + p.prefix + '</div>';
    html += '<button type="button" class="listen-btn" id="listen-btn" onclick="H212Listen.play()">' + T['listen.button'] + '</button>'
      + '<div class="listen-msg" id="listen-msg" role="status"></div>'
      + '<div class="listen-reveal" id="listen-reveal" hidden></div>';
    if (p.suffix) html += '<div class="question-text listen-suffix">' + p.suffix + '</div>';
    return html;
  }

  return { render: render, play: play, stop: stop, parse: parse };
})();
