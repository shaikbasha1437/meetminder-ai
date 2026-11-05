'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const cite = load('js/meet/cite.js');

describe('cite', () => {
  const turns = [
    { t: 10, speaker: 'A', text: 'We will send a pilot plan by Friday.' },
    { t: 20, speaker: 'B', text: 'Our CRM admin is out until next Wednesday.' }
  ];
  it('finds a quote', () => {
    const hit = cite.findQuote(turns, 'pilot plan by Friday', 10);
    assert.equal(hit.t, 10);
  });
  it('marks unbacked items', () => {
    const item = cite.attachCite({ text: 'Totally made up claim about unicorns', cite: { quote: 'unicorns everywhere' } }, turns);
    assert.equal(item.backed, false);
  });
  it('attachAll preserves backed decisions', () => {
    const ex = cite.attachAll({
      decisions: [{ text: 'Send plan', cite: { t: 10, quote: 'pilot plan by Friday' } }],
      actions: [], questions: [], risks: []
    }, turns);
    assert.equal(ex.decisions[0].backed, true);
  });
});
