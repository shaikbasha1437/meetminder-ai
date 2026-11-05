/* Meetings list + demo catalog. */
(function (root) {
  'use strict';
  const app = () => root.MM.app;
  const { h, when } = root.MM.ui;

  function render(rootEl) {
    const A = app();
    const store = A.store;
    const saved = store.listMeetings();
    const demos = root.MeetData.list();

    rootEl.append(
      h('div', { class: 'toolbar' },
        h('div', { class: 'grow' }, h('h1', { text: 'Meetings' }), h('p', { class: 'muted small', text: 'Run a demo, capture live speech, or upload a transcript. Every note cites the transcript.' })),
        h('button', { type: 'button', class: 'btn primary', onclick: () => A.go('#ingest') }, 'Capture / upload')
      )
    );

    if (A.running) {
      rootEl.append(h('div', { class: 'notice', text: 'Working on notes…' }));
    }

    if (saved.length) {
      rootEl.append(h('h2', { text: 'Your meetings' }));
      const grid = h('div', { class: 'grid' });
      for (const m of saved) {
        grid.append(h('article', { class: 'panel', onclick: () => A.go('#meeting/' + m.id), style: 'cursor:pointer' },
          h('div', { class: 'row' },
            h('h3', { class: 'grow', text: m.title }),
            h('span', { class: 'chip ' + (m.crmApplied ? 'ok' : 'warn'), text: m.crmApplied ? 'CRM applied' : 'CRM pending' })
          ),
          h('p', { class: 'muted small', text: when(m.when) + (m.mode ? ' · ' + m.mode : '') }),
          h('p', { class: 'small', text: (m.extract && m.extract.summary || '').slice(0, 160) + ((m.extract && m.extract.summary || '').length > 160 ? '…' : '') }),
          h('div', { class: 'row small muted' },
            h('span', { text: (m.extract && m.extract.actions || []).length + ' actions' }),
            h('span', { text: (m.flags || []).length + ' flags' }),
            h('span', { text: (m.turns || []).length + ' turns' })
          )
        ));
      }
      rootEl.append(grid);
    } else {
      rootEl.append(h('div', { class: 'empty panel' },
        h('div', { class: 'big', text: '🗒️' }),
        h('p', { text: 'No meetings yet. Start with a fictional demo below — full notes, citations and a CRM diff, offline.' })
      ));
    }

    rootEl.append(h('h2', { style: 'margin-top:22px', text: 'Demo meetings' }));
    rootEl.append(h('p', { class: 'muted small', text: 'Fictional people and .example domains. Deterministic extraction so the whole flow works with no API key.' }));
    const grid = h('div', { class: 'grid' });
    for (const d of demos) {
      grid.append(h('article', { class: 'panel' },
        h('div', { class: 'row' },
          h('h3', { class: 'grow', text: d.title }),
          h('span', { class: 'chip brand', text: d.kind.replace(/_/g, ' ') })
        ),
        h('p', { class: 'muted small', text: when(d.when) + ' · ' + Math.round(d.durationSec / 60) + ' min · ' + d.participants.join(', ') }),
        h('p', { class: 'small', text: d.summaryHint }),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn primary', disabled: !!A.running, onclick: (e) => { e.stopPropagation(); A.runDemo(d.id); } }, 'Run demo'),
          h('button', { type: 'button', class: 'btn', onclick: (e) => { e.stopPropagation(); A.go('#ingest'); sessionStorage.setItem('mm.play', d.id); } }, 'Simulate live')
        )
      ));
    }
    rootEl.append(grid);
  }

  (root.MM.app.views = root.MM.app.views || {}).meetings = { render };
})(self);
