'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const crm = load('js/meet/crm.js');
const crmdiff = load('js/meet/crmdiff.js');
const extract = load('js/meet/extract.js');

describe('CRM apply from each demo', () => {
  for (const id of ['demo-discovery', 'demo-standup', 'demo-qbr', 'demo-hiring', 'demo-messy']) {
    it('applies ' + id + ' changeset', () => {
      const db = crm.seedDemo(crm.empty());
      const r = extract.demoExtract(id);
      const cs = crmdiff.propose(db, r.extract.crm, { meetingId: id });
      const before = { companies: db.companies.length, contacts: db.contacts.length, tasks: db.tasks.length, deals: db.deals.length };
      const { applied, snapshot } = crmdiff.apply(db, cs);
      assert.equal(applied.length, cs.fields.filter((f) => f.approved).length);
      // snapshot can restore
      assert.equal(snapshot.companies.length, before.companies);
      assert.ok(db.tasks.length >= before.tasks);
    });
  }
});
