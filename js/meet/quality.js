/* Flag unbacked claims and invented numeric facts. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Meet = root.Meet || {}).quality = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Digits / $ / % only — bare English number-words are too noisy for a heuristic.
  const NUMBER = /\$\d[\d,]*(?:\.\d+)?k?|\b\d[\d,]*(?:\.\d+)?%|\b\d{2,}(?:\.\d+)?\b/gi;

  const WORD = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
    eighty: 80, ninety: 90
  };

  function numbersIn(s) { return String(s || '').match(NUMBER) || []; }

  function spokenDigits(text) {
    let s = String(text || '').toLowerCase();
    // thirty-two / thirty two → 32
    const tens = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
    const ones = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
    for (const [t, tv] of Object.entries(tens)) {
      for (const [o, ov] of Object.entries(ones)) {
        s = s.replace(new RegExp('\\b' + t + '[\\s-]+' + o + '\\b', 'g'), String(tv + ov));
      }
    }
    // nine hundred → 900
    for (const [o, ov] of Object.entries(Object.assign({}, ones, { ten: 10, eleven: 11, twelve: 12 }))) {
      s = s.replace(new RegExp('\\b' + o + '\\s+hundred\\b', 'g'), String(ov * 100));
    }
    // sixty thousand → 60000; one hundred twenty thousand → keep loose tokens
    for (const [w, v] of Object.entries(Object.assign({}, WORD, tens))) {
      s = s.replace(new RegExp('\\b' + w + '\\s+thousand\\b', 'g'), String(v * 1000));
    }
    // "one hundred twenty thousand" → 120000
    s = s.replace(/\b(\d+)\s+hundred\s+(\d+)\s+thousand\b/g, (_, a, b) => String(Number(a) * 100000 + Number(b) * 1000));
    s = s.replace(/\b(one|two|three|four|five|six|seven|eight|nine)\s+hundred\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+thousand\b/g, (m, a, b) => {
      const av = { one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9 }[a];
      const bv = { twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90 }[b];
      return String(av * 100000 + bv * 1000);
    });
    return s;
  }

  function normalizeBlob(turns) {
    const raw = (turns || []).map((t) => t.text).join(' ');
    return (raw + ' ' + spokenDigits(raw)).toLowerCase()
      .replace(/\$/g, '')
      .replace(/%/g, ' percent ')
      .replace(/,/g, '');
  }

  function presentInTranscript(rawNum, blob) {
    const n = String(rawNum);
    let core = n.toLowerCase().replace(/[$,]/g, '');
    const isPct = /%$/.test(n);
    const isMoney = /^\$/.test(n) || /k$/i.test(n);
    if (/k$/i.test(core)) core = String(Number(core.replace(/k$/i, '')) * 1000);
    if (isPct) core = core.replace(/%$/, '');

    if (blob.includes(n.toLowerCase())) return true;
    if (blob.includes(core)) return true;
    if (isPct && (blob.includes(core + ' percent') || blob.includes(core + 'percent'))) return true;
    if (isMoney) {
      if (blob.includes(core) || blob.includes(core + '000') || blob.includes(String(Number(core) * 1000))) return true;
      // $120k written as "one hundred twenty thousand" — spokenDigits may leave "120000" if we add it
      if (blob.includes(String(Number(core) * 1000))) return true;
    }
    // 900 from "nine hundred" already injected by spokenDigits
    return false;
  }

  function checkItem(item, turns) {
    const flags = [];
    if (item.backed === false) flags.push({ type: 'unbacked', message: item.flag || 'No supporting quote in the transcript.' });
    const text = item.text || item.body || '';
    const nums = numbersIn(text);
    if (nums.length && turns && turns.length) {
      const blob = normalizeBlob(turns);
      for (const n of nums) {
        if (!presentInTranscript(n, blob)) {
          flags.push({ type: 'invented_number', message: 'Number "' + n + '" was not found in the transcript.', value: n });
        }
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
      for (const f of checkItem({ text: extract.summary, backed: true }, turns)) {
        flags.push(Object.assign({ section: 'summary', item: 'summary' }, f));
      }
    }
    if (extract.followUp && extract.followUp.body) {
      for (const f of checkItem({ text: extract.followUp.body, backed: true }, turns)) {
        if (f.type === 'invented_number') flags.push(Object.assign({ section: 'followUp', item: 'follow-up body' }, f));
      }
    }
    return flags;
  }

  return { checkItem, checkExtract, numbersIn, presentInTranscript, normalizeBlob, spokenDigits };
});
