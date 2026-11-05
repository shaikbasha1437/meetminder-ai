/* Orchestrates ingest → extract → quality → CRM proposal for one meeting. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./extract'), require('./live'), require('./crmdiff'), require('./cite'), require('./quality'), require('./redact'), require('./store'), require('../data/meetings'));
  } else {
    (root.Meet = root.Meet || {}).agent = factory(root.Meet.extract, root.Meet.live, root.Meet.crmdiff, root.Meet.cite, root.Meet.quality, root.Meet.redact, root.Meet.store, root.MeetData);
  }
})(typeof self !== 'undefined' ? self : this, function (extract, live, crmdiff, cite, quality, redact, storeMod, MeetData) {
  'use strict';

  async function runDemoMeeting(demoId, store, opts) {
    const m = MeetData.byId(demoId);
    if (!m) throw new Error('Unknown demo meeting: ' + demoId);
    const steps = [];
    const t0 = (opts && opts.now) ? opts.now() : Date.now();
    const tick = (name, detail) => { steps.push({ name, detail, ms: ((opts && opts.now) ? opts.now() : Date.now()) - t0 }); };

    tick('load', m.title);
    let turns = m.transcript.slice();
    const settings = store.getSettings();
    if (settings.redactEmails || settings.redactPhones) {
      turns = redact.redactTurns(turns, { emails: settings.redactEmails, phones: settings.redactPhones });
      tick('redact', 'emails=' + !!settings.redactEmails + ' phones=' + !!settings.redactPhones);
    }
    tick('extract', 'demo');
    const result = extract.demoExtract(demoId);
    let ex = result.extract;
    if (settings.redactEmails || settings.redactPhones) ex = redact.redactExtract(ex, { emails: settings.redactEmails, phones: settings.redactPhones });

    const meeting = {
      id: storeMod.newMeetingId(),
      demoId: m.id,
      title: m.title,
      kind: m.kind,
      when: m.when,
      durationSec: m.durationSec,
      participants: m.participants,
      company: m.company,
      deal: m.deal,
      tags: m.tags,
      turns,
      extract: ex,
      flags: result.flags,
      mode: 'demo',
      createdAt: Date.now(),
      crmChangeset: null,
      crmApplied: false
    };

    tick('crm_propose', '');
    const changeset = crmdiff.propose(store.getCrm(), ex.crm, { meetingId: meeting.id, when: meeting.when });
    meeting.crmChangeset = changeset;
    store.putMeeting(meeting);
    tick('done', changeset.summary);
    return { meeting, steps, result };
  }

  async function runTranscript(turns, meta, store, llmCfg, deps) {
    const steps = [];
    const t0 = (deps && deps.now) ? deps.now() : Date.now();
    const tick = (name, detail) => { steps.push({ name, detail, ms: ((deps && deps.now) ? deps.now() : Date.now()) - t0 }); };
    const settings = store.getSettings();
    let t = turns.slice();
    if (settings.redactEmails || settings.redactPhones) {
      t = redact.redactTurns(t, { emails: settings.redactEmails, phones: settings.redactPhones });
      tick('redact', '');
    }
    let result;
    if (settings.mode === 'live' && llmCfg && llmCfg.provider) {
      tick('extract', 'live:' + llmCfg.provider);
      result = await live.extractLive(llmCfg, t, meta, deps);
    } else {
      tick('extract', 'heuristic');
      result = extract.heuristicExtract(t, meta);
    }
    let ex = result.extract;
    if (settings.redactEmails || settings.redactPhones) ex = redact.redactExtract(ex, { emails: settings.redactEmails, phones: settings.redactPhones });
    const meeting = {
      id: storeMod.newMeetingId(),
      title: (meta && meta.title) || 'Untitled meeting',
      kind: (meta && meta.kind) || 'general',
      when: (meta && meta.when) || new Date().toISOString(),
      durationSec: t.length ? t[t.length - 1].t + 10 : 0,
      participants: (meta && meta.participants) || [],
      company: (meta && meta.company) || null,
      deal: (meta && meta.deal) || null,
      tags: (meta && meta.tags) || [],
      turns: t,
      extract: ex,
      flags: result.flags || [],
      mode: result.mode,
      createdAt: Date.now(),
      crmChangeset: null,
      crmApplied: false,
      usage: result.usage || null,
      cost: result.cost || null,
      model: result.model || null
    };
    tick('crm_propose', '');
    meeting.crmChangeset = crmdiff.propose(store.getCrm(), ex.crm, { meetingId: meeting.id, when: meeting.when });
    store.putMeeting(meeting);
    tick('done', meeting.crmChangeset.summary);
    return { meeting, steps, result };
  }

  function applyCrm(store, meetingId, fieldApprovals) {
    const m = store.getMeeting(meetingId);
    if (!m || !m.crmChangeset) throw new Error('No CRM changeset to apply.');
    if (fieldApprovals) {
      for (const f of m.crmChangeset.fields) {
        if (Object.prototype.hasOwnProperty.call(fieldApprovals, f.id)) f.approved = !!fieldApprovals[f.id];
      }
    }
    const db = store.getCrm();
    const { snapshot, applied } = requireApply(db, m.crmChangeset);
    store.setCrm(db);
    m.crmApplied = true;
    m.crmAppliedAt = Date.now();
    m.crmAppliedFields = applied;
    store.putMeeting(m);
    store.pushUndo({ type: 'crmApply', meetingId, snapshot });
    return { meeting: m, applied, snapshot };
  }

  function requireApply(db, changeset) {
    // crmdiff is already loaded as crmdiff
    return crmdiff.apply(db, changeset);
  }

  function undoCrm(store) {
    const u = store.popUndo();
    if (!u || u.type !== 'crmApply') return null;
    store.applyCrmSnapshot(u.snapshot);
    const m = store.getMeeting(u.meetingId);
    if (m) { m.crmApplied = false; delete m.crmAppliedAt; store.putMeeting(m); }
    return u;
  }

  return { runDemoMeeting, runTranscript, applyCrm, undoCrm };
});
