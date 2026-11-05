'use strict';
const https = require('https');
const { mockHubspot } = require('../mocks/connectors');

async function push(body, opts) {
  const ops = (body && body.ops) || [];
  if (!Array.isArray(ops) || !ops.length) return { ok: false, error: 'ops[] required' };
  if (opts.mock || body.dryRun) {
    return { ok: true, mocked: true, dryRun: !!body.dryRun, results: ops.map((op, i) => mockHubspot(op, i)) };
  }
  if (!opts.token) return { ok: false, error: 'HUBSPOT_TOKEN not set on server' };
  const results = [];
  for (const op of ops) {
    results.push(await httpJson('api.hubapi.com', op.method || 'POST', op.path, op.body, opts.token));
  }
  return { ok: results.every((r) => r.ok), results };
}

function httpJson(host, method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : '';
    const req = https.request({ host, path, method, headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null; try { json = JSON.parse(text); } catch (e) {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: json || text });
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

module.exports = { push };
