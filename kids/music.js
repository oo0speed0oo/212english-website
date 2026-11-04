/* 212 Kids - a tiny music maker. All sounds are made in code (Web Audio): no music files, no license.
 *
 *   H212Music.supported()     can this browser play it?
 *   H212Music.unlock()        call inside a tap (iPhone/iPad only allow sound after a tap)
 *   H212Music.start('dance')  playful beat + xylophone tune, about 100 beats per minute (Freeze Dance)
 *   H212Music.start('calm')   slow, soft music-box notes (background music, Prompt E)
 *   H212Music.stop()          stops at once
 *   H212Music.playing()       true while music plays
 * The music is kept quiet so the lion's voice is always louder.
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
    calm: { bpm: 66, volume: 0.09 }
  };

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
    } else {
      // calm: a slow music box, a note on most beats, sometimes a soft low note under it.
      if (beat % 2 === 0 && Math.random() < 0.85) bell(hz(nextNote(), 523.25), t, 1.6, 0.25, 'sine');
      if (beat === 0) bell(hz(PENTA[(step >> 3) % 3 === 2 ? 3 : 0], 261.63), t, 2.4, 0.15, 'sine');
    }
    step++;
  }

  function schedule() {
    var eighth = 60 / STYLES[style].bpm / 2;
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
})();
