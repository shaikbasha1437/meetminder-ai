'use strict';
function ingest(store, body) {
  if (!body || typeof body !== 'object') throw new Error('Expected JSON body');
  const turns = body.turns || body.transcript || [];
  if (!Array.isArray(turns) || !turns.length) throw new Error('Body needs turns[] or transcript[]');
  const row = {
    id: 'wh_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: body.title || 'Webhook meeting',
    when: body.when || new Date().toISOString(),
    source: body.source || 'webhook',
    turns: turns.map((t) => ({ t: Number(t.t || t.start || 0), speaker: String(t.speaker || t.speaker_label || 'Speaker'), text: String(t.text || t.utterance || '') })).filter((t) => t.text),
    receivedAt: new Date().toISOString()
  };
  store.transcripts.unshift(row);
  if (store.transcripts.length > 100) store.transcripts.length = 100;
  return row;
}
module.exports = { ingest };
