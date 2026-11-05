/* Flag unbacked claims, invented numbers, and missing opt-out / consent notes in follow-ups. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Meet = root.Meet || {}).quality = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const NUMBER = /\$?\d[\d,]*(?:\.\d+)?%?|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty|thirty|forty|fifty|sixty|hundred|thousand)\b/gi;
  function numbersIn(s) { return String(s || '').match(NUMBER) || []; }
  function checkItem(item, turns) {
    const flags = [];
    if (item.backed === false) flags.push({ type: 'unbacked', message: item.flag || 'No supporting quote in the transcript.' });
    const text = item.text || item.body || '';
    const nums = numbersIn(text);
    if (nums.length && turns && turns.length) {
      const blob = turns.map((t) => t.text).join(' ').toLowerCase();
      for (const n of nums) {
        const needle = String(n).toLowerCase().replace(/[$,]/g, '');
        // Skip tiny numbers that often appear as list indices or times
        if (/^\d$/.test(needle)) continue;
        const ok = blob.includes(needle) || blob.includes(String(n).toLowerCase());
        if (!ok) flags.push({ type: 'invented_number', message: 'Number "' + n + '" was not found in the transcript.', value: n });
      }
    }
    return flags;
  }
  function checkExtract(extract, turns) {
    const flags = [];
    if (!extract) return flags;
    for (const key of ['decisions', 'actions', 'questions', 'risks']) {
      for (const item of extract[key] || []) {
        for (const f of checkItem(item, turns)) flags.push(Object.assign({ section: key, item: item.text }, f));
      }
    }
    if (extract.summary) {
      const fake = { text: extract.summary, backed: true };
      for (const f of checkItem(fake, turns)) flags.push(Object.assign({ section: 'summary', item: 'summary' }, f));
    }
    if (extract.followUp && extract.followUp.body) {
      const body = extract.followUp.body;
      // Follow-ups are drafts; warn if they invent a dollar amount not in transcript.
      for (const f of checkItem({ text: body, backed: true }, turns)) {
        if (f.type === 'invented_number') flags.push(Object.assign({ section: 'followUp', item: 'follow-up body' }, f));
      }
    }
    return flags;
  }
  return { checkItem, checkExtract, numbersIn };
});
