'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const extract = load('js/meet/extract.js');
const quality = load('js/meet/quality.js');
const MeetData = load('js/data/meetings.js');

describe('extract + quality', () => {
  it('demo extract for all five meetings is backed', () => {
    for (const m of MeetData.MEETINGS) {
      const r = extract.demoExtract(m.id);
      assert.ok(r, m.id);
      assert.ok(r.extract.summary.length > 20, m.id);
      assert.ok(r.extract.actions.length >= 1, m.id);
      for (const a of r.extract.actions) assert.equal(a.backed, true, m.id + ' ' + a.text);
      for (const d of r.extract.decisions) assert.equal(d.backed, true, m.id + ' ' + d.text);
    }
  });

  it('flags invented numbers', () => {
    const m = MeetData.byId('demo-discovery');
    const ex = JSON.parse(JSON.stringify(m.extract));
    ex.actions.push({ text: 'Charge them $999999 immediately', backed: true });
    const flags = quality.checkExtract(ex, m.transcript);
    assert.ok(flags.some((f) => f.type === 'invented_number'));
  });

  it('heuristic extract finds actions and questions', () => {
    const turns = [
      { t: 0, speaker: 'A', text: 'I will send the deck tomorrow.' },
      { t: 10, speaker: 'B', text: 'Who else needs to sign off?' },
      { t: 20, speaker: 'A', text: 'We decided to run a two-week pilot.' }
    ];
    const r = extract.heuristicExtract(turns, { title: 'Test' });
    assert.ok(r.extract.actions.length >= 1);
    assert.ok(r.extract.questions.length >= 1);
    assert.ok(r.flags.some((f) => f.type === 'heuristic'));
  });
});
