/* Demo extraction: returns the deterministic extract for a known demo meeting, or a lightweight
   heuristic extract for pasted/uploaded transcripts (no LLM). Live mode uses live.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../data/meetings'), require('./cite'), require('./quality'));
  else (root.Meet = root.Meet || {}).extract = factory(root.MeetData, root.Meet.cite, root.Meet.quality);
})(typeof self !== 'undefined' ? self : this, function (MeetData, cite, quality) {
  'use strict';

  function demoExtract(meetingId) {
    const m = MeetData.byId(meetingId);
    if (!m || !m.extract) return null;
    const turns = m.transcript;
    const extract = cite.attachAll(JSON.parse(JSON.stringify(m.extract)), turns);
    const flags = quality.checkExtract(extract, turns);
    return { mode: 'demo', extract, flags, meeting: { id: m.id, title: m.title, kind: m.kind, when: m.when, participants: m.participants, company: m.company, deal: m.deal } };
  }

  // Heuristic fallback for arbitrary transcripts when no API key is set.
  function heuristicExtract(turns, meta) {
    const text = (turns || []).map((t) => t.text).join(' ');
    const decisions = [];
    const actions = [];
    const questions = [];
    const risks = [];
    const decisionRe = /\b(we (?:will|are going to|decided to)|decision:|let'?s|agreed to)\b([^.]{5,120})/gi;
    let m;
    while ((m = decisionRe.exec(text)) && decisions.length < 6) {
      const snippet = (m[1] + m[2]).trim();
      decisions.push(cite.attachCite({ text: snippet.replace(/^decision:\s*/i, '').trim(), cite: { quote: snippet } }, turns));
    }
    const actionRe = /\b(I will|I'?ll|we will|can you|please)\b([^.]{5,120})/gi;
    while ((m = actionRe.exec(text)) && actions.length < 8) {
      const speaker = (turns.find((t) => t.text.includes(m[2].trim().slice(0, 20))) || {}).speaker || null;
      const owner = /^I will|^I'?ll/i.test(m[1]) ? speaker : null;
      actions.push(cite.attachCite({ text: (m[1] + m[2]).trim(), owner, due: null, cite: { quote: (m[1] + m[2]).trim() } }, turns));
    }
    for (const t of turns || []) {
      if (/\?/.test(t.text) && questions.length < 6) questions.push(cite.attachCite({ text: t.text, cite: { t: t.t, quote: t.text } }, turns));
      if (/\b(risk|blocker|blocked|concern|worried|compliance)\b/i.test(t.text) && risks.length < 6) {
        risks.push(cite.attachCite({ text: t.text, cite: { t: t.t, quote: t.text } }, turns));
      }
    }
    const summary = ((meta && meta.title) ? meta.title + '. ' : '') + (turns || []).slice(0, 3).map((t) => t.speaker + ' discussed ' + t.text.slice(0, 60)).join('; ').slice(0, 400);
    const extract = {
      summary,
      decisions, actions, questions, risks,
      sentiment: { score: 0.5, label: 'neutral', backed: false, flag: 'heuristic only' },
      followUp: {
        to: ((meta && meta.participants) || []).map((p) => p.email).filter(Boolean).join(', '),
        subject: 'Notes · ' + ((meta && meta.title) || 'Meeting'),
        body: 'Hi,\n\nNotes from our meeting:\n\nSummary: ' + summary + '\n\nActions:\n' + actions.map((a) => '• ' + a.text + (a.owner ? ' (' + a.owner + ')' : '')).join('\n') + '\n\n— MeetMinder'
      },
      crm: { companyUpsert: null, contactsUpsert: [], dealUpsert: null, tasks: actions.slice(0, 5).map((a) => ({ title: a.text.slice(0, 80), owner: a.owner, due: a.due })), activity: { type: 'meeting', subject: (meta && meta.title) || 'Meeting' } }
    };
    const flags = quality.checkExtract(extract, turns).concat([{ type: 'heuristic', message: 'Demo heuristic extract (no AI key). Switch to Live mode for model-backed notes.' }]);
    return { mode: 'heuristic', extract, flags, meeting: meta || {} };
  }

  function extractMeeting(input) {
    // input: { demoId } or { turns, meta }
    if (input && input.demoId) {
      const r = demoExtract(input.demoId);
      if (r) return r;
    }
    return heuristicExtract(input.turns || [], input.meta || {});
  }

  return { demoExtract, heuristicExtract, extractMeeting };
});
