'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const quality = load('js/meet/quality.js');
const extract = load('js/meet/extract.js');
const MeetData = load('js/data/meetings.js');

describe('quality', () => {
  it('demo action/decision cites stay backed with no unbacked flags', () => {
    for (const m of MeetData.MEETINGS) {
      const r = extract.demoExtract(m.id);
      const unbacked = (r.flags || []).filter((f) => f.type === 'unbacked');
      assert.equal(unbacked.length, 0, m.id);
      for (const a of r.extract.actions) assert.equal(a.backed, true, m.id + ' ' + a.text);
      for (const d of r.extract.decisions) assert.equal(d.backed, true, m.id + ' ' + d.text);
    }
  });
  it('flags a clearly invented dollar amount', () => {
    const m = MeetData.byId('demo-discovery');
    const flags = quality.checkExtract({
      summary: 'Charge them $999999 immediately',
      decisions: [], actions: [], questions: [], risks: [],
      followUp: { body: 'Please wire $999999 today.' }
    }, m.transcript);
    assert.ok(flags.some((f) => f.type === 'invented_number' && /999999/.test(f.value)));
  });
  it('numbersIn finds dollars and percents', () => {
    assert.ok(quality.numbersIn('about $60k and 5%').length >= 2);
  });
  it('unbacked item flagged', () => {
    const flags = quality.checkItem({ text: 'x', backed: false, flag: 'no quote' }, []);
    assert.equal(flags[0].type, 'unbacked');
  });
});
