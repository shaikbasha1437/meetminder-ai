'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const redact = load('js/meet/redact.js');

describe('redact', () => {
  it('redacts emails and phones', () => {
    const s = redact.redactText('Email jordan.lee@northwind.example or call (415) 555-0199 please');
    assert.match(s, /\[email redacted\]/);
    assert.match(s, /\[phone redacted\]/);
  });
  it('leaves short numbers alone', () => {
    assert.equal(redact.redactText('Room 12 at 3pm', { emails: false }), 'Room 12 at 3pm');
  });
});
