'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const storeMod = load('js/meet/store.js');

describe('store', () => {
  it('persists meetings and redacts keys on export', () => {
    const mem = {};
    const ls = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
    const store = storeMod.createStore({ local: ls });
    store.putMeeting({ id: 'm1', title: 'T', turns: [], extract: { summary: 's' }, createdAt: 1 });
    assert.equal(store.listMeetings().length, 1);
    store.setSettings({ mode: 'live', provider: 'openai' });
    const exp = store.exportAll();
    assert.ok(exp.meetings.m1);
    assert.equal(exp.settings.keys, undefined);
  });
});
