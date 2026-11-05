/* Web Speech API live transcript helper. Falls back gracefully when unsupported. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Meet = root.Meet || {}).speech = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function support() {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    return { ok: !!SR, SpeechRecognition: SR || null, reason: SR ? '' : 'Web Speech API is not available in this browser. Upload a transcript or use simulated live playback instead.' };
  }
  function createRecognizer(opts) {
    const s = support();
    if (!s.ok) throw new Error(s.reason);
    const rec = new s.SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = (opts && opts.lang) || 'en-US';
    let turns = [];
    let startingT = (opts && opts.now) ? opts.now() : Date.now();
    const onTurn = (opts && opts.onTurn) || (() => {});
    const onInterim = (opts && opts.onInterim) || (() => {});
    const onError = (opts && opts.onError) || (() => {});
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const text = r[0].transcript.trim();
        if (!text) continue;
        if (r.isFinal) {
          const t = Math.floor(((opts && opts.now ? opts.now() : Date.now()) - startingT) / 1000);
          const turn = { t, speaker: (opts && opts.speaker) || 'You', text };
          turns.push(turn);
          onTurn(turn, turns.slice());
        } else onInterim(text);
      }
    };
    rec.onerror = (e) => onError(e.error || e.message || 'speech error');
    return {
      start() { startingT = (opts && opts.now) ? opts.now() : Date.now(); turns = []; rec.start(); },
      stop() { try { rec.stop(); } catch (e) { /* ignore */ } return turns.slice(); },
      abort() { try { rec.abort(); } catch (e) { /* ignore */ } },
      get turns() { return turns.slice(); }
    };
  }
  return { support, createRecognizer };
});
