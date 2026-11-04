/* 212 Kids - a tiny music maker. All sounds are made in code (Web Audio): no music files, no license.
 *
 *   H212Music.supported()     can this browser play it?
 *   H212Music.unlock()        call inside a tap (iPhone/iPad only allow sound after a tap)
 *   H212Music.start('dance')  playful beat + xylophone tune, about 100 beats per minute (Freeze Dance)
 *   H212Music.start('calm')   calm background music: one of 3 soft music-box loops, picked at random
 *   H212Music.stop()          stops at once
 *   H212Music.playing()       true while music plays
 * The music is kept quiet so the lion's voice is always louder.
 *
 * Background music (Prompt E), separate from the lion's voice and sound effects:
 *   H212Music.bg.button()     HTML for the big round music on/off button ('' if this browser can't play music)
 *   H212Music.bg.pause()      no background music on this page (Freeze Dance has its own beat)
 *   H212Music.bg.resume()     background music may play again (and starts, if it is switched on)
 * It starts after the first tap on the page (iPhone/iPad rule). ON by default, quiet.
 * The on/off choice is remembered on this device (localStorage "h212_kids_music").
 */
(function () {
  'use strict';

  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var master = null;
  var noise = null;
  var timer = 0;
  var nextTime = 0;
  var step = 0;
  var style = '';
  var on = false;
  var tune = 2;

  // Pentatonic notes (C D E G A) never sound wrong together.
  var PENTA = [0, 2, 4, 7, 9];
  var STYLES = {
    dance: { bpm: 100, volume: 0.16 },
    calm: { bpm: 66, volume: 0.07 }
  };
  // The 3 calm loops: [beats per minute, key note]. 0 music box, 1 lullaby, 2 raindrops.
  var CALM = [[66, 523.25], [58, 440], [52, 587.33]];
  var calm = 0;

  function hz(semitones, base) {
    return base * Math.pow(2, semitones / 12);
  }

  function ensure() {
    if (!AC) return false;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      // A short burst of noise, reused for the hi-hat.
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  // One soft "xylophone / music box" note.
  function bell(freq, t, dur, vol, type) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function kick(t) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.14);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.25);
  }

  function hat(t) {
    var s = ctx.createBufferSource();
    var f = ctx.createBiquadFilter();
    var g = ctx.createGain();
    s.buffer = noise;
    f.type = 'highpass';
    f.frequency.value = 7000;
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start(t);
    s.stop(t + 0.06);
  }

  // The tune wanders up and down the pentatonic scale, one small step at a time.
  function nextNote() {
    tune += Math.random() < 0.5 ? -1 : 1;
    if (Math.random() < 0.2) tune += Math.random() < 0.5 ? -1 : 1;
    tune = Math.max(0, Math.min(9, tune));
    return PENTA[tune % 5] + 12 * Math.floor(tune / 5);
  }

  // Plays one eighth-note step.
  function play(t) {
    var beat = step % 8;
    if (style === 'dance') {
      if (beat === 0 || beat === 4) kick(t);
      if (beat % 2 === 1) hat(t);
      if (beat === 0 || beat === 3 || beat === 4 || beat === 6) bell(hz(PENTA[(step >> 3) % 2 ? 3 : 0], 130.81), t, 0.3, 0.35, 'sine');
      if (Math.random() < 0.7) bell(hz(nextNote(), 523.25), t, 0.22, 0.28);
    } else if (calm === 0) {
      // Music box: a note on most beats, wandering gently, a soft low note at the start of each bar.
      if (beat % 2 === 0 && Math.random() < 0.85) bell(hz(nextNote(), base), t, 1.6, 0.25, 'sine');
      if (beat === 0) bell(hz(PENTA[(step >> 3) % 3 === 2 ? 3 : 0], base / 2), t, 2.4, 0.15, 'sine');
    } else if (calm === 1) {
      // Lullaby: the same slow rocking pattern up and down, the low note changing every 2 bars.
      var ROCK = [0, 2, 4, 7, 4, 2, 0, 2];
      var low = [0, 7, 9, 7][(step >> 4) % 4];
      if (beat % 2 === 0) bell(hz(low + ROCK[(step >> 1) % 8], base), t, 1.4, 0.2, 'sine');
      if (step % 16 === 0) bell(hz(low, base / 2), t, 3.5, 0.15, 'sine');
    } else {
      // Raindrops: a few high notes here and there over long, soft low notes.
      if (Math.random() < 0.3) bell(hz(nextNote(), base), t, 1.2, 0.18, 'sine');
      if (step % 16 === 0) bell(hz(PENTA[(step >> 4) % 2 ? 3 : 0], base / 4), t, 5, 0.18, 'triangle');
    }
    step++;
  }

  var base = 523.25;

  function schedule() {
    var bpm = style === 'calm' ? CALM[calm][0] : STYLES[style].bpm;
    var eighth = 60 / bpm / 2;
    while (nextTime < ctx.currentTime + 0.12) {
      play(nextTime);
      nextTime += eighth;
    }
  }

  window.H212Music = {
    supported: function () {
      return !!AC;
    },
    unlock: function () {
      if (!ensure()) return;
      // Playing a silent sound inside the tap is what wakes up sound on iPhone/iPad.
      var s = ctx.createBufferSource();
      s.buffer = ctx.createBuffer(1, 1, 22050);
      s.connect(ctx.destination);
      s.start(0);
    },
    start: function (which) {
      if (!ensure() || !STYLES[which]) return false;
      clearInterval(timer);
      style = which;
      step = 0;
      if (which === 'calm') {
        calm = Math.floor(Math.random() * CALM.length);
        base = CALM[calm][1];
      }
      nextTime = ctx.currentTime + 0.05;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(STYLES[which].volume, ctx.currentTime, 0.03);
      timer = setInterval(schedule, 25);
      on = true;
      return true;
    },
    stop: function () {
      clearInterval(timer);
      on = false;
      if (ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
      }
    },
    playing: function () {
      return on;
    }
  };

  // ---------- background music + the on/off button ----------

  var KEY = 'h212_kids_music';
  var paused = false;   // this page has its own music (Freeze Dance)
  var tapped = false;   // sound is allowed only after the first tap
  var bgOn = false;     // the calm music is playing now

  function wanted() {
    try {
      return localStorage.getItem(KEY) !== 'off';
    } catch (e) {
      return true;
    }
  }

  function remember(yes) {
    try {
      localStorage.setItem(KEY, yes ? 'on' : 'off');
    } catch (e) {}
  }

  function bgStart() {
    if (bgOn || paused || !tapped || !wanted() || document.hidden) return;
    bgOn = window.H212Music.start('calm');
  }

  function bgStop() {
    if (!bgOn) return;
    bgOn = false;
    window.H212Music.stop();
  }

  var NOTE = '<path d="M15 30 V9 L31 5 V25" stroke="#2B2B3A" stroke-width="4" fill="none" stroke-linejoin="round"/>' +
    '<ellipse cx="11" cy="30" rx="6" ry="4.6" fill="#2B2B3A"/><ellipse cx="27" cy="26" rx="6" ry="4.6" fill="#2B2B3A"/>';
  var SLASH = '<path d="M5 5 L33 33" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/><path d="M5 5 L33 33" stroke="#E5484D" stroke-width="4.5" stroke-linecap="round"/>';

  function inner(yes) {
    return '<svg width="32" height="32" viewBox="0 0 38 38" aria-hidden="true">' + NOTE + (yes ? '' : SLASH) + '</svg>';
  }

  function paint() {
    var yes = wanted();
    document.querySelectorAll('[data-music]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(yes));
      b.classList.toggle('k-music-off', !yes);
      b.innerHTML = inner(yes);
    });
  }

  window.H212Music.bg = {
    button: function () {
      if (!AC) return '';
      var yes = wanted();
      return '<button type="button" class="k-music-btn k-press' + (yes ? '' : ' k-music-off') + '" data-music aria-pressed="' + yes +
        '" aria-label="Music on/off おんがく">' + inner(yes) + '</button>';
    },
    pause: function () {
      paused = true;
      bgStop();
    },
    resume: function () {
      paused = false;
      bgStart();
    }
  };

  if (!AC) return;

  // The first tap anywhere wakes up sound and starts the music (if it is switched on).
  function firstTap() {
    if (tapped) return;
    tapped = true;
    window.H212Music.unlock();
    bgStart();
  }
  document.addEventListener('pointerdown', firstTap, true);
  document.addEventListener('keydown', firstTap, true);

  // The music button: on/off, remembered on this device. The lion's voice is not affected.
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-music]') : null;
    if (!b) return;
    e.preventDefault();
    firstTap();
    var yes = !wanted();
    remember(yes);
    if (yes) bgStart(); else bgStop();
    paint();
  });

  // No music while the page is hidden (another app, screen locked).
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) bgStop(); else bgStart();
  });
})();
