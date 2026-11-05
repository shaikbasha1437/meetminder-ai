/* Settings: mode, providers, redaction, privacy, keys. */
(function (root) {
  'use strict';
  const { h, toast } = root.MM.ui;

  function render(rootEl) {
    const app = root.MM.app;
    const AK = app.AK;
    const s = app.settings();
    const section = (app.route.param || 'model');

    const nav = h('nav', { class: 'snav' },
      ...[['model', 'AI model'], ['privacy', 'Privacy'], ['transcribe', 'Transcription'], ['data', 'Data']].map(([id, label]) =>
        h('a', { href: '#settings/' + id, class: section === id ? 'on' : '', text: label })
      )
    );

    const body = h('div');

    if (section === 'model') {
      body.append(h('div', { class: 'ssec panel' },
        h('h2', { text: 'How notes are written' }),
        h('div', { class: 'seg' },
          ...[['demo', 'Demo (no key)'], ['live', 'Live (your key)'], ['webllm', 'In-browser model']].map(([id, label]) =>
            h('label', {}, h('input', {
              type: 'radio', name: 'mode', value: id, checked: s.mode === id,
              onchange: () => { app.saveSettings({ mode: id }); app.refresh(); }
            }), label)
          )
        ),
        h('p', { class: 'small muted', style: 'margin-top:10px', text: 'Demo uses the five bundled fictional meetings with deterministic notes. Live calls your provider from this browser (Anthropic needs the anthropic-dangerous-direct-browser-access header, which MeetMinder sends). WebLLM downloads a small model to the GPU — untested end-to-end here.' })
      ));

      if (s.mode === 'live') {
        const providers = AK.llm.PROVIDERS;
        body.append(h('div', { class: 'ssec panel' },
          h('h2', { text: 'Provider' }),
          h('label', { class: 'f' }, 'Provider',
            h('select', {
              onchange: (e) => { app.saveSettings({ provider: e.target.value, model: '' }); app.refresh(); }
            }, ...Object.keys(providers).map((id) => h('option', { value: id, selected: s.provider === id, text: providers[id].label })))
          )
        ));
        const p = s.provider in providers ? s.provider : 'openai';
        const P = providers[p];
        const model = s.model || P.defaultModel;
        const keyInput = h('input', { type: 'password', placeholder: P.keyHint || 'API key', value: app.keys.get(p) || '', autocomplete: 'off' });
        const baseInput = h('input', { type: 'url', value: s.baseUrl || P.baseUrl, placeholder: P.baseUrl });
        body.append(h('div', { class: 'ssec panel' },
          h('h2', { text: P.label + ' settings' }),
          h('label', { class: 'f' }, 'Model',
            h('select', {
              onchange: (e) => app.saveSettings({ model: e.target.value })
            }, ...P.models.map((m) => h('option', { value: m, selected: m === model, text: m })), h('option', { value: model, selected: !P.models.includes(model), text: model + ' (custom)' }))
          ),
          p === 'compatible' ? h('label', { class: 'f' }, 'Base URL', baseInput) : null,
          P.needsKey || p === 'compatible' ? h('label', { class: 'f' }, 'API key (stored only in this browser)', keyInput) : null,
          h('div', { class: 'seg', style: 'margin:8px 0' },
            h('label', {}, h('input', { type: 'radio', name: 'keymode', checked: s.keyMode !== 'session', onchange: () => app.saveSettings({ keyMode: 'local' }) }), 'Remember on this device'),
            h('label', {}, h('input', { type: 'radio', name: 'keymode', checked: s.keyMode === 'session', onchange: () => app.saveSettings({ keyMode: 'session' }) }), 'This tab only')
          ),
          h('div', { class: 'actions' },
            h('button', { type: 'button', class: 'btn primary', onclick: () => {
              if (p === 'compatible') app.saveSettings({ baseUrl: baseInput.value.trim() });
              app.keys.set(p, keyInput.value, app.settings().keyMode === 'session' ? 'session' : 'local');
              toast('Saved. Key never goes into exports or share links.');
              app.paintMode();
            } }, 'Save key'),
            h('button', { type: 'button', class: 'btn', onclick: async () => {
              app.keys.set(p, keyInput.value, app.settings().keyMode === 'session' ? 'session' : 'local');
              if (p === 'compatible') app.saveSettings({ baseUrl: baseInput.value.trim() });
              const cfg = app.modelCfg();
              try {
                const r = await AK.llm.call(cfg, { system: 'Reply with exactly OK.', messages: [{ role: 'user', content: 'ping' }], maxTokens: 16, temperature: 0 }, { timeoutMs: 20000 });
                toast('Provider responded: ' + String(r.text || '').slice(0, 40));
              } catch (e) {
                toast('Call failed (expected with a fake key): ' + e.message);
              }
            } }, 'Test call'),
            h('button', { type: 'button', class: 'btn danger', onclick: () => { app.keys.clear(p); keyInput.value = ''; toast('Key cleared.'); } }, 'Clear key')
          ),
          P.keyUrl ? h('p', { class: 'small muted' }, h('a', { href: P.keyUrl, target: '_blank', rel: 'noopener', text: 'Get a key' }), P.pricingUrl ? h('span', { text: ' · ' }) : null, P.pricingUrl ? h('a', { href: P.pricingUrl, target: '_blank', rel: 'noopener', text: 'Pricing' }) : null) : null
        ));
        if (p === 'compatible') {
          body.append(h('div', { class: 'ssec panel' },
            h('h3', { text: 'Presets' }),
            h('div', { class: 'actions' }, ...AK.llm.PRESETS.map((pr) => h('button', {
              type: 'button', class: 'btn sm',
              onclick: () => { app.saveSettings({ baseUrl: pr.baseUrl, model: pr.model }); baseInput.value = pr.baseUrl; app.refresh(); }
            }, pr.label)))
          ));
        }
      }
      if (s.mode === 'webllm') {
        body.append(h('div', { class: 'ssec panel' },
          h('h2', { text: 'In-browser model (WebLLM)' }),
          h('p', { class: 'notice warn', text: 'Optional and untested end-to-end in this build. Needs WebGPU (recent Chrome/Edge). First run downloads ~1 GB.' }),
          h('label', { class: 'f' }, 'Model',
            h('select', {
              onchange: (e) => app.saveSettings({ model: e.target.value })
            }, ...AK.webllm.MODELS.map((m) => h('option', { value: m.id, selected: s.model === m.id, text: m.label })))
          )
        ));
      }
    }

    if (section === 'privacy') {
      body.append(h('div', { class: 'ssec panel' },
        h('h2', { text: 'Privacy' }),
        h('label', { class: 'switch' }, h('input', {
          type: 'checkbox', checked: !!s.redactEmails,
          onchange: (e) => app.saveSettings({ redactEmails: e.target.checked })
        }), 'Redact emails in transcripts and notes'),
        h('label', { class: 'switch', style: 'display:flex;margin-top:8px' }, h('input', {
          type: 'checkbox', checked: !!s.redactPhones,
          onchange: (e) => app.saveSettings({ redactPhones: e.target.checked })
        }), 'Redact phone numbers'),
        h('label', { class: 'switch', style: 'display:flex;margin-top:8px' }, h('input', {
          type: 'checkbox', checked: !!s.consentAck,
          onchange: (e) => app.saveSettings({ consentAck: e.target.checked })
        }), 'I acknowledge the recording-consent reminder'),
        h('p', { class: 'small muted', style: 'margin-top:10px', text: 'API keys are stored only in this browser (localStorage or sessionStorage) and are stripped from exports.' })
      ));
    }

    if (section === 'transcribe') {
      const w = h('input', { type: 'password', placeholder: 'sk-... (OpenAI)', value: app.keys.get('whisper') || '', autocomplete: 'off' });
      const d = h('input', { type: 'password', placeholder: 'Deepgram key', value: app.keys.get('deepgram') || '', autocomplete: 'off' });
      body.append(h('div', { class: 'ssec panel' },
        h('h2', { text: 'File transcription (optional)' }),
        h('p', { class: 'notice warn', text: 'Browser calls to Whisper or Deepgram often fail on CORS. Prefer uploading VTT/SRT/TXT, using Web Speech for live mic, or the self-hosted server. Keys below are kept in this browser only; not end-to-end tested with real keys.' }),
        h('label', { class: 'f' }, 'OpenAI Whisper key', w),
        h('label', { class: 'f' }, 'Deepgram key', d),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn primary', onclick: () => {
            app.keys.set('whisper', w.value, 'local');
            app.keys.set('deepgram', d.value, 'local');
            toast('Transcription keys saved locally.');
          } }, 'Save'),
          h('button', { type: 'button', class: 'btn', onclick: async () => {
            // Honest fake-key probe: build request shape only / attempt and report.
            const key = w.value || app.keys.get('whisper');
            if (!key) { toast('Add a Whisper key first.'); return; }
            try {
              const r = await fetch('https://api.openai.com/v1/models', { headers: { authorization: 'Bearer ' + key } });
              toast('OpenAI models endpoint HTTP ' + r.status + (r.status === 401 ? ' (expected for a fake key; browser reached OpenAI)' : ''));
            } catch (e) {
              toast('Browser could not reach OpenAI (CORS or network): ' + e.message);
            }
          } }, 'Probe OpenAI from browser')
        )
      ));
    }

    if (section === 'data') {
      body.append(h('div', { class: 'ssec panel' },
        h('h2', { text: 'Data' }),
        h('p', { class: 'small muted', text: 'Everything stays in this browser unless you export it.' }),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn', onclick: () => {
            root.MM.ui.download('meetminder-export.json', JSON.stringify(app.store.exportAll(), null, 2), 'application/json');
          } }, 'Export workspace (keys redacted)'),
          h('button', { type: 'button', class: 'btn danger', onclick: async () => {
            const ok = await app.ask({ title: 'Clear all MeetMinder data?', text: 'Deletes meetings, local CRM and settings in this browser. API keys are cleared too.', ok: 'Clear', danger: true });
            if (!ok) return;
            app.store.clearAll();
            app.keys.clearAll(Object.keys(AK.llm.PROVIDERS).concat(['whisper', 'deepgram', 'recall', 'hubspot', 'salesforce']));
            toast('Cleared.');
            app.refresh();
          } }, 'Clear all data')
        )
      ));
      body.append(h('div', { class: 'ssec panel' },
        h('h2', { text: 'Theme' }),
        h('div', { class: 'seg' },
          ...[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([id, label]) =>
            h('label', {}, h('input', {
              type: 'radio', name: 'theme', value: id, checked: (s.theme || 'system') === id,
              onchange: () => {
                app.saveSettings({ theme: id });
                if (id === 'light' || id === 'dark') document.documentElement.dataset.theme = id;
                else delete document.documentElement.dataset.theme;
              }
            }), label)
          )
        )
      ));
    }

    rootEl.append(h('h1', { text: 'Settings' }), h('div', { class: 'settings' }, nav, body));
  }

  (root.MM.app.views = root.MM.app.views || {}).settings = { render };
})(self);
