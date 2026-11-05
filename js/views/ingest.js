/* Capture: demo live playback, Web Speech, upload transcript/audio, paste. */
(function (root) {
  'use strict';
  const { h, toast } = root.MM.ui;

  function render(rootEl) {
    const app = root.MM.app;
    const state = {
      turns: [],
      title: 'Untitled meeting',
      interim: '',
      rec: null,
      play: null,
      speakers: {}
    };

    const liveBox = h('div', { class: 'transcript', id: 'live-transcript' });
    const interimEl = h('p', { class: 'muted small', id: 'interim', text: '' });
    const status = h('p', { class: 'small', id: 'cap-status', text: 'Idle.' });

    function paintTurns() {
      liveBox.textContent = '';
      for (const t of state.turns) {
        liveBox.append(h('div', { class: 'turn', 'data-t': t.t },
          h('span', { class: 'tm', text: app.fmtTime(t.t) }),
          h('span', { class: 'sp', text: state.speakers[t.speaker] || t.speaker }),
          h('span', { class: 'tx', text: t.text })
        ));
      }
      liveBox.scrollTop = liveBox.scrollHeight;
    }

    function stopAll() {
      if (state.rec) { try { state.rec.stop(); } catch (e) {} state.rec = null; }
      if (state.play) { state.play.stop(); state.play = null; }
      status.textContent = 'Stopped. ' + state.turns.length + ' turns captured.';
    }

    async function startMic() {
      const ok = await app.ensureConsent();
      if (!ok) return;
      const s = root.Meet.speech.support();
      if (!s.ok) { toast(s.reason); return; }
      stopAll();
      state.turns = []; paintTurns();
      try {
        state.rec = root.Meet.speech.createRecognizer({
          speaker: 'You',
          onTurn: (turn, all) => { state.turns = all; state.interim = ''; interimEl.textContent = ''; paintTurns(); },
          onInterim: (t) => { state.interim = t; interimEl.textContent = '… ' + t; },
          onError: (e) => toast('Speech error: ' + e)
        });
        state.rec.start();
        status.textContent = 'Listening via Web Speech API…';
      } catch (e) { toast(e.message); }
    }

    function startPlayback(demoId) {
      stopAll();
      state.turns = []; paintTurns();
      try {
        state.play = root.Meet.playback.createPlayback(demoId, {
          speed: 14,
          onTurn: (turn, all) => { state.turns = all; paintTurns(); status.textContent = 'Simulated live · ' + all.length + ' turns'; },
          onDone: (all) => { state.turns = all; state.play = null; status.textContent = 'Playback finished · ' + all.length + ' turns'; paintTurns(); }
        });
        state.title = state.play.meeting.title;
        titleInput.value = state.title;
        state.play.start();
        status.textContent = 'Simulated live meeting streaming…';
      } catch (e) { toast(e.message); }
    }

    async function onFile(file) {
      if (!file) return;
      const name = file.name || '';
      const lower = name.toLowerCase();
      if (/\.(vtt|srt|txt|json|md)$/i.test(lower) || file.type.startsWith('text') || file.type === 'application/json') {
        const raw = await file.text();
        try {
          const parsed = root.Meet.parse.parse(raw, { filename: name });
          state.turns = parsed.turns;
          state.title = name.replace(/\.[^.]+$/, '') || state.title;
          titleInput.value = state.title;
          paintTurns();
          status.textContent = 'Loaded ' + parsed.turns.length + ' turns from ' + parsed.format.toUpperCase() + '.';
        } catch (e) { toast(e.message); }
        return;
      }
      // Audio/video: try browser speech on playback is impractical; offer Whisper if key set, else honest limit.
      const whisper = app.keys.get('whisper');
      if (whisper) {
        toast('Whisper/Deepgram from the browser depends on CORS. Use the self-hosted server for reliable file transcription, or upload a VTT/SRT/TXT instead.');
      } else {
        toast('Audio/video file transcription needs a Whisper or Deepgram key (Settings) plus CORS, or upload a VTT/SRT/TXT/JSON transcript. Demo mode works fully offline without audio.');
      }
    }

    const titleInput = h('input', { type: 'text', value: state.title, oninput: (e) => { state.title = e.target.value; } });
    const pasteArea = h('textarea', { placeholder: 'Paste a transcript…\n[00:12] Ava Chen: Thanks for joining…', rows: 6 });

    const playId = sessionStorage.getItem('mm.play');
    if (playId) { sessionStorage.removeItem('mm.play'); setTimeout(() => startPlayback(playId), 50); }

    rootEl.append(
      h('div', { class: 'toolbar' },
        h('div', { class: 'grow' }, h('h1', { text: 'Capture' }), h('p', { class: 'muted small', text: 'Live mic (Web Speech), simulated live demo, upload VTT/SRT/TXT/JSON, or paste text. Speaker labels are editable before you run notes.' }))
      ),
      h('div', { class: 'notice warn', text: 'Recording laws vary. Tell attendees you are recording. MeetMinder stores data in this browser unless you export it or use the optional server.' }),
      h('div', { class: 'cols', style: 'margin-top:14px' },
        h('div', { class: 'panel' },
          h('h2', { text: 'Inputs' }),
          h('label', { class: 'f' }, 'Meeting title', titleInput),
          h('div', { class: 'actions' },
            h('button', { type: 'button', class: 'btn primary', onclick: startMic }, h('span', { class: 'live-dot', style: 'display:none' }), 'Start mic'),
            h('button', { type: 'button', class: 'btn', onclick: stopAll }, 'Stop'),
            h('button', { type: 'button', class: 'btn', onclick: () => startPlayback('demo-discovery') }, 'Simulate live (discovery)')
          ),
          h('div', { class: 'drop', style: 'margin-top:12px',
            ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add('over'); },
            ondragleave: (e) => e.currentTarget.classList.remove('over'),
            ondrop: (e) => { e.preventDefault(); e.currentTarget.classList.remove('over'); onFile(e.dataTransfer.files[0]); }
          },
            h('p', { text: 'Drop a VTT, SRT, TXT or JSON transcript here' }),
            h('input', { type: 'file', accept: '.vtt,.srt,.txt,.json,.md,audio/*,video/*', onchange: (e) => onFile(e.target.files[0]) })
          ),
          h('label', { class: 'f', style: 'margin-top:12px' }, 'Or paste transcript', pasteArea),
          h('button', { type: 'button', class: 'btn', onclick: () => {
            try {
              const parsed = root.Meet.parse.parse(pasteArea.value, { format: 'txt' });
              state.turns = parsed.turns; paintTurns();
              status.textContent = 'Parsed ' + parsed.turns.length + ' turns.';
            } catch (e) { toast(e.message); }
          } }, 'Parse paste'),
          status
        ),
        h('div', { class: 'panel' },
          h('h2', { text: 'Live transcript' }),
          liveBox, interimEl,
          h('div', { class: 'actions', style: 'margin-top:12px' },
            h('button', {
              type: 'button', class: 'btn primary',
              onclick: () => {
                if (!state.turns.length) { toast('Capture or load a transcript first.'); return; }
                // Apply speaker renames
                let turns = state.turns.map((t) => Object.assign({}, t, { speaker: state.speakers[t.speaker] || t.speaker }));
                app.runTurns(turns, { title: state.title || 'Untitled meeting', when: new Date().toISOString(), participants: [] });
              }
            }, 'Generate notes'),
            h('button', {
              type: 'button', class: 'btn',
              onclick: () => {
                const names = Array.from(new Set(state.turns.map((t) => t.speaker)));
                if (!names.length) { toast('No speakers yet.'); return; }
                root.MM.ui.sheet({
                  id: 'speakers', title: 'Edit speaker labels',
                  body: (b) => {
                    const dirty = { v: false };
                    const inputs = {};
                    b.append(h('p', { class: 'muted small', text: 'Rename speakers. Required fields never block Cancel.' }));
                    const wrap = h('div', { class: 'speaker-edit' });
                    for (const n of names) {
                      const inp = h('input', { type: 'text', value: state.speakers[n] || n, oninput: () => { dirty.v = true; } });
                      inputs[n] = inp;
                      wrap.append(h('label', {}, n + ' → ', inp));
                    }
                    b.append(wrap);
                    // stash for isDirty
                    b._dirty = () => dirty.v;
                    b._inputs = inputs;
                  },
                  isDirty: () => {
                    const body = document.querySelector('[data-sheet="speakers"] .sheet-body');
                    return !!(body && body._dirty && body._dirty());
                  },
                  confirmText: 'Discard speaker renames?',
                  actions: [{
                    id: 'save', label: 'Save', cls: 'primary', fn: (api) => {
                      const body = api.body;
                      const inputs = body._inputs || {};
                      for (const n of Object.keys(inputs)) state.speakers[n] = inputs[n].value.trim() || n;
                      paintTurns();
                      api.close();
                    }
                  }]
                });
              }
            }, 'Edit speakers')
          )
        )
      )
    );
  }

  (root.MM.app.views = root.MM.app.views || {}).ingest = { render };
})(self);
