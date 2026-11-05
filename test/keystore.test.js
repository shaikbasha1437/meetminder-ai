'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const ks = load('js/agentkit/keystore.js');

describe('keystore redact', () => {
  it('strips key fields and masks key-looking strings', () => {
    const out = ks.redact({ apiKey: 'sk-secret', note: 'use sk-abcdefghijklmnopqrstuvwxyz123456', nested: { token: 'x' } });
    assert.equal(out.apiKey, undefined);
    assert.equal(out.nested.token, undefined);
    assert.match(out.note, /\[redacted\]/);
  });
});
