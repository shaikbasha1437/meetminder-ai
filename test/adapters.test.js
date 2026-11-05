'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const adapters = load('js/meet/adapters.js');

describe('adapters mapping', () => {
  it('maps deal stages', () => {
    assert.equal(adapters.HS_DEAL_STAGE.pilot, 'presentationscheduled');
    assert.equal(adapters.mapSfStage('won'), 'Closed Won');
  });
  it('skips unapproved fields', () => {
    const cs = { fields: [
      { approved: false, op: 'create', after: { name: 'X' }, meta: { kind: 'company' } },
      { approved: true, op: 'create', after: { title: 'Call bob' }, meta: { kind: 'task' } }
    ]};
    const hs = adapters.hubspotFromChangeset(cs);
    assert.equal(hs.length, 1);
    assert.equal(hs[0].path, '/crm/v3/objects/tasks');
  });
  it('contact create splits name', () => {
    const cs = { fields: [{ approved: true, op: 'create', after: { name: 'Priya Shah', email: 'p@n.example', title: 'RevOps' }, meta: { kind: 'contact' } }] };
    const hs = adapters.hubspotFromChangeset(cs);
    assert.equal(hs[0].body.properties.firstname, 'Priya');
    assert.equal(hs[0].body.properties.lastname, 'Shah');
    const sf = adapters.salesforceFromChangeset(cs);
    assert.equal(sf[0].body.FirstName, 'Priya');
  });
});
