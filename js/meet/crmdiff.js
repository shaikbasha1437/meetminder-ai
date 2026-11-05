/* Build a per-field CRM changeset the user can approve or reject before applying. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./crm'));
  else (root.Meet = root.Meet || {}).crmdiff = factory(root.Meet.crm);
})(typeof self !== 'undefined' ? self : this, function (crm) {
  'use strict';

  function field(path, op, before, after, label, meta) {
    return { id: path, path, op, before: before == null ? null : before, after: after == null ? null : after, label: label || path, approved: true, meta: meta || {} };
  }

  function propose(db, proposal, meetingMeta) {
    const fields = [];
    const meta = meetingMeta || {};
    if (!proposal) return { fields, summary: 'No CRM changes proposed.' };

    if (proposal.companyUpsert && proposal.companyUpsert.name) {
      const existing = crm.findCompany(db, proposal.companyUpsert.domain || proposal.companyUpsert.name);
      if (!existing) {
        fields.push(field('company.create.' + proposal.companyUpsert.name, 'create', null, proposal.companyUpsert, 'Create company ' + proposal.companyUpsert.name, { kind: 'company' }));
      } else {
        for (const k of ['domain', 'stage']) {
          if (proposal.companyUpsert[k] != null && proposal.companyUpsert[k] !== existing[k]) {
            fields.push(field('company.' + existing.id + '.' + k, 'update', existing[k], proposal.companyUpsert[k], 'Company ' + existing.name + ' · ' + k, { kind: 'company', companyId: existing.id }));
          }
        }
      }
    }

    for (const c of proposal.contactsUpsert || []) {
      const existing = c.email ? crm.findContact(db, c.email) : crm.findContact(db, c.name);
      if (!existing) {
        fields.push(field('contact.create.' + (c.email || c.name), 'create', null, c, 'Create contact ' + c.name, { kind: 'contact' }));
      } else {
        for (const k of ['title', 'email', 'note']) {
          if (c[k] != null && c[k] !== existing[k] && c[k] !== '') {
            fields.push(field('contact.' + existing.id + '.' + k, 'update', existing[k], c[k], 'Contact ' + existing.name + ' · ' + k, { kind: 'contact', contactId: existing.id }));
          }
        }
      }
    }

    if (proposal.dealUpsert && proposal.dealUpsert.name) {
      const existing = crm.findDeal(db, proposal.dealUpsert.name);
      if (!existing) {
        fields.push(field('deal.create.' + proposal.dealUpsert.name, 'create', null, proposal.dealUpsert, 'Create deal ' + proposal.dealUpsert.name, { kind: 'deal' }));
      } else {
        for (const k of ['amount', 'stage']) {
          if (proposal.dealUpsert[k] != null && String(proposal.dealUpsert[k]) !== String(existing[k])) {
            fields.push(field('deal.' + existing.id + '.' + k, 'update', existing[k], proposal.dealUpsert[k], 'Deal ' + existing.name + ' · ' + k, { kind: 'deal', dealId: existing.id }));
          }
        }
      }
    }

    for (const t of proposal.tasks || []) {
      fields.push(field('task.create.' + t.title, 'create', null, t, 'Add task: ' + t.title, { kind: 'task' }));
    }

    if (proposal.activity) {
      fields.push(field('activity.create.' + (proposal.activity.subject || 'meeting'), 'create', null, Object.assign({}, proposal.activity, { meetingId: meta.meetingId, when: meta.when }), 'Log meeting activity', { kind: 'activity' }));
    }

    const summary = fields.length
      ? fields.length + ' change' + (fields.length === 1 ? '' : 's') + ' proposed'
      : 'No CRM changes needed (everything already matches).';
    return { fields, summary, proposal };
  }

  function apply(db, changeset) {
    const applied = [];
    const snapshot = JSON.parse(JSON.stringify(db));
    let companyIdByName = {};
    for (const f of (changeset.fields || []).filter((x) => x.approved)) {
      if (f.meta.kind === 'company' && f.op === 'create') {
        const r = crm.upsertCompany(db, f.after);
        companyIdByName[f.after.name] = r.company.id;
        applied.push(f.id);
      } else if (f.meta.kind === 'company' && f.op === 'update') {
        const c = (db.companies || []).find((x) => x.id === f.meta.companyId);
        if (c) { c[f.path.split('.').pop()] = f.after; c.updatedAt = Date.now(); applied.push(f.id); }
      } else if (f.meta.kind === 'contact' && f.op === 'create') {
        let companyId = f.after.companyId;
        if (!companyId && f.after.company && companyIdByName[f.after.company]) companyId = companyIdByName[f.after.company];
        crm.upsertContact(db, Object.assign({}, f.after, { companyId }));
        applied.push(f.id);
      } else if (f.meta.kind === 'contact' && f.op === 'update') {
        const c = (db.contacts || []).find((x) => x.id === f.meta.contactId);
        if (c) { c[f.path.split('.').pop()] = f.after; c.updatedAt = Date.now(); applied.push(f.id); }
      } else if (f.meta.kind === 'deal' && f.op === 'create') {
        let companyId = f.after.companyId;
        if (!companyId && f.after.company) {
          const co = crm.findCompany(db, f.after.company) || (companyIdByName[f.after.company] ? { id: companyIdByName[f.after.company] } : null);
          if (co) companyId = co.id;
        }
        crm.upsertDeal(db, Object.assign({}, f.after, { companyId }));
        applied.push(f.id);
      } else if (f.meta.kind === 'deal' && f.op === 'update') {
        const d = (db.deals || []).find((x) => x.id === f.meta.dealId);
        if (d) { d[f.path.split('.').pop()] = f.after; d.updatedAt = Date.now(); applied.push(f.id); }
      } else if (f.meta.kind === 'task' && f.op === 'create') {
        crm.addTask(db, f.after);
        applied.push(f.id);
      } else if (f.meta.kind === 'activity' && f.op === 'create') {
        crm.addActivity(db, f.after);
        applied.push(f.id);
      }
    }
    return { db, applied, snapshot };
  }

  function exportJson(changeset) {
    return JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), fields: (changeset.fields || []).filter((f) => f.approved) }, null, 2);
  }
  function exportCsv(changeset) {
    const rows = [['id', 'op', 'label', 'before', 'after']];
    for (const f of (changeset.fields || []).filter((x) => x.approved)) {
      rows.push([f.id, f.op, f.label, JSON.stringify(f.before), JSON.stringify(f.after)]);
    }
    return rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  }

  return { propose, apply, exportJson, exportCsv, field };
});
