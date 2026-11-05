/* Local CRM browser. */
(function (root) {
  'use strict';
  const { h, toast, download } = root.MM.ui;

  function render(rootEl) {
    const app = root.MM.app;
    const db = app.store.getCrm();

    rootEl.append(
      h('div', { class: 'toolbar' },
        h('div', { class: 'grow' }, h('h1', { text: 'Local CRM' }), h('p', { class: 'muted small', text: 'Contacts, companies, deals, tasks and activities stored in this browser. Apply changesets from meeting notes; export anytime. HubSpot/Salesforce push needs the self-hosted server.' })),
        h('button', { type: 'button', class: 'btn', onclick: () => download('meetminder-crm.json', JSON.stringify(db, null, 2), 'application/json') }, 'Export CRM JSON')
      )
    );

    const kpis = h('div', { class: 'kpis' },
      h('div', { class: 'kpi' }, h('div', { class: 'v', text: String(db.companies.length) }), h('div', { class: 'k', text: 'Companies' })),
      h('div', { class: 'kpi' }, h('div', { class: 'v', text: String(db.contacts.length) }), h('div', { class: 'k', text: 'Contacts' })),
      h('div', { class: 'kpi' }, h('div', { class: 'v', text: String(db.deals.length) }), h('div', { class: 'k', text: 'Deals' })),
      h('div', { class: 'kpi' }, h('div', { class: 'v', text: String(db.tasks.filter((t) => t.status === 'open').length) }), h('div', { class: 'k', text: 'Open tasks' }))
    );
    rootEl.append(kpis);

    function table(title, cols, rows) {
      const panel = h('div', { class: 'panel', style: 'margin-bottom:14px;overflow:auto' }, h('h2', { text: title }));
      if (!rows.length) { panel.append(h('p', { class: 'muted', text: 'None yet.' })); return panel; }
      const t = h('table', { class: 't' }, h('thead', {}, h('tr', {}, ...cols.map((c) => h('th', { text: c })))));
      const tb = h('tbody');
      for (const r of rows) tb.append(h('tr', {}, ...r.map((c) => h('td', { text: c == null ? '—' : String(c) }))));
      t.append(tb); panel.append(t); return panel;
    }

    rootEl.append(table('Companies', ['Name', 'Domain', 'Stage'], db.companies.map((c) => [c.name, c.domain, c.stage])));
    rootEl.append(table('Contacts', ['Name', 'Email', 'Title', 'Note'], db.contacts.map((c) => [c.name, c.email, c.title, c.note])));
    rootEl.append(table('Deals', ['Name', 'Amount', 'Stage'], db.deals.map((d) => [d.name, d.amount, d.stage])));
    rootEl.append(table('Tasks', ['Title', 'Owner', 'Due', 'Status'], db.tasks.map((t) => [t.title, t.owner, t.due, t.status])));
    rootEl.append(table('Activities', ['Type', 'Subject', 'When'], db.activities.slice(0, 40).map((a) => [a.type, a.subject, a.when || a.createdAt])));

    rootEl.append(h('div', { class: 'actions' },
      h('button', {
        type: 'button', class: 'btn danger',
        onclick: async () => {
          const ok = await app.ask({ title: 'Reset local CRM?', text: 'This clears companies, contacts, deals, tasks and activities in this browser, then re-seeds Acme Corp. Undo is not available after reload.', ok: 'Reset', danger: true });
          if (!ok) return;
          app.store.setCrm(root.Meet.crm.seedDemo(root.Meet.crm.empty()));
          toast('Local CRM reset.');
          app.refresh();
        }
      }, 'Reset local CRM')
    ));
  }

  (root.MM.app.views = root.MM.app.views || {}).crm = { render };
})(self);
