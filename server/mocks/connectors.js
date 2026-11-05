'use strict';
function mockHubspot(op, i) {
  return { ok: true, mocked: true, id: 'hs_mock_' + i, method: op.method, path: op.path, echo: op.body };
}
function mockSalesforce(op, i) {
  return { ok: true, mocked: true, id: 'sf_mock_' + i, method: op.method, path: op.path, echo: op.body };
}
function mockRecallStart(meetingUrl) {
  return { id: 'bot_mock_' + Date.now().toString(36), meetingUrl, status: 'done_simulated', transcriptWebhook: '/webhooks/transcript' };
}
module.exports = { mockHubspot, mockSalesforce, mockRecallStart };
