/* Citation helpers: every claim should point at a transcript turn (timestamp + quote). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Meet = root.Meet || {}).cite = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function normalize(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function findQuote(turns, quote, nearT) {
    const q = normalize(quote);
    if (!q || !turns || !turns.length) return null;
    let best = null, bestScore = 0;
    for (const turn of turns) {
      const n = normalize(turn.text);
      if (!n) continue;
      let score = 0;
      if (n.includes(q) || q.includes(n)) score = Math.min(q.length, n.length);
      else {
        const words = q.split(' ').filter((w) => w.length > 3);
        const hits = words.filter((w) => n.includes(w)).length;
        score = words.length ? (hits / words.length) * q.length : 0;
      }
      if (nearT != null) score -= Math.min(30, Math.abs((turn.t || 0) - nearT) / 10);
      if (score > bestScore) { bestScore = score; best = turn; }
    }
    if (!best || bestScore < 4) return null;
    return { t: best.t, speaker: best.speaker, quote: best.text };
  }
  function attachCite(item, turns) {
    if (!item) return item;
    if (item.cite && item.cite.quote) {
      const hit = findQuote(turns, item.cite.quote, item.cite.t);
      if (hit) return Object.assign({}, item, { cite: hit, backed: true });
      return Object.assign({}, item, { backed: false, flag: 'citation not found in transcript' });
    }
    // Try to find the item text itself in the transcript.
    const hit = findQuote(turns, item.text || item.body || '', null);
    if (hit) return Object.assign({}, item, { cite: hit, backed: true });
    return Object.assign({}, item, { backed: false, flag: 'no supporting quote' });
  }
  function attachAll(extract, turns) {
    if (!extract) return extract;
    const out = Object.assign({}, extract);
    for (const key of ['decisions', 'actions', 'questions', 'risks']) {
      out[key] = (extract[key] || []).map((x) => attachCite(x, turns));
    }
    if (extract.sentiment) out.sentiment = attachCite(Object.assign({}, extract.sentiment, { text: extract.sentiment.label }), turns);
    return out;
  }
  return { normalize, findQuote, attachCite, attachAll };
});
