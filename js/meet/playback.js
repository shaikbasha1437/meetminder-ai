/* Simulated live meeting: streams a demo transcript turn-by-turn in real time (sped up). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../data/meetings'));
  else (root.Meet = root.Meet || {}).playback = factory(root.MeetData);
})(typeof self !== 'undefined' ? self : this, function (MeetData) {
  'use strict';
  function createPlayback(demoId, opts) {
    const m = MeetData.byId(demoId);
    if (!m) throw new Error('Unknown demo meeting');
    const speed = (opts && opts.speed) || 12; // 12x realtime by default
    const onTurn = (opts && opts.onTurn) || (() => {});
    const onDone = (opts && opts.onDone) || (() => {});
    const setT = (opts && opts.setTimeout) || setTimeout;
    const clearT = (opts && opts.clearTimeout) || clearTimeout;
    let i = 0, timer = null, stopped = false;
    const received = [];
    function schedule() {
      if (stopped || i >= m.transcript.length) { onDone(received.slice()); return; }
      const turn = m.transcript[i];
      const prevT = i === 0 ? 0 : m.transcript[i - 1].t;
      const delay = Math.max(40, Math.floor(((turn.t - prevT) * 1000) / speed));
      timer = setT(() => {
        received.push(turn);
        onTurn(turn, received.slice());
        i++;
        schedule();
      }, delay);
    }
    return {
      start() { stopped = false; i = 0; received.length = 0; schedule(); },
      stop() { stopped = true; if (timer) clearT(timer); return received.slice(); },
      get meeting() { return m; }
    };
  }
  return { createPlayback };
});
