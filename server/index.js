#!/usr/bin/env node
/* MeetMinder companion server. Zero npm deps. Transcript webhook store, Recall-style adapter,
   HubSpot/Salesforce push proxy. Set MOCK_CONNECTORS=1 (default) to avoid real outbound calls. */
'use strict';
const http = require('http');
const { URL } = require('url');
const webhook = require('./routes/webhook');
const hubspot = require('./routes/hubspot');
const salesforce = require('./routes/salesforce');
const recall = require('./routes/recall');

const PORT = Number(process.env.PORT || 8787);
const MOCK = String(process.env.MOCK_CONNECTORS || '1') !== '0';
const VERSION = '1.0.0';

const store = { transcripts: [] };

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(null);
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, authorization, x-api-key',
    'access-control-allow-methods': 'GET,POST,OPTIONS'
  }, extraHeaders || {}));
  res.end(body);
}

function cors(req, res) {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return true; }
  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    if (cors(req, res)) return;
    const u = new URL(req.url, 'http://127.0.0.1');
    const path = u.pathname.replace(/\/+$/, '') || '/';

    if (req.method === 'GET' && path === '/health') {
      return send(res, 200, { ok: true, version: VERSION, mock: MOCK, transcripts: store.transcripts.length });
    }

    if (req.method === 'POST' && path === '/webhooks/transcript') {
      const body = await readBody(req);
      const saved = webhook.ingest(store, body);
      return send(res, 201, { ok: true, id: saved.id });
    }

    if (req.method === 'GET' && path === '/transcripts') {
      const limit = Math.min(50, Number(u.searchParams.get('limit') || 10));
      return send(res, 200, { ok: true, transcripts: store.transcripts.slice(0, limit) });
    }

    if (req.method === 'GET' && path.startsWith('/transcripts/')) {
      const id = path.slice('/transcripts/'.length);
      const t = store.transcripts.find((x) => x.id === id);
      if (!t) return send(res, 404, { ok: false, error: 'Not found' });
      return send(res, 200, { ok: true, transcript: t });
    }

    if (req.method === 'POST' && path === '/connectors/hubspot/push') {
      const body = await readBody(req);
      const result = await hubspot.push(body, { mock: MOCK || !!(body && body.dryRun), token: process.env.HUBSPOT_TOKEN || '' });
      return send(res, result.ok ? 200 : 502, result);
    }

    if (req.method === 'POST' && path === '/connectors/salesforce/push') {
      const body = await readBody(req);
      const result = await salesforce.push(body, { mock: MOCK || !!(body && body.dryRun), token: process.env.SALESFORCE_TOKEN || '', instance: process.env.SALESFORCE_INSTANCE || '' });
      return send(res, result.ok ? 200 : 502, result);
    }

    if (req.method === 'POST' && path === '/adapters/recall/start') {
      const body = await readBody(req);
      const result = await recall.start(body, { mock: MOCK || !process.env.RECALL_API_KEY, token: process.env.RECALL_API_KEY || '' });
      return send(res, result.ok ? 200 : 502, result);
    }

    send(res, 404, { ok: false, error: 'Not found', path });
  } catch (e) {
    send(res, 400, { ok: false, error: e.message || String(e) });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('MeetMinder server v' + VERSION + ' on http://127.0.0.1:' + PORT + ' (mock=' + MOCK + ')');
  });
}

module.exports = { server, store, VERSION, MOCK };
