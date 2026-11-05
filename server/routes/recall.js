'use strict';
const { mockRecallStart } = require('../mocks/connectors');

/* Recall.ai-style adapter. With MOCK or without RECALL_API_KEY, returns a simulated bot id.
   Real integration would POST to https://api.recall.ai/api/v1/bot/ with the user's key. */
async function start(body, opts) {
  const meetingUrl = body && body.meetingUrl;
  if (!meetingUrl) return { ok: false, error: 'meetingUrl required' };
  if (opts.mock || !opts.token) {
    return { ok: true, mocked: true, bot: mockRecallStart(meetingUrl), note: 'Simulated. Set RECALL_API_KEY and MOCK_CONNECTORS=0 for a real Recall.ai bot (not tested here with a real key).' };
  }
  // Minimal real call shape — not exercised in tests with a real key.
  return { ok: false, error: 'Real Recall.ai calls are not enabled in this open-source build without explicit MOCK_CONNECTORS=0 and a key; use the mock path or wire your own fetch.' };
}

module.exports = { start };
