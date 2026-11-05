/* HubSpot and Salesforce payload builders. These produce the exact API body shapes; the browser
   never pushes them. The self-hosted /server proxies the push with the user's own token, or the
   UI shows a ready-to-run curl. Tested only against mock servers. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.Meet = root.Meet || {}).adapters = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const HS_DEAL_STAGE = {
    lead: 'appointmentscheduled',
    discovery: 'qualifiedtobuy',
    pilot: 'presentationscheduled',
    negotiation: 'decisionmakerboughtin',
    won: 'closedwon',
    lost: 'closedlost',
    renewal: 'qualifiedtobuy',
    customer: 'closedwon'
  };

  function hubspotFromChangeset(changeset) {
    const ops = [];
    for (const f of (changeset.fields || []).filter((x) => x.approved)) {
      if (f.meta.kind === 'company' && f.op === 'create') {
        ops.push({
          connector: 'hubspot',
          method: 'POST',
          path: '/crm/v3/objects/companies',
          body: { properties: { name: f.after.name, domain: f.after.domain || undefined } }
        });
      } else if (f.meta.kind === 'contact' && f.op === 'create') {
        const [first, ...rest] = String(f.after.name || '').split(/\s+/);
        ops.push({
          connector: 'hubspot',
          method: 'POST',
          path: '/crm/v3/objects/contacts',
          body: { properties: { firstname: first || f.after.name, lastname: rest.join(' ') || undefined, email: f.after.email || undefined, jobtitle: f.after.title || undefined } }
        });
      } else if (f.meta.kind === 'deal' && f.op === 'create') {
        ops.push({
          connector: 'hubspot',
          method: 'POST',
          path: '/crm/v3/objects/deals',
          body: { properties: { dealname: f.after.name, amount: String(f.after.amount || 0), dealstage: HS_DEAL_STAGE[f.after.stage] || 'qualifiedtobuy' } }
        });
      } else if (f.meta.kind === 'deal' && f.op === 'update' && f.path.endsWith('.stage')) {
        ops.push({
          connector: 'hubspot',
          method: 'PATCH',
          path: '/crm/v3/objects/deals/' + encodeURIComponent(f.meta.dealId),
          body: { properties: { dealstage: HS_DEAL_STAGE[f.after] || f.after } },
          note: 'Replace dealId with the HubSpot deal id; local ids are not HubSpot ids.'
        });
      } else if (f.meta.kind === 'task' && f.op === 'create') {
        ops.push({
          connector: 'hubspot',
          method: 'POST',
          path: '/crm/v3/objects/tasks',
          body: { properties: { hs_task_subject: f.after.title, hs_task_status: 'NOT_STARTED', hs_task_type: 'TODO', hs_timestamp: f.after.due ? new Date(f.after.due + 'T17:00:00').getTime() : Date.now() } }
        });
      } else if (f.meta.kind === 'activity' && f.op === 'create') {
        ops.push({
          connector: 'hubspot',
          method: 'POST',
          path: '/crm/v3/objects/meetings',
          body: { properties: { hs_meeting_title: f.after.subject, hs_meeting_body: f.after.subject, hs_timestamp: Date.now() } }
        });
      }
    }
    return ops;
  }

  function salesforceFromChangeset(changeset) {
    const ops = [];
    for (const f of (changeset.fields || []).filter((x) => x.approved)) {
      if (f.meta.kind === 'company' && f.op === 'create') {
        ops.push({ connector: 'salesforce', method: 'POST', path: '/services/data/v59.0/sobjects/Account', body: { Name: f.after.name, Website: f.after.domain ? 'https://' + f.after.domain : undefined } });
      } else if (f.meta.kind === 'contact' && f.op === 'create') {
        const [first, ...rest] = String(f.after.name || '').split(/\s+/);
        ops.push({ connector: 'salesforce', method: 'POST', path: '/services/data/v59.0/sobjects/Contact', body: { FirstName: first || undefined, LastName: rest.join(' ') || f.after.name, Email: f.after.email || undefined, Title: f.after.title || undefined } });
      } else if (f.meta.kind === 'deal' && f.op === 'create') {
        ops.push({ connector: 'salesforce', method: 'POST', path: '/services/data/v59.0/sobjects/Opportunity', body: { Name: f.after.name, Amount: Number(f.after.amount) || 0, StageName: mapSfStage(f.after.stage), CloseDate: closeDate() } });
      } else if (f.meta.kind === 'deal' && f.op === 'update' && f.path.endsWith('.stage')) {
        ops.push({ connector: 'salesforce', method: 'PATCH', path: '/services/data/v59.0/sobjects/Opportunity/' + encodeURIComponent(f.meta.dealId), body: { StageName: mapSfStage(f.after) }, note: 'Replace id with the Salesforce Opportunity Id.' });
      } else if (f.meta.kind === 'task' && f.op === 'create') {
        ops.push({ connector: 'salesforce', method: 'POST', path: '/services/data/v59.0/sobjects/Task', body: { Subject: f.after.title, Status: 'Not Started', ActivityDate: f.after.due || undefined } });
      } else if (f.meta.kind === 'activity' && f.op === 'create') {
        ops.push({ connector: 'salesforce', method: 'POST', path: '/services/data/v59.0/sobjects/Event', body: { Subject: f.after.subject, DurationInMinutes: 30, ActivityDateTime: new Date().toISOString() } });
      }
    }
    return ops;
  }

  function mapSfStage(s) {
    return ({ lead: 'Prospecting', discovery: 'Qualification', pilot: 'Proposal/Price Quote', negotiation: 'Negotiation/Review', won: 'Closed Won', lost: 'Closed Lost', renewal: 'Negotiation/Review', customer: 'Closed Won' })[s] || 'Qualification';
  }
  function closeDate() {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }

  function toCurl(op, opts) {
    const o = opts || {};
    const base = o.baseUrl || (op.connector === 'hubspot' ? 'https://api.hubapi.com' : 'https://YOUR_INSTANCE.my.salesforce.com');
    const auth = op.connector === 'hubspot'
      ? '-H "Authorization: Bearer $HUBSPOT_TOKEN"'
      : '-H "Authorization: Bearer $SALESFORCE_TOKEN"';
    return 'curl -sS -X ' + op.method + ' ' + auth + ' -H "Content-Type: application/json" \\\n  ' + JSON.stringify(base + op.path) + ' \\\n  -d ' + JSON.stringify(JSON.stringify(op.body));
  }

  return { hubspotFromChangeset, salesforceFromChangeset, toCurl, HS_DEAL_STAGE, mapSfStage };
});
