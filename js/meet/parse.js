/* Transcript parsers: VTT, SRT, plain TXT, JSON (Zoom/Meet/Teams-ish), and MeetMinder's own shape. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Meet = root.Meet || {}).parse = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return h > 0 ? h + ':' + pad(m) + ':' + pad(r) : m + ':' + pad(r);
  }
  function parseClock(str) {
    const m = String(str || '').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:[.,](\d{1,3}))?/);
    if (!m) return null;
    const a = Number(m[1]), b = Number(m[2]), c = m[3] != null ? Number(m[3]) : null;
    if (c == null) return a * 60 + b; // mm:ss
    return a * 3600 + b * 60 + c;
  }
  function parseVttClock(str) {
    const m = String(str || '').trim().match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/);
    if (!m) return parseClock(str);
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
  }

  function turnsFromLines(lines) {
    const out = [];
    for (const line of lines) {
      const s = String(line || '').trim();
      if (!s) continue;
      // [mm:ss] Speaker: text  OR  mm:ss Speaker: text  OR  Speaker: text
      let m = s.match(/^\[?((?:\d{1,2}:)?\d{1,2}:\d{2})\]?\s+([^:]{1,80}):\s*(.+)$/);
      if (m) { out.push({ t: parseClock(m[1]) || 0, speaker: m[2].trim(), text: m[3].trim() }); continue; }
      m = s.match(/^([^:]{1,80}):\s*(.+)$/);
      if (m && !/^(http|https)$/i.test(m[1])) { out.push({ t: out.length ? out[out.length - 1].t + 8 : 0, speaker: m[1].trim(), text: m[2].trim() }); continue; }
      out.push({ t: out.length ? out[out.length - 1].t + 8 : 0, speaker: 'Speaker', text: s });
    }
    return out;
  }

  function parseVtt(raw) {
    const blocks = String(raw || '').replace(/\r/g, '').split(/\n\n+/);
    const turns = [];
    for (const b of blocks) {
      const lines = b.split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lines.length || /^WEBVTT/i.test(lines[0]) || /^NOTE\b/i.test(lines[0])) continue;
      let i = 0;
      if (/^\d+$/.test(lines[0])) i = 1;
      const timing = lines[i] || '';
      const tm = timing.match(/((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*/);
      if (!tm) continue;
      const t = parseVttClock(tm[1]);
      const textLines = lines.slice(i + 1).map((l) => l.replace(/<[^>]+>/g, '')).filter(Boolean);
      if (!textLines.length) continue;
      const joined = textLines.join(' ');
      const sm = joined.match(/^<v\s+([^>]+)>/i) || joined.match(/^([^:]{1,60}):\s+/);
      let speaker = 'Speaker', text = joined;
      if (sm) {
        if (sm[0].startsWith('<')) { speaker = sm[1].trim(); text = joined.replace(/^<v\s+[^>]+>/i, '').replace(/<\/v>/ig, '').trim(); }
        else { speaker = sm[1].trim(); text = joined.slice(sm[0].length).trim(); }
      }
      turns.push({ t: Math.floor(t), speaker, text });
    }
    return turns;
  }

  function parseSrt(raw) {
    const blocks = String(raw || '').replace(/\r/g, '').split(/\n\n+/);
    const turns = [];
    for (const b of blocks) {
      const lines = b.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;
      let i = 0;
      if (/^\d+$/.test(lines[0])) i = 1;
      const timing = lines[i] || '';
      const tm = timing.match(/(\d{2}:\d{2}:\d{2}[.,]\d{1,3})\s*-->/);
      if (!tm) continue;
      const t = parseVttClock(tm[1]);
      const text = lines.slice(i + 1).join(' ').replace(/<[^>]+>/g, '').trim();
      if (!text) continue;
      const sm = text.match(/^([^:]{1,60}):\s+/);
      turns.push({ t: Math.floor(t), speaker: sm ? sm[1].trim() : 'Speaker', text: sm ? text.slice(sm[0].length).trim() : text });
    }
    return turns;
  }

  function parseJson(raw) {
    let j;
    try { j = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return null; }
    if (!j) return null;
    // MeetMinder shape
    if (Array.isArray(j.transcript)) return j.transcript.map((x) => ({ t: Number(x.t) || 0, speaker: String(x.speaker || 'Speaker'), text: String(x.text || '') })).filter((x) => x.text);
    if (Array.isArray(j.turns)) return j.turns.map((x) => ({ t: Number(x.t || x.start || 0), speaker: String(x.speaker || x.speakerLabel || 'Speaker'), text: String(x.text || x.utterance || '') })).filter((x) => x.text);
    // Zoom-ish
    if (Array.isArray(j.recording_play_passcode != null ? null : j) === false && Array.isArray(j.timeline)) {
      return j.timeline.map((x) => ({ t: Number(x.tsv || x.start || 0), speaker: String(x.users?.[0]?.username || x.speaker || 'Speaker'), text: String(x.text || '') })).filter((x) => x.text);
    }
    if (Array.isArray(j)) {
      return j.map((x) => ({ t: Number(x.t || x.start || x.begin || 0), speaker: String(x.speaker || x.name || 'Speaker'), text: String(x.text || x.content || '') })).filter((x) => x.text);
    }
    // Google Meet export sometimes nests under utterances
    if (Array.isArray(j.utterances)) {
      return j.utterances.map((x) => ({ t: Math.floor(Number(x.start || x.start_time || 0)), speaker: String(x.speaker || x.participant?.name || 'Speaker'), text: String(x.text || x.transcript || '') })).filter((x) => x.text);
    }
    if (Array.isArray(j.segments)) {
      return j.segments.map((x) => ({ t: Math.floor(Number(x.start || 0)), speaker: String(x.speaker || 'Speaker'), text: String(x.text || '') })).filter((x) => x.text);
    }
    return null;
  }

  function detectFormat(name, raw) {
    const n = String(name || '').toLowerCase();
    const s = String(raw || '').trim();
    if (n.endsWith('.vtt') || /^WEBVTT/i.test(s)) return 'vtt';
    if (n.endsWith('.srt') || /^\d+\s*\n\d{2}:\d{2}:\d{2}[.,]/m.test(s)) return 'srt';
    if (n.endsWith('.json') || /^[\[{]/.test(s)) return 'json';
    return 'txt';
  }

  function parse(raw, opts) {
    const o = opts || {};
    const fmt = o.format || detectFormat(o.filename, raw);
    let turns = [];
    if (fmt === 'vtt') turns = parseVtt(raw);
    else if (fmt === 'srt') turns = parseSrt(raw);
    else if (fmt === 'json') {
      turns = parseJson(raw);
      if (!turns) throw new Error('Could not read that JSON transcript. Expected an array of turns, or a Zoom/Meet/Teams-style export.');
    } else turns = turnsFromLines(String(raw || '').split(/\n/));
    turns = turns.filter((t) => t && t.text);
    const speakers = [];
    const seen = new Set();
    for (const t of turns) {
      if (!seen.has(t.speaker)) { seen.add(t.speaker); speakers.push(t.speaker); }
    }
    return { format: fmt, turns, speakers, durationSec: turns.length ? turns[turns.length - 1].t + 10 : 0 };
  }

  function toPlain(turns) {
    return (turns || []).map((t) => '[' + fmtTime(t.t) + '] ' + t.speaker + ': ' + t.text).join('\n');
  }

  function renameSpeaker(turns, from, to) {
    return (turns || []).map((t) => t.speaker === from ? Object.assign({}, t, { speaker: to }) : t);
  }

  return { parse, parseVtt, parseSrt, parseJson, detectFormat, turnsFromLines, fmtTime, parseClock, toPlain, renameSpeaker };
});
