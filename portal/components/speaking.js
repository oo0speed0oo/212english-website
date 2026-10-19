// Speaking practice (the 4th group on a chapter page). Practice only: it never
// counts toward unlocking chapters or Grades, and no audio is ever stored.
//
// The student hears (or reads) a prompt, taps the mic and answers out loud. The
// browser's built-in speech recognition turns the voice into text and this file
// checks that text for keywords (NOT an exact match), then shows a friendly
// result, the words we heard, and a good model answer with a 🔊 button.
//
// Used by homework.php:
//   H212Speak.load() / H212Speak.loadTries()      -> fetch speaking-content.csv and the student's try counts
//   H212Speak.forChapter(level, chapter)          -> that chapter's questions (untried first)
//   H212Speak.triedCount(level, chapter)          -> how many of them the student has tried
//   H212Speak.start(questions, { backJs: 'renderTypes(3)' })
//
// speaking-content.csv columns: id,level,chapter,kind,prompt_audio,prompt_ja,cue_en,keywords,answers,mode
//   kind=cue      play prompt_audio, show a small card (cue_en + prompt_ja)
//   kind=japanese show the Japanese sentence; the student says it in English
//   kind=about    play prompt_audio; the student answers about themselves
//   keywords: groups separated by |; in a group any "/" alternative passes; "*ing" / "*ed" = any word ending that way
//   answers:  model answers separated by |  ("___" = the student's own word)
//
// Needs window.H212_T (speak.* strings), window.H212_NONCE, H212UI, H212Mike and H212Listen.
var H212Speak = (function () {
  var SR     = window.SpeechRecognition || window.webkitSpeechRecognition;
  var all    = [];     // every speaking question
  var tries  = {};     // question id -> how many times this student tried it
  var st     = null;   // the practice in progress: { qs, i, backJs, rec, token, attempted, practiced }
  var token  = 0;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(key) { return (window.H212_T && window.H212_T[key]) || ''; }
  function pc() { return document.getElementById('page-content'); }

  // ── Loading ─────────────────────────────────────────
  function splitLine(line) {
    var result = [], cur = '', inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else { cur += ch; }
      } else if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(cur); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur);
    return result;
  }

  function parse(text) {
    var lines = String(text).replace(/^﻿/, '').trim().split('\n');
    var header = splitLine(lines[0]).map(function (h) { return h.trim().toLowerCase(); });
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      var cols = splitLine(lines[i].replace(/\r$/, ''));
      var get = function (name) {
        var idx = header.indexOf(name);
        return (idx === -1 || cols[idx] === undefined) ? '' : cols[idx].trim();
      };
      if (get('id') === '' || get('level') === '' || get('chapter') === '' || get('kind') === '') continue;
      if (get('mode') === 'test') continue; // Speaking is practice only
      rows.push({
        id: get('id'), level: parseInt(get('level')), chapter: parseInt(get('chapter')),
        kind: get('kind').toLowerCase(), prompt_audio: get('prompt_audio'), prompt_ja: get('prompt_ja'),
        cue_en: get('cue_en'), keywords: get('keywords'), answers: get('answers')
      });
    }
    return rows;
  }

  function load() {
    var v = (window.H212_CSV_V && window.H212_CSV_V.speaking) || '0';
    return fetch('speaking-content.csv?v=' + v, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (text) { all = text ? parse(text) : []; })
      .catch(function () { all = []; });
  }

  function loadTries() {
    return fetch('inc/speaking.php', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) { tries = (data && data.tries) || {}; })
      .catch(function () { tries = {}; });
  }

  // One try = one answer that was checked (or a model answer looked at). Only the count is saved.
  function record(id) {
    tries[id] = (tries[id] || 0) + 1;
    fetch('inc/speaking.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce: window.H212_NONCE, id: id })
    }).catch(function () {});
  }

  // This chapter's questions, ones never tried first (otherwise in file order)
  function forChapter(level, chapter) {
    var list = all.filter(function (q) { return q.level === level && q.chapter === chapter; });
    var fresh = list.filter(function (q) { return !tries[q.id]; });
    var done  = list.filter(function (q) { return tries[q.id]; });
    return fresh.concat(done);
  }

  function triedCount(level, chapter) {
    return all.filter(function (q) { return q.level === level && q.chapter === chapter && tries[q.id]; }).length;
  }

  // ── Checking what was said ──────────────────────────
  // Lower-case, expand contractions (I'm -> i am, isn't -> is not, ...), drop punctuation.
  function normalize(s) {
    s = String(s).toLowerCase().replace(/[‘’ʼ`´]/g, "'");
    s = s.replace(/\bcan't\b/g, 'cannot').replace(/\bwon't\b/g, 'will not')
      .replace(/\b([a-z]+)n't\b/g, '$1 not')
      .replace(/\bi'm\b/g, 'i am')
      .replace(/\b(you|we|they)'re\b/g, '$1 are')
      .replace(/\b(he|she|it|there|that|what|here|where|who)'s\b/g, '$1 is')
      .replace(/\b(i|you|we|they)'ve\b/g, '$1 have')
      .replace(/\b(i|you|he|she|it|we|they)'ll\b/g, '$1 will')
      .replace(/\bo'clock\b/g, 'oclock');
    s = s.replace(/'/g, '').replace(/[^a-z0-9 ]+/g, ' ');
    s = s.replace(/\bcan not\b/g, 'cannot').replace(/\s+/g, ' ').trim();
    return s;
  }

  // "a|b/c|*ing" -> [ [a], [b, c], [*ing] ]  (each alternative: { wild, w })
  function groupsOf(q) {
    if (!q._groups) {
      q._groups = q.keywords.split('|').map(function (g) {
        return g.split('/').map(function (a) {
          a = a.trim();
          var wild = a.charAt(0) === '*';
          var n = normalize(wild ? a.slice(1) : a);
          return n ? { wild: wild, w: n } : null;
        }).filter(Boolean);
      }).filter(function (g) { return g.length > 0; });
    }
    return q._groups;
  }

  // Does the (normalized) text contain this word or phrase? "*ing" = any word ending in -ing.
  function has(norm, alt) {
    if (alt.wild) {
      var words = norm.split(' ');
      for (var i = 0; i < words.length; i++) {
        if (words[i].length >= alt.w.length + 2 && words[i].slice(-alt.w.length) === alt.w) return true;
      }
      return false;
    }
    return (' ' + norm + ' ').indexOf(' ' + alt.w + ' ') !== -1;
  }

  function evaluate(q, text) {
    var norm = normalize(text), groups = groupsOf(q), passed = 0;
    for (var g = 0; g < groups.length; g++) {
      for (var a = 0; a < groups[g].length; a++) {
        if (has(norm, groups[g][a])) { passed++; break; }
      }
    }
    return { passed: passed, total: groups.length };
  }

  function firstModel(q) {
    return (q.answers.split('|')[0] || '').trim();
  }

  // ── Practice screens ────────────────────────────────
  function canSpeak() {
    return typeof H212Listen !== 'undefined' && H212Listen.canSpeak && H212Listen.canSpeak();
  }

  function start(qs, opts) {
    if (!qs || !qs.length) return;
    st = { qs: qs, i: 0, backJs: (opts && opts.backJs) || '', rec: null, token: 0, attempted: false, practiced: 0,
           level: qs[0].level, chapter: qs[0].chapter };
    show();
  }

  function show() {
    stopRec();
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    var q = st.qs[st.i];
    st.attempted = false;
    st.token = ++token;
    var last = st.i + 1 >= st.qs.length;

    var h = H212UI.qTop({ onclose: st.backJs, label: T('hw.back'), index: st.i, total: st.qs.length, noScore: true })
      + '<div class="grp-speaking"><div class="q-label">' + esc(T('hw.speaking')) + ' · ' + esc(T('hw.part_speaking')) + '</div></div>'
      + '<div class="question-card speak-card">'
      + '<div class="speak-inst">' + esc(T('speak.inst_' + q.kind) || T('speak.inst_japanese')) + '</div>';

    if (q.kind === 'cue') {
      h += '<div class="speak-cue"><div class="speak-cue-en">' + esc(q.cue_en) + '</div>'
        + '<div class="speak-cue-ja" lang="ja">' + esc(q.prompt_ja) + '</div></div>';
    } else if (q.kind === 'japanese') {
      h += '<div class="speak-ja" lang="ja">' + esc(q.prompt_ja) + '</div>';
    }
    if (q.prompt_audio) {
      h += '<button type="button" class="listen-btn speak-hear" onclick="H212Speak.hear()">' + esc(T('listen.button')) + '</button>';
      // No English voice on this device: show the line instead, so nobody is stuck.
      if (!canSpeak()) h += '<div class="speak-line">“' + esc(q.prompt_audio) + '”</div>';
    }

    if (SR) {
      h += '<button type="button" class="speak-mic" id="speak-mic" onclick="H212Speak.listen()">'
        + '<span class="speak-mic-ico" aria-hidden="true">🎤</span><span id="speak-mic-label">' + esc(T('speak.mic')) + '</span></button>';
    } else {
      h += '<div class="speak-note">' + esc(T('speak.no_mic')) + '</div>';
    }
    h += '<div class="speak-status" id="speak-status" role="status"></div>'
      + '<div class="speak-result" id="speak-result" hidden></div>'
      + '<div class="speak-actions"><button type="button" class="' + (SR ? 'speak-link' : 'speak-show-big') + '" onclick="H212Speak.reveal()">'
      + esc(T('speak.show_answer')) + '</button></div>'
      + '<button class="next-btn" id="next-btn" onclick="H212Speak.next()">' + esc(last ? T('speak.finish') : T('hw.next_question')) + '</button>'
      + '</div>' + H212Mike.row();

    pc().innerHTML = h;
    H212Mike.say('hint_speaking', st.i === 0);
  }

  function markAttempt() {
    if (!st.attempted) { st.attempted = true; st.practiced++; }
  }
  function showNext() {
    var n = document.getElementById('next-btn');
    if (n) n.style.display = 'inline-flex';
  }
  function setStatus(msg, isError) {
    var s = document.getElementById('speak-status');
    if (!s) return;
    s.textContent = msg || '';
    s.classList.toggle('err', !!isError);
  }
  function setMic(on) {
    var b = document.getElementById('speak-mic'), l = document.getElementById('speak-mic-label');
    if (b) b.classList.toggle('listening', on);
    if (l) l.textContent = on ? T('speak.mic_stop') : T('speak.mic');
  }

  // Play a recorded clip (audio/speaking/<name>.m4a) if there is one. Returns false if not,
  // so the caller can use the robot voice instead.
  var player = null;
  function stopAudio() {
    if (player) { try { player.pause(); } catch (e) {} player = null; }
  }
  function playFile(name, fallback) {
    var sp = window.H212_VOICES && window.H212_VOICES.speak;
    if (!sp || !sp[name] || typeof Audio === 'undefined') return false;
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();
    var a = new Audio('audio/speaking/' + name + '.m4a?v=' + sp[name]);
    player = a;
    a.onerror = function () { if (player === a) { player = null; fallback(); } };
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function (e) {
      if (player !== a || (e && e.name === 'AbortError')) return;
      player = null;
      fallback();   // the clip would not play: use the robot voice
    });
    return true;
  }

  // Say the prompt: the recorded voice if we have it, otherwise the robot
  function hear() {
    if (!st) return;
    var q = st.qs[st.i];
    if (!q.prompt_audio) return;
    var robot = function () { if (typeof H212Listen !== 'undefined') H212Listen.speakText(q.prompt_audio); };
    if (!playFile(q.id + '_q', robot)) robot();
  }
  // Say the model answer ("___" = their own word, so just pause there)
  function sayModel() {
    if (!st) return;
    var q = st.qs[st.i];
    var text = firstModel(q).replace(/___/g, '...');
    var robot = function () { if (typeof H212Listen !== 'undefined') H212Listen.speakText(text); };
    if (!playFile(q.id + '_a', robot)) robot();
  }

  function stopRec() {
    if (st && st.rec) {
      var r = st.rec;
      st.rec = null;
      r.onresult = r.onerror = r.onend = null;
      try { r.abort(); } catch (e) {}
    }
  }
  function stop() { stopRec(); stopAudio(); token++; }

  // The big mic button: first tap starts listening, a second tap while listening means "I'm done".
  function listen() {
    if (!st || !SR) return;
    if (st.rec) { try { st.rec.stop(); } catch (e) {} return; }
    stopAudio();
    if (typeof H212Listen !== 'undefined') H212Listen.stop();   // never listen to our own voice
    var my = st.token;
    var rec = new SR();
    rec.lang = 'en-US';
    rec.maxAlternatives = 5;
    rec.interimResults = false;
    rec.continuous = false;
    st.rec = rec;
    var gotResult = false, errCode = '';
    setResultHidden();
    setStatus(T('speak.listening'), false);
    setMic(true);

    rec.onresult = function (e) {
      if (!st || st.token !== my) return;
      gotResult = true;
      var alts = [], r = e.results[0];
      for (var j = 0; r && j < r.length; j++) alts.push(r[j].transcript);
      handle(alts);
    };
    rec.onerror = function (e) { errCode = (e && e.error) || ''; };
    rec.onend = function () {
      if (!st || st.token !== my) return;
      st.rec = null;
      setMic(false);
      if (gotResult) return;
      if (errCode === 'aborted') { setStatus('', false); return; }
      if (errCode === 'not-allowed' || errCode === 'service-not-allowed') setStatus(T('speak.mic_blocked'), true);
      else if (errCode === '' || errCode === 'no-speech') setStatus(T('speak.no_speech'), true);
      else setStatus(T('speak.error'), true);
    };
    try { rec.start(); }
    catch (e) { st.rec = null; setMic(false); setStatus(T('speak.error'), true); }
  }

  function setResultHidden() {
    var r = document.getElementById('speak-result');
    if (r) { r.hidden = true; r.textContent = ''; }
  }

  // Check every alternative the recognizer gave back and use the best one
  function handle(alts) {
    var q = st.qs[st.i], best = null;
    for (var i = 0; i < alts.length; i++) {
      if (!alts[i]) continue;
      var r = evaluate(q, alts[i]);
      if (!best || r.passed > best.passed) best = { passed: r.passed, total: r.total, heard: alts[i] };
    }
    if (!best) { setStatus(T('speak.no_speech'), true); return; }
    setStatus('', false);
    if (!st.attempted) record(q.id);
    markAttempt();

    var level = !best.total ? 'try' : (best.passed >= best.total ? 'great' : (best.passed * 2 >= best.total ? 'close' : 'try'));
    var icon = { great: '🟢', close: '🟡', 'try': '🔵' }[level];
    var html = '<div class="speak-badge ' + level + '">' + icon + ' ' + esc(T('speak.' + level)) + '</div>'
      + '<div class="speak-heard">' + esc(T('speak.heard')) + ' <b>“' + esc(best.heard) + '”</b></div>'
      + modelBox(q, level === 'great')
      + '<button type="button" class="speak-retry" onclick="H212Speak.retry()">' + esc(T('speak.try_again')) + '</button>';
    var box = document.getElementById('speak-result');
    if (box) { box.className = 'speak-result ' + level; box.innerHTML = html; box.hidden = false; }
    showNext();
    H212Mike.say(level === 'great' ? 'speak_great' : (level === 'close' ? 'speak_close' : 'speak_try'));
  }

  function modelBox(q, withLabel) {
    return '<div class="speak-model">'
      + '<div class="speak-model-text">' + (withLabel ? '<span class="speak-model-label">' + esc(T('speak.model_label')) + '</span> ' : '')
      + '“' + esc(firstModel(q)) + '”</div>'
      + '<button type="button" class="speak-say" onclick="H212Speak.sayModel()" aria-label="' + esc(T('listen.button')) + '">🔊</button>'
      + '</div>';
  }

  // "Show a good answer" (also the way through on a device with no speech recognition)
  function reveal() {
    if (!st) return;
    var q = st.qs[st.i];
    stopRec();
    setMic(false);
    setStatus('', false);
    if (!st.attempted) record(q.id);
    markAttempt();
    var html = '<div class="speak-badge model">💡 ' + esc(T('speak.model_label')) + '</div>'
      + modelBox(q, false)
      + (SR ? '<button type="button" class="speak-retry" onclick="H212Speak.retry()">' + esc(T('speak.try_again')) + '</button>' : '');
    var box = document.getElementById('speak-result');
    if (box) { box.className = 'speak-result model'; box.innerHTML = html; box.hidden = false; }
    showNext();
    sayModel();
  }

  function retry() {
    if (!st) return;
    stopRec();
    setMic(false);
    setStatus('', false);
    setResultHidden();
  }

  function next() {
    if (!st) return;
    stopRec();
    if (st.i + 1 < st.qs.length) { st.i++; show(); window.scrollTo(0, 0); }
    else finish();
  }

  function finish() {
    var h = '<div class="question-card" style="text-align:center">'
      + '<div style="font-size:48px;margin-bottom:16px">🎤</div>'
      + '<div class="speak-finish-title">' + esc(T('speak.finish_title')) + '</div>'
      + '<div class="speak-finish-sub">' + esc(T('speak.finish_sub').replace('{n}', st.practiced)) + '</div>'
      + H212Mike.row()
      + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
      + '<button class="next-btn" style="display:inline-flex" onclick="H212Speak.restart()">' + esc(T('speak.again')) + '</button>'
      + '<button class="next-btn" style="display:inline-flex" onclick="' + st.backJs + '">' + esc(T('hw.back_to_topics')) + '</button>'
      + '</div></div>';
    pc().innerHTML = h;
    H212Mike.say('finish_good');
  }

  function restart() {
    if (!st) return;
    var qs = forChapter(st.level, st.chapter);
    st.qs = qs; st.i = 0; st.practiced = 0;
    show();
    window.scrollTo(0, 0);
  }

  if (typeof window !== 'undefined') window.addEventListener('pagehide', stop);

  return {
    load: load, loadTries: loadTries, forChapter: forChapter, triedCount: triedCount, start: start,
    listen: listen, hear: hear, sayModel: sayModel, reveal: reveal, retry: retry, next: next, restart: restart, stop: stop,
    // exposed so the matching can be checked on its own
    _evaluate: evaluate, _normalize: normalize, _parse: parse
  };
})();
