/* Self-hosted server status, webhook pull, connector push (via server). */
(function (root) {
  'use strict';
  const { h, toast, copy } = root.MM.ui;

  function render(rootEl) {
    const app = root.MM.app;
    const s = app.settings();
    const urlInput = h('input', { type: 'url', placeholder: 'http://127.0.0.1:8787', value: s.serverUrl || '' });

    rootEl.append(
      h('div', { class: 'toolbar' },
        h('div', { class: 'grow' },
          h('h1', { text: 'Self-hosted server' }),
          h('p', { class: 'muted small', text: 'Browsers cannot join Zoom, Meet or Teams as a bot. Run /server on your machine for a transcript webhook, a Recall.ai-style adapter (your key), and HubSpot/Salesforce push proxies.' })
        )
      ),
      h('div', { class: 'notice', text: 'In demo mode, call joining is simulated with the built-in live playback. Real joining needs this server plus a third-party meeting-bot service. HubSpot/Salesforce pushes from the browser are disabled on purpose.' }),
      h('div', { class: 'panel', style: 'margin-top:14px' },
        h('h2', { text: 'Connect' }),
        h('label', { class: 'f' }, 'Server base URL', urlInput),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn primary', onclick: async () => {
            const u = urlInput.value.trim().replace(/\/+$/, '');
            app.saveSettings({ serverUrl: u });
            if (!u) { toast('Cleared server URL.'); return; }
            try {
              const r = await fetch(u + '/health');
              const j = await r.json();
              toast(j.ok ? 'Server reachable · ' + (j.version || 'ok') : 'Unexpected health response');
            } catch (e) {
              toast('Could not reach server: ' + e.message + '. Is it running? See README.');
            }
          } }, 'Save & ping'),
          h('button', { type: 'button', class: 'btn', onclick: async () => {
            const u = (app.settings().serverUrl || '').replace(/\/+$/, '');
            if (!u) { toast('Set a server URL first.'); return; }
            try {
              const r = await fetch(u + '/transcripts?limit=5');
              const j = await r.json();
              const list = j.transcripts || [];
              if (!list.length) { toast('No webhook transcripts on the server yet.'); return; }
              const t = list[0];
              const turns = t.turns || t.transcript || [];
              await app.runTurns(turns, { title: t.title || 'Webhook meeting', when: t.when || new Date().toISOString() });
            } catch (e) { toast('Pull failed: ' + e.message); }
          } }, 'Pull latest webhook transcript')
        )
      ),
      h('div', { class: 'panel', style: 'margin-top:14px' },
        h('h2', { text: 'Quick start' }),
        h('pre', { class: 'box', text: 'cd server\nnpm install\nnpm start\n# or: docker build -t meetminder-server . && docker run --rm -p 8787:8787 meetminder-server' }),
        h('p', { class: 'small muted', text: 'Endpoints: GET /health, POST /webhooks/transcript, GET /transcripts, POST /connectors/hubspot/push, POST /connectors/salesforce/push, POST /adapters/recall/start (simulated with RECALL_API_KEY).' }),
        h('button', { type: 'button', class: 'btn', onclick: async () => {
          const ok = await copy('cd server && npm install && npm start');
          toast(ok ? 'Command copied.' : 'Could not copy.');
        } }, 'Copy start command')
      ),
      h('div', { class: 'panel', style: 'margin-top:14px' },
        h('h2', { text: 'Push a CRM changeset via server' }),
        h('p', { class: 'small muted', text: 'Open a meeting, export or copy HubSpot/Salesforce payloads, then POST them to the server with your token in the server env (HUBSPOT_TOKEN / SALESFORCE_TOKEN). The page will POST to your server URL only — tokens never leave the server process. Tested against mock servers only.' }),
        h('button', { type: 'button', class: 'btn', onclick: async () => {
          const u = (app.settings().serverUrl || '').replace(/\/+$/, '');
          if (!u) { toast('Set a server URL first.'); return; }
          const meetings = app.store.listMeetings().filter((m) => m.crmChangeset && m.crmChangeset.fields && m.crmChangeset.fields.length);
          if (!meetings.length) { toast('No meeting with a CRM changeset yet. Run a demo first.'); return; }
          const m = meetings[0];
          const ops = root.Meet.adapters.hubspotFromChangeset(m.crmChangeset);
          try {
            const r = await fetch(u + '/connectors/hubspot/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ops, dryRun: true }) });
            const j = await r.json();
            toast(j.ok ? 'Dry-run ok · ' + (j.results || []).length + ' ops (mock or real depending on server env)' : ('Push failed: ' + (j.error || r.status)));
          } catch (e) { toast('Push failed: ' + e.message); }
        } }, 'Dry-run HubSpot push (latest changeset)')
      )
    );
  }

  (root.MM.app.views = root.MM.app.views || {}).server = { render };
})(self);
