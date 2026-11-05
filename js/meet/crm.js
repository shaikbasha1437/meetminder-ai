/* Local in-browser CRM: companies, contacts, deals, activities, tasks. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Meet = root.Meet || {}).crm = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const STAGES = ['lead', 'discovery', 'pilot', 'negotiation', 'won', 'lost', 'renewal', 'customer'];
  function uid(prefix) { return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function empty() {
    return { companies: [], contacts: [], deals: [], activities: [], tasks: [], version: 1 };
  }
  function findCompany(db, nameOrDomain) {
    const q = String(nameOrDomain || '').toLowerCase();
    return (db.companies || []).find((c) => c.name.toLowerCase() === q || (c.domain && c.domain.toLowerCase() === q)) || null;
  }
  function findContact(db, emailOrName) {
    const q = String(emailOrName || '').toLowerCase();
    return (db.contacts || []).find((c) => (c.email && c.email.toLowerCase() === q) || c.name.toLowerCase() === q) || null;
  }
  function findDeal(db, name) {
    const q = String(name || '').toLowerCase();
    return (db.deals || []).find((d) => d.name.toLowerCase() === q) || null;
  }
  function upsertCompany(db, patch) {
    if (!patch || !patch.name) return { db, company: null, created: false };
    let c = findCompany(db, patch.domain || patch.name);
    if (!c) {
      c = { id: uid('co'), name: patch.name, domain: patch.domain || '', stage: patch.stage || null, createdAt: Date.now(), updatedAt: Date.now() };
      db.companies.push(c);
      return { db, company: c, created: true };
    }
    Object.assign(c, { name: patch.name || c.name, domain: patch.domain || c.domain, stage: patch.stage != null ? patch.stage : c.stage, updatedAt: Date.now() });
    return { db, company: c, created: false };
  }
  function upsertContact(db, patch) {
    if (!patch || !patch.name) return { db, contact: null, created: false };
    let c = patch.email ? findContact(db, patch.email) : findContact(db, patch.name);
    if (!c) {
      c = { id: uid('ct'), name: patch.name, email: patch.email || '', title: patch.title || '', companyId: patch.companyId || null, note: patch.note || '', createdAt: Date.now(), updatedAt: Date.now() };
      db.contacts.push(c);
      return { db, contact: c, created: true };
    }
    Object.assign(c, {
      name: patch.name || c.name,
      email: patch.email || c.email,
      title: patch.title || c.title,
      companyId: patch.companyId || c.companyId,
      note: patch.note != null ? patch.note : c.note,
      updatedAt: Date.now()
    });
    return { db, contact: c, created: false };
  }
  function upsertDeal(db, patch) {
    if (!patch || !patch.name) return { db, deal: null, created: false };
    let d = findDeal(db, patch.name);
    if (!d) {
      d = { id: uid('deal'), name: patch.name, amount: Number(patch.amount) || 0, stage: patch.stage || 'discovery', companyId: patch.companyId || null, createdAt: Date.now(), updatedAt: Date.now() };
      db.deals.push(d);
      return { db, deal: d, created: true };
    }
    Object.assign(d, {
      amount: patch.amount != null ? Number(patch.amount) : d.amount,
      stage: patch.stage || d.stage,
      companyId: patch.companyId || d.companyId,
      updatedAt: Date.now()
    });
    return { db, deal: d, created: false };
  }
  function addActivity(db, act) {
    const a = Object.assign({ id: uid('act'), createdAt: Date.now() }, act);
    db.activities.unshift(a);
    return { db, activity: a };
  }
  function addTask(db, task) {
    const t = Object.assign({ id: uid('task'), status: 'open', createdAt: Date.now() }, task);
    db.tasks.unshift(t);
    return { db, task: t };
  }
  function seedDemo(db) {
    // Light seed so CRM is not empty before the first meeting.
    const a = upsertCompany(db, { name: 'Acme Corp', domain: 'acmecorp.example', stage: 'customer' });
    upsertContact(db, { name: 'Ava Chen', email: 'ava.chen@acmecorp.example', title: 'AE', companyId: a.company.id });
    upsertContact(db, { name: 'Maya Torres', email: 'maya.torres@acmecorp.example', title: 'CSM', companyId: a.company.id });
    upsertContact(db, { name: 'Sam Ortiz', email: 'sam.ortiz@acmecorp.example', title: 'Eng Manager', companyId: a.company.id });
    return db;
  }
  return { STAGES, empty, uid, findCompany, findContact, findDeal, upsertCompany, upsertContact, upsertDeal, addActivity, addTask, seedDemo };
});
