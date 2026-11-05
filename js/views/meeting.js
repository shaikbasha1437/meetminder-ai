/* Single meeting: transcript, notes, flags, follow-up draft, CRM changeset. */
(function (root) {
  'use strict';
  const { h, when, download, copy, toast, sheet } = root.MM.ui;

  function citeBtn(app, turnLookup, cite) {
    if (!cite) return null;
    return h('button', {
      type: 'button', class: 'cite', title: cite.quote || '',
      onclick: () => {
        const el = document.querySelector('[data-t="' + cite.t + '"]');
        if (el) { el.classList.add('hl'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.classList.remove('hl'), 1600); }
        else toast((cite.speaker ? cite.speaker + ': ' : '') + (cite.quote || '').slice(0, 180));
      }
    }, app.fmtTime(cite.t || 0));
  }

  function noteList(app, title, items, turns) {
    const wrap = h('div', { class: 'note-card' }, h('h3', { text: title }));
    if (!items || !items.length) { wrap.append(h('p', { class: 'muted small', text: 'None.' })); return wrap; }
    for (const it of items) {
      const row = h('div', { style: 'margin:8px 0;padding:8px 0;border-top:1px solid var(--line)' },
        h('div', { class: 'row' },
          h('span', { class: 'grow', text: it.text }),
          it.backed === false ? h('span', { class: 'chip stop', text: 'unbacked' }) : null,
          citeBtn(app, turns, it.cite)
        )
      );
      if (it.owner || it.due) row.append(h('div', { class: 'who', text: [it.owner ? 'Owner: ' + it.owner : '', it.due ? 'Due: ' + it.due : ''].filter(Boolean).join(' · ') }));
      wrap.append(row);
    }
    return wrap;
  }

  function render(rootEl, id) {
    const app = root.MM.app;
    const m = app.store.getMeeting(id);
    if (!m) {
      rootEl.append(h('div', { class: 'empty panel' }, h('p', { text: 'Meeting not found.' }), h('button', { type: 'button', class: 'btn', onclick: () => app.go('#meetings') }, 'Back')));
      return;
    }
    const ex = m.extract || {};

    rootEl.append(
      h('div', { class: 'toolbar' },
        h('button', { type: 'button', class: 'btn ghost', onclick: () => app.go('#meetings') }, '← Meetings'),
        h('div', { class: 'grow' },
          h('h1', { text: m.title }),
          h('p', { class: 'muted small', text: when(m.when) + ' · ' + (m.mode || '') + (m.model ? ' · ' + m.model : '') })
        ),
        h('button', { type: 'button', class: 'btn danger', onclick: () => app.deleteMeeting(m.id) }, 'Delete')
      )
    );

    if ((m.flags || []).length) {
      const box = h('div', { class: 'notice warn' }, h('strong', { text: m.flags.length + ' flag' + (m.flags.length === 1 ? '' : 's') + ': ' }));
      box.append(h('span', { text: m.flags.map((f) => f.message || f.type).join(' · ') }));
      rootEl.append(box);
    }

    const grid = h('div', { class: 'notes-grid' });

    // Left: summary + lists + follow-up
    const left = h('div');
    left.append(h('div', { class: 'panel', style: 'margin-bottom:14px' },
      h('h2', { text: 'Summary' }),
      h('p', { text: ex.summary || '—' }),
      ex.sentiment ? h('p', { class: 'small' }, h('span', { class: 'chip info', text: 'Sentiment: ' + (ex.sentiment.label || '') + (ex.sentiment.score != null ? ' (' + Math.round(ex.sentiment.score * 100) + '%)' : '') }), citeBtn(app, m.turns, ex.sentiment.cite)) : null
    ));
    left.append(noteList(app, 'Decisions', ex.decisions, m.turns));
    left.append(noteList(app, 'Action items', ex.actions, m.turns));
    left.append(noteList(app, 'Open questions', ex.questions, m.turns));
    left.append(noteList(app, 'Risks', ex.risks, m.turns));

    if (ex.followUp) {
      const fu = ex.followUp;
      left.append(h('div', { class: 'panel', style: 'margin-top:14px' },
        h('h2', { text: 'Follow-up email (draft only)' }),
        h('p', { class: 'small muted', text: 'MeetMinder never sends this. Copy it or open a mailto draft in your mail app.' }),
        h('div', { class: 'kv' },
          h('dt', { text: 'To' }), h('dd', { text: fu.to || '—' }),
          h('dt', { text: 'Subject' }), h('dd', { text: fu.subject || '—' })
        ),
        h('pre', { class: 'box', text: fu.body || '' }),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn primary', onclick: async () => { const ok = await copy('To: ' + (fu.to || '') + '\nSubject: ' + (fu.subject || '') + '\n\n' + (fu.body || '')); toast(ok ? 'Draft copied.' : 'Could not copy.'); } }, 'Copy draft'),
          h('a', { class: 'btn', href: 'mailto:' + encodeURIComponent(fu.to || '') + '?subject=' + encodeURIComponent(fu.subject || '') + '&body=' + encodeURIComponent(fu.body || ''), rel: 'noopener' }, 'Open in mail app')
        )
      ));
    }
    grid.append(left);

    // Right: transcript + CRM
    const right = h('div');
    right.append(h('div', { class: 'panel', style: 'margin-bottom:14px' },
      h('h2', { text: 'Transcript' }),
      h('div', { class: 'transcript' },
        ...(m.turns || []).map((t) => h('div', { class: 'turn', 'data-t': t.t },
          h('span', { class: 'tm', text: app.fmtTime(t.t) }),
          h('span', { class: 'sp', text: t.speaker }),
          h('span', { class: 'tx', text: t.text })
        ))
      )
    ));

    // CRM changeset
    const cs = m.crmChangeset || { fields: [], summary: 'No changes' };
    const crmPanel = h('div', { class: 'panel' },
      h('h2', { text: 'CRM changeset' }),
      h('p', { class: 'muted small', text: cs.summary + (m.crmApplied ? ' · Applied to local CRM.' : ' · Approve fields, then apply to the local CRM. HubSpot/Salesforce push needs the self-hosted server.') }),
      m.crmApplied ? h('span', { class: 'chip ok', text: 'CRM applied' }) : h('span', { class: 'chip warn', text: 'CRM pending' })
    );
    const approvals = {};
    (cs.fields || []).forEach((f) => { approvals[f.id] = f.approved !== false; });

    if (!(cs.fields || []).length) {
      crmPanel.append(h('p', { class: 'muted', text: 'Nothing to change.' }));
    } else {
      for (const f of cs.fields) {
        const row = h('label', { class: 'diff-row' + (approvals[f.id] ? '' : ' rejected') },
          h('input', {
            type: 'checkbox', checked: approvals[f.id],
            onchange: (e) => { approvals[f.id] = e.target.checked; f.approved = e.target.checked; row.classList.toggle('rejected', !e.target.checked); }
          }),
          h('div', {},
            h('div', { style: 'font-weight:650', text: f.label }),
            f.op === 'create'
              ? h('div', { class: 'after', text: 'New: ' + JSON.stringify(f.after) })
              : h('div', {},
                  h('div', { class: 'before', text: 'Before: ' + JSON.stringify(f.before) }),
                  h('div', { class: 'after', text: 'After: ' + JSON.stringify(f.after) })
                )
          )
        );
        crmPanel.append(row);
      }
      crmPanel.append(h('div', { class: 'actions' },
        h('button', {
          type: 'button', class: 'btn primary', disabled: !!m.crmApplied,
          onclick: () => app.applyCrm(m.id, approvals)
        }, m.crmApplied ? 'Already applied' : 'Apply approved to local CRM'),
        h('button', { type: 'button', class: 'btn', onclick: () => download('meetminder-crm-' + m.id + '.json', root.Meet.crmdiff.exportJson(cs), 'application/json') }, 'Export JSON'),
        h('button', { type: 'button', class: 'btn', onclick: () => download('meetminder-crm-' + m.id + '.csv', root.Meet.crmdiff.exportCsv(cs), 'text/csv') }, 'Export CSV'),
        h('button', { type: 'button', class: 'btn', onclick: () => showConnectorPayloads(m, cs) }, 'HubSpot / Salesforce payloads')
      ));
    }
    right.append(crmPanel);
    grid.append(right);
    rootEl.append(grid);
  }

  function showConnectorPayloads(m, cs) {
    const hs = root.Meet.adapters.hubspotFromChangeset(cs);
    const sf = root.Meet.adapters.salesforceFromChangeset(cs);
    sheet({
      id: 'connectors', title: 'Connector payloads (not sent)',
      wide: true,
      body: (b) => {
        b.append(h('p', { class: 'notice warn', text: 'These are the exact API bodies. The browser never pushes them. Use the self-hosted server with your own token, or copy a curl. Only tested against mock servers.' }));
        b.append(h('h3', { text: 'HubSpot' }));
        b.append(h('pre', { class: 'box', text: hs.length ? JSON.stringify(hs, null, 2) : 'No HubSpot ops for the approved fields.' }));
        if (hs[0]) b.append(h('pre', { class: 'box', text: root.Meet.adapters.toCurl(hs[0]) }));
        b.append(h('h3', { text: 'Salesforce' }));
        b.append(h('pre', { class: 'box', text: sf.length ? JSON.stringify(sf, null, 2) : 'No Salesforce ops for the approved fields.' }));
        if (sf[0]) b.append(h('pre', { class: 'box', text: root.Meet.adapters.toCurl(sf[0]) }));
      }
    });
  }

  (root.MM.app.views = root.MM.app.views || {}).meeting = { render };
})(self);
