'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const storeMod = load('js/meet/store.js');
const agent = load('js/meet/agent.js');
const crmdiff = load('js/meet/crmdiff.js');

function memStore() {
  const mem = {};
  const ls = {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; }
  };
  return storeMod.createStore({ local: ls });
}

describe('agent orchestration', () => {
  it('runs discovery demo end to end and applies CRM with undo', async () => {
    const store = memStore();
    const r = await agent.runDemoMeeting('demo-discovery', store);
    assert.equal(r.meeting.demoId, 'demo-discovery');
    assert.ok(r.meeting.extract.actions.length >= 3);
    assert.ok(r.meeting.crmChangeset.fields.length >= 3);
    assert.equal(store.listMeetings().length, 1);

    const beforeCompanies = store.getCrm().companies.length;
    const applied = agent.applyCrm(store, r.meeting.id);
    assert.ok(applied.applied.length >= 1);
    assert.ok(store.getCrm().companies.length >= beforeCompanies);
    assert.equal(store.getMeeting(r.meeting.id).crmApplied, true);

    agent.undoCrm(store);
    assert.equal(store.getMeeting(r.meeting.id).crmApplied, false);
  });

  it('runs all demos', async () => {
    const store = memStore();
    for (const id of ['demo-discovery', 'demo-standup', 'demo-qbr', 'demo-hiring', 'demo-messy']) {
      const r = await agent.runDemoMeeting(id, store);
      assert.ok(r.meeting.extract.summary, id);
    }
    assert.equal(store.listMeetings().length, 5);
  });

  it('delete meeting with restore', async () => {
    const store = memStore();
    const r = await agent.runDemoMeeting('demo-standup', store);
    const id = r.meeting.id;
    store.deleteMeeting(id);
    assert.equal(store.getMeeting(id), null);
    const u = store.popUndo();
    store.restoreMeeting(u.meeting);
    assert.ok(store.getMeeting(id));
  });

  it('skips DNC-like: rejected fields stay out', async () => {
    const store = memStore();
    const r = await agent.runDemoMeeting('demo-qbr', store);
    const approvals = {};
    for (const f of r.meeting.crmChangeset.fields) approvals[f.id] = f.meta.kind !== 'deal';
    agent.applyCrm(store, r.meeting.id, approvals);
    // Deal should not have been created/updated if rejected — for QBR deal may be create
    const dealField = r.meeting.crmChangeset.fields.find((f) => f.meta.kind === 'deal');
    if (dealField && dealField.op === 'create') {
      assert.equal(!!require('../js/meet/crm.js').findDeal(store.getCrm(), dealField.after.name), false);
    }
  });
});
