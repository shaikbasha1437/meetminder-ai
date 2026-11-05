'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const speech = load('js/meet/speech.js');

describe('speech', () => {
  it('reports unsupported in node', () => {
    const s = speech.support();
    assert.equal(s.ok, false);
  });
});
