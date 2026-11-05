'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const crm = load('js/meet/crm.js');
const crmdiff = load('js/meet/crmdiff.js');
const adapters = load('js/meet/adapters.js');

describe('crm + diff + adapters', () => {
  it('upserts company and contact', () => {
    const db = crm.empty();
    const { company, created } = crm.upsertCompany(db, { name: 'Northwind Analytics', domain: 'northwind.example' });
    assert.equal(created, true);
    const c2 = crm.upsertCompany(db, { name: 'Northwind Analytics', domain: 'northwind.example', stage: 'pilot' });
    assert.equal(c2.created, false);
    assert.equal(c2.company.stage, 'pilot');
    crm.upsertContact(db, { name: 'Jordan Lee', email: 'jordan.lee@northwind.example', companyId: company.id });
    assert.equal(db.contacts.length, 1);
  });

  it('proposes and applies a changeset with selective approval', () => {
    const db = crm.seedDemo(crm.empty());
    const proposal = {
      companyUpsert: { name: 'Northwind Analytics', domain: 'northwind.example' },
      contactsUpsert: [{ name: 'Jordan Lee', email: 'jordan.lee@northwind.example', title: 'VP Ops' }],
      dealUpsert: { name: 'Northwind · Analytics Platform', amount: 48000, stage: 'pilot', company: 'Northwind Analytics' },
      tasks: [{ title: 'Send pilot plan', owner: 'Ava Chen', due: '2026-10-31' }],
      activity: { type: 'meeting', subject: 'Discovery' }
    };
    const cs = crmdiff.propose(db, proposal, { meetingId: 'm1' });
    assert.ok(cs.fields.length >= 4);
    // Reject the task
    const task = cs.fields.find((f) => f.meta.kind === 'task');
    task.approved = false;
    const beforeTasks = db.tasks.length;
    const { applied } = crmdiff.apply(db, cs);
    assert.ok(applied.length >= 3);
    assert.equal(db.tasks.length, beforeTasks); // task rejected
    assert.ok(crm.findCompany(db, 'northwind.example'));
    assert.ok(crm.findDeal(db, 'Northwind · Analytics Platform'));
  });

  it('builds HubSpot and Salesforce payloads + curl', () => {
    const cs = { fields: [
      { id: '1', approved: true, op: 'create', label: 'c', after: { name: 'Globex Retail', domain: 'globex.example' }, meta: { kind: 'company' } },
      { id: '2', approved: true, op: 'create', label: 'd', after: { name: 'Renewal', amount: 120000, stage: 'negotiation' }, meta: { kind: 'deal' } }
    ]};
    const hs = adapters.hubspotFromChangeset(cs);
    assert.equal(hs.length, 2);
    assert.equal(hs[0].path, '/crm/v3/objects/companies');
    const sf = adapters.salesforceFromChangeset(cs);
    assert.equal(sf[1].body.StageName, 'Negotiation/Review');
    assert.match(adapters.toCurl(hs[0]), /curl/);
  });

  it('exports json and csv', () => {
    const cs = { fields: [{ id: 'a', approved: true, op: 'create', label: 'X', before: null, after: { n: 1 } }] };
    assert.match(crmdiff.exportJson(cs), /"a"/);
    assert.match(crmdiff.exportCsv(cs), /label/);
  });
});
