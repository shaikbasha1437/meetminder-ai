/* Optional PII redaction for emails and phone numbers in transcripts and notes. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Meet = root.Meet || {}).redact = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g;
  function redactText(s, opts) {
    const o = opts || {};
    let out = String(s == null ? '' : s);
    if (o.emails !== false) out = out.replace(EMAIL, '[email redacted]');
    if (o.phones !== false) out = out.replace(PHONE, (m) => {
      // Avoid redacting things like "November 18" or plain years; require at least 7 digits.
      const digits = m.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return m;
      return '[phone redacted]';
    });
    return out;
  }
  function redactTurns(turns, opts) {
    return (turns || []).map((t) => Object.assign({}, t, { text: redactText(t.text, opts) }));
  }
  function redactExtract(ex, opts) {
    if (!ex) return ex;
    const copy = JSON.parse(JSON.stringify(ex));
    const walk = (v) => {
      if (typeof v === 'string') return redactText(v, opts);
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = walk(v[k]); return v; }
      return v;
    };
    return walk(copy);
  }
  return { redactText, redactTurns, redactExtract, EMAIL, PHONE };
});
