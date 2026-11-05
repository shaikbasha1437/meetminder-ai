'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const llm = load('js/agentkit/llm.js');

describe('llm builders', () => {
  it('openai chat completions shape', () => {
    const r = llm.buildRequest({ provider: 'openai', key: 'sk-x', model: 'gpt-4o-mini' }, { system: 's', messages: [{ role: 'user', content: 'u' }], maxTokens: 50, json: true });
    assert.match(r.url, /chat\/completions/);
    const body = JSON.parse(r.init.body);
    assert.equal(body.response_format.type, 'json_object');
    assert.equal(r.init.headers.authorization, 'Bearer sk-x');
  });
  it('gemini uses x-goog-api-key', () => {
    const r = llm.buildRequest({ provider: 'gemini', key: 'AIzafake', model: 'gemini-2.5-flash' }, { system: 's', messages: [{ role: 'user', content: 'u' }] });
    assert.equal(r.init.headers['x-goog-api-key'], 'AIzafake');
    assert.match(r.url, /generateContent/);
  });
  it('openrouter sets referer', () => {
    const r = llm.buildRequest({ provider: 'compatible', key: 'k', model: 'x', baseUrl: 'https://openrouter.ai/api/v1' }, { system: 's', messages: [{ role: 'user', content: 'u' }] });
    assert.ok(r.init.headers['HTTP-Referer']);
  });
  it('parseResponse anthropic', () => {
    const out = llm.parseResponse('anthropic', { content: [{ type: 'text', text: 'hi' }], usage: { input_tokens: 1, output_tokens: 2 }, stop_reason: 'end_turn', model: 'c' });
    assert.equal(out.text, 'hi');
    assert.equal(out.usage.output, 2);
  });
  it('cost math', () => {
    const c = llm.cost({ input: 1e6, output: 1e6 }, 'gpt-4o-mini');
    assert.ok(c > 0);
  });
  it('errorMessage hints', () => {
    assert.match(llm.errorMessage('openai', 401, { error: { message: 'bad' } }, ''), /rejected/i);
    assert.match(llm.errorMessage('openai', 429, {}, ''), /Rate limit/i);
  });
});
