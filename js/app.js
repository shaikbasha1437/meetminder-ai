/* MeetMinder AI app core: state, routing, running the agent, CRM apply, shared widgets. */
(function (root) {
  'use strict';
  const { $, $$, h, toast, undoToast, sheet, ask } = MM.ui;
  const AK = root.AgentKit;
  const keys = AK.keystore.createKeyStore({ prefix: 'meetminder' });
  const store = root.Meet.store.createStore();
  const app = {
    views: {}, keys, store, running: null, liveTrace: null,
    route: { tab: 'meetings', param: '' },
    webllm: { text: '' },
    busy: null
  };
  root.MM.app = app;
  const PROVIDER_IDS = Object.keys(AK.llm.PROVIDERS);

  app.knownKeys = () => PROVIDER_IDS.concat(['whisper', 'deepgram', 'recall', 'hubspot', 'salesforce']).map((p) => keys.get(p)).filter(Boolean);
  app.settings = () => store.getSettings();
  app.saveSettings = (patch) => { store.setSettings(patch); app.paintMode(); };

  app.modelCfg = () => {
    const s = app.settings();
    const p = s.provider in AK.llm.PROVIDERS ? s.provider : 'openai';
    const P = AK.llm.PROVIDERS[p];
    return {
      provider: p,
      model: s.model || P.defaultModel,
      baseUrl: p === 'compatible' ? (s.baseUrl || P.baseUrl) : '',
      key: keys.get(p),
      referer: location.origin + location.pathname,
      title: 'MeetMinder AI'
    };
  };
  app.llm = () => {
    const s = app.settings();
    if (s.mode === 'live') {
      const c = app.modelCfg(); const P = AK.llm.PROVIDERS[c.provider];
      if (P.needsKey && !c.key) return { error: 'Live mode needs your ' + P.label + ' API key. Add it in Settings, or switch back to demo mode.' };
      return { label: P.label, model: c.model, cfg: c, call: (msg) => AK.llm.call(c, msg, { timeoutMs: 90000 }) };
    }
    if (s.mode === 'webllm') {
      const model = s.model || AK.webllm.MODELS[0].id;
      return { label: 'In-browser (WebLLM)', model, cfg: null, call: (msg) => AK.webllm.call({ model, onProgress: (p) => { app.webllm.text = p.text || ''; } }, msg) };
    }
    return null;
  };
  app.modeLabel = () => {
    const s = app.settings();
    if (s.mode === 'live') { const c = app.modelCfg(); return 'Live · ' + AK.llm.PROVIDERS[c.provider].label + ' · ' + c.model; }
    if (s.mode === 'webllm') return 'In-browser model';
    return 'Demo mode · fictional meetings';
  };
  app.paintMode = () => {
    const c = $('#mode-chip'); if (!c) return;
    c.textContent = app.modeLabel();
    c.className = 'mode-chip ' + (app.settings().mode === 'demo' ? 'demo' : 'live');
  };

  app.go = (hash) => { location.hash = hash; };
  app.parseRoute = () => {
    const raw = (location.hash || '#meetings').replace(/^#/, '');
    const [tab, param] = raw.split('/');
    app.route = { tab: tab || 'meetings', param: param || '' };
  };
  app.refresh = () => {
    app.parseRoute();
    app.paintMode();
    $$('.tabs a, .bottom-tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === app.route.tab));
    const view = $('#view');
    view.textContent = '';
    if (app.route.tab === 'meeting' && app.route.param) {
      if (app.views.meeting) app.views.meeting.render(view, app.route.param);
      else view.append(h('p', { text: 'Meeting view missing.' }));
      return;
    }
    const name = app.route.tab;
    if (app.views[name]) app.views[name].render(view);
    else if (app.views.meetings) app.views.meetings.render(view);
  };
  window.addEventListener('hashchange', () => app.refresh());

  app.fmtTime = root.Meet.parse.fmtTime;

  app.runDemo = async (demoId) => {
    if (app.running) return;
    app.running = { demoId }; app.liveTrace = [];
    app.refresh();
    try {
      const r = await root.Meet.agent.runDemoMeeting(demoId, store, {
        now: () => Date.now(),
      });
      app.liveTrace = r.steps;
      app.running = null;
      app.refresh();
      toast('Notes ready for “' + r.meeting.title + '”. Nothing was sent.');
      app.go('#meeting/' + r.meeting.id);
      return r;
    } catch (e) {
      app.running = null; app.refresh();
      toast('Could not run demo: ' + e.message);
    }
  };

  app.runTurns = async (turns, meta) => {
    if (app.running) return;
    const llm = app.llm();
    if (app.settings().mode === 'live' && llm && llm.error) { toast(llm.error); return; }
    app.running = { custom: true }; app.refresh();
    try {
      const cfg = llm && llm.cfg ? llm.cfg : null;
      const r = await root.Meet.agent.runTranscript(turns, meta, store, cfg, { timeoutMs: 90000 });
      app.running = null; app.refresh();
      toast('Notes ready. Nothing was sent.');
      app.go('#meeting/' + r.meeting.id);
      return r;
    } catch (e) {
      app.running = null; app.refresh();
      toast('Could not extract notes: ' + e.message);
    }
  };

  app.applyCrm = async (meetingId, approvals) => {
    try {
      const r = root.Meet.agent.applyCrm(store, meetingId, approvals);
      undoToast('CRM updated (' + r.applied.length + ' change' + (r.applied.length === 1 ? '' : 's') + ').', () => {
        root.Meet.agent.undoCrm(store);
        app.refresh();
      });
      app.refresh();
      return r;
    } catch (e) { toast(e.message); }
  };

  app.deleteMeeting = async (id) => {
    const ok = await ask({ title: 'Delete this meeting?', text: 'Notes, transcript and CRM proposal for this meeting will be removed from this browser. You can undo right after.', ok: 'Delete', danger: true });
    if (!ok) return;
    const m = store.deleteMeeting(id);
    if (!m) return;
    undoToast('Deleted “' + m.title + '”.', () => { store.restoreMeeting(m); app.refresh(); });
    if (app.route.tab === 'meeting' && app.route.param === id) app.go('#meetings');
    else app.refresh();
  };

  app.about = () => {
    sheet({
      id: 'about', title: 'About MeetMinder AI',
      body: (b) => {
        b.append(
          h('p', { text: 'MeetMinder turns meeting transcripts into cited notes, action items and a CRM changeset you approve field-by-field. Follow-up emails are drafts only (copy or mailto). Nothing is ever sent from this page.' }),
          h('p', { text: 'Demo mode ships five fictional meetings (sales discovery, standup, QBR, hiring sync, and a messy brainstorm). People and companies use .example domains.' }),
          h('p', { text: 'Browsers cannot join Zoom, Google Meet or Teams as a bot. The optional self-hosted /server adds a transcript webhook, a Recall.ai-style adapter (your key) and HubSpot/Salesforce push proxies. Joining calls is simulated in demo.' }),
          h('p', { class: 'small muted', text: 'MIT licensed · runs in your browser · API keys stay in this browser only.' })
        );
      }
    });
  };

  app.ensureConsent = async () => {
    if (store.getSettings().consentAck) return true;
    const ok = await ask({
      title: 'Before you record',
      text: [
        'Recording or transcribing a call may require consent under the laws where you and your attendees are. Tell people you are recording and follow your company policy.',
        'MeetMinder keeps audio and transcripts in this browser unless you export them or point the optional self-hosted server at a third-party service.',
        'Continue?'
      ],
      ok: 'I understand',
      cancel: 'Cancel'
    });
    if (ok) store.setSettings({ consentAck: true });
    return ok;
  };

  // Expose for views
  app.h = h; app.$ = $; app.$$ = $$; app.toast = toast; app.undoToast = undoToast; app.sheet = sheet; app.ask = ask;
  app.AK = AK;
})(self);
