'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const MeetData = load('js/data/meetings.js');

describe('demo meetings data', () => {
  it('has five meetings with .example emails', () => {
    assert.equal(MeetData.MEETINGS.length, 5);
    for (const m of MeetData.MEETINGS) {
      assert.ok(m.transcript.length >= 8, m.id);
      for (const p of m.participants) {
        if (p.email) assert.match(p.email, /\.example$/);
      }
      assert.ok(m.extract.followUp.body.length > 40);
      assert.ok(m.extract.crm);
    }
  });
  it('list returns summaries', () => {
    assert.equal(MeetData.list().length, 5);
    assert.ok(MeetData.byId('demo-messy'));
    assert.equal(MeetData.byId('nope'), null);
  });
  it('messy meeting has crosstalk and parked tangent', () => {
    const m = MeetData.byId('demo-messy');
    assert.ok(m.transcript.some((t) => /coffee/i.test(t.text)));
    assert.ok(m.extract.summary.includes('Q2') || m.extract.decisions.some((d) => /Q2/i.test(d.text)));
  });
});
