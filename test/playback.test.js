'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const playback = load('js/meet/playback.js');

describe('playback', () => {
  it('streams all turns then completes', async () => {
    const received = [];
    await new Promise((resolve) => {
      const timers = [];
      const p = playback.createPlayback('demo-standup', {
        speed: 1000,
        setTimeout: (fn, ms) => { const id = setTimeout(fn, 0); timers.push(id); return id; },
        clearTimeout: (id) => clearTimeout(id),
        onTurn: (t, all) => { received.push(t); },
        onDone: () => resolve()
      });
      p.start();
    });
    assert.ok(received.length >= 5);
    assert.equal(received[0].speaker, 'Sam Ortiz');
  });
});
