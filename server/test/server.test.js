'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { server, store } = require('../index');

let base;
before(() => new Promise((res) => {
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    base = 'http://127.0.0.1:' + port;
    res();
  });
}));
after(() => new Promise((res) => server.close(res)));

async function req(method, path, body) {
  const r = await fetch(base + path, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  return { status: r.status, j };
}

describe('meetminder server', () => {
  it('health', async () => {
    const { status, j } = await req('GET', '/health');
    assert.equal(status, 200);
    assert.equal(j.ok, true);
    assert.equal(j.mock, true);
  });

  it('ingest webhook transcript', async () => {
    const { status, j } = await req('POST', '/webhooks/transcript', {
      title: 'Test call',
      turns: [{ t: 0, speaker: 'A', text: 'Hello' }, { t: 5, speaker: 'B', text: 'Hi' }]
    });
    assert.equal(status, 201);
    assert.ok(j.id);
    const list = await req('GET', '/transcripts?limit=1');
    assert.equal(list.j.transcripts[0].id, j.id);
    assert.equal(list.j.transcripts[0].turns.length, 2);
  });

  it('hubspot dry-run mock', async () => {
    const { status, j } = await req('POST', '/connectors/hubspot/push', {
      dryRun: true,
      ops: [{ method: 'POST', path: '/crm/v3/objects/contacts', body: { properties: { email: 'a@b.example' } } }]
    });
    assert.equal(status, 200);
    assert.equal(j.mocked, true);
    assert.equal(j.results.length, 1);
  });

  it('salesforce dry-run mock', async () => {
    const { status, j } = await req('POST', '/connectors/salesforce/push', {
      dryRun: true,
      ops: [{ method: 'POST', path: '/services/data/v59.0/sobjects/Contact', body: { LastName: 'Test' } }]
    });
    assert.equal(status, 200);
    assert.equal(j.mocked, true);
  });

  it('recall adapter simulated', async () => {
    const { status, j } = await req('POST', '/adapters/recall/start', { meetingUrl: 'https://zoom.us/j/123' });
    assert.equal(status, 200);
    assert.equal(j.mocked, true);
    assert.ok(j.bot.id);
  });
});
