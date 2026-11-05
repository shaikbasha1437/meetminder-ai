/* Five fictional demo meetings. People and companies use .example domains. Each has a transcript
   with timed speaker turns plus a deterministic expected extract used by demo mode. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.MeetData = factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function T(sec, speaker, text) { return { t: sec, speaker, text }; }

  const MEETINGS = [
    {
      id: 'demo-discovery',
      title: 'Sales discovery · Northwind Analytics',
      kind: 'sales_discovery',
      when: '2026-10-28T15:00:00-05:00',
      durationSec: 1260,
      participants: [
        { name: 'Ava Chen', role: 'AE', email: 'ava.chen@acmecorp.example', company: 'Acme Corp' },
        { name: 'Jordan Lee', role: 'VP Ops', email: 'jordan.lee@northwind.example', company: 'Northwind Analytics' },
        { name: 'Priya Shah', role: 'RevOps Manager', email: 'priya.shah@northwind.example', company: 'Northwind Analytics' }
      ],
      company: { name: 'Northwind Analytics', domain: 'northwind.example', stage: 'discovery' },
      deal: { name: 'Northwind · Analytics Platform', amount: 48000, stage: 'discovery' },
      tags: ['inbound', 'mid-market'],
      summaryHint: 'Discovery call covering current BI stack pain, success criteria and next steps toward a pilot.',
      transcript: [
        T(12, 'Ava Chen', 'Thanks for joining, Jordan and Priya. I am Ava from Acme Corp. Before we dive in, just a quick note that I am recording this call for notes, with your okay.'),
        T(28, 'Jordan Lee', 'That is fine with us. We are looking at replacing our patchwork of Looker dashboards and spreadsheet exports.'),
        T(48, 'Priya Shah', 'Right. Our sales ops team spends about twelve hours a week stitching forecasts together by hand.'),
        T(68, 'Ava Chen', 'Got it. What does a successful first quarter look like if you pick a new platform?'),
        T(84, 'Jordan Lee', 'We need one source of truth for pipeline, and forecasts that land within five percent of actuals.'),
        T(108, 'Priya Shah', 'Also role-based access. Right now everyone sees every account, which is a compliance risk for us.'),
        T(132, 'Ava Chen', 'We can do row-level security out of the box. Budget range for this year?'),
        T(148, 'Jordan Lee', 'We have sixty thousand approved for tooling. Decision by end of November if the pilot goes well.'),
        T(172, 'Priya Shah', 'We would want a two-week pilot on our sandbox with our CRM data.'),
        T(196, 'Ava Chen', 'Perfect. I can send a pilot plan by Friday. Who else needs to sign off?'),
        T(214, 'Jordan Lee', 'Our CFO, Morgan Ellis, for anything over forty thousand. I will introduce you after the pilot kicks off.'),
        T(242, 'Ava Chen', 'Any blockers I should know about?'),
        T(254, 'Priya Shah', 'Our CRM admin is out until next Wednesday, so we cannot grant API access before then.'),
        T(278, 'Ava Chen', 'Understood. I will schedule the technical kickoff for Thursday the sixth at ten AM Central.'),
        T(302, 'Jordan Lee', 'Works for me. Looking forward to it.'),
        T(318, 'Ava Chen', 'Great. I will send a follow-up with the summary, pilot plan outline and calendar invite. Thanks again.')
      ],
      extract: {
        summary: 'Acme Corp discovery with Northwind Analytics about replacing Looker plus spreadsheet forecasts. Success means one pipeline source of truth, forecasts within five percent of actuals, and role-based access. Budget about sixty thousand; CFO Morgan Ellis signs over forty thousand. Pilot planned after CRM admin returns next Wednesday; technical kickoff Thursday Nov 6 at ten AM Central.',
        decisions: [
          { text: 'Proceed to a two-week sandbox pilot using Northwind CRM data.', cite: { t: 172, quote: 'We would want a two-week pilot on our sandbox with our CRM data.' } },
          { text: 'Technical kickoff scheduled for Thursday Nov 6 at ten AM Central.', cite: { t: 278, quote: 'I will schedule the technical kickoff for Thursday the sixth at ten AM Central.' } }
        ],
        actions: [
          { text: 'Send pilot plan outline', owner: 'Ava Chen', due: '2026-10-31', cite: { t: 196, quote: 'I can send a pilot plan by Friday.' } },
          { text: 'Introduce Ava to CFO Morgan Ellis after pilot starts', owner: 'Jordan Lee', due: null, cite: { t: 214, quote: 'I will introduce you after the pilot kicks off.' } },
          { text: 'Grant CRM API access once admin returns', owner: 'Priya Shah', due: '2026-11-05', cite: { t: 254, quote: 'Our CRM admin is out until next Wednesday, so we cannot grant API access before then.' } },
          { text: 'Send follow-up with summary, pilot outline and calendar invite', owner: 'Ava Chen', due: '2026-10-29', cite: { t: 318, quote: 'I will send a follow-up with the summary, pilot plan outline and calendar invite.' } }
        ],
        questions: [
          { text: 'Who else besides Morgan Ellis needs to approve the purchase?', cite: { t: 196, quote: 'Who else needs to sign off?' } }
        ],
        risks: [
          { text: 'CRM API access blocked until admin returns next Wednesday.', cite: { t: 254, quote: 'Our CRM admin is out until next Wednesday, so we cannot grant API access before then.' } },
          { text: 'Current open access to every account is a compliance risk.', cite: { t: 108, quote: 'Right now everyone sees every account, which is a compliance risk for us.' } }
        ],
        sentiment: { score: 0.72, label: 'positive', cite: { t: 302, quote: 'Works for me. Looking forward to it.' } },
        followUp: {
          to: 'jordan.lee@northwind.example, priya.shah@northwind.example',
          subject: 'Northwind discovery follow-up · pilot plan and Nov 6 kickoff',
          body: 'Hi Jordan and Priya,\n\nThanks for the discovery call today. Capturing what I heard:\n\n• Goal: one source of truth for pipeline; forecasts within five percent of actuals; role-based access.\n• Budget: about sixty thousand this year; Morgan Ellis (CFO) signs over forty thousand.\n• Next: two-week sandbox pilot once CRM API access is available (admin back next Wednesday).\n• Kickoff: Thursday Nov 6, ten AM Central.\n\nI will send the pilot plan outline by Friday and a calendar invite shortly.\n\nBest,\nAva'
        },
        crm: {
          companyUpsert: { name: 'Northwind Analytics', domain: 'northwind.example' },
          contactsUpsert: [
            { name: 'Jordan Lee', email: 'jordan.lee@northwind.example', title: 'VP Ops' },
            { name: 'Priya Shah', email: 'priya.shah@northwind.example', title: 'RevOps Manager' },
            { name: 'Morgan Ellis', email: null, title: 'CFO', note: 'Approver over $40k; intro after pilot starts' }
          ],
          dealUpsert: { name: 'Northwind · Analytics Platform', amount: 48000, stage: 'pilot', company: 'Northwind Analytics' },
          tasks: [
            { title: 'Send pilot plan outline', owner: 'Ava Chen', due: '2026-10-31' },
            { title: 'Schedule Nov 6 technical kickoff', owner: 'Ava Chen', due: '2026-10-29' }
          ],
          activity: { type: 'meeting', subject: 'Sales discovery · Northwind Analytics' }
        }
      }
    },
    {
      id: 'demo-standup',
      title: 'Engineering standup · Platform team',
      kind: 'standup',
      when: '2026-11-03T09:15:00-06:00',
      durationSec: 540,
      participants: [
        { name: 'Sam Ortiz', role: 'Eng Manager', email: 'sam.ortiz@acmecorp.example', company: 'Acme Corp' },
        { name: 'Riley Kim', role: 'Backend', email: 'riley.kim@acmecorp.example', company: 'Acme Corp' },
        { name: 'Casey Brooks', role: 'Frontend', email: 'casey.brooks@acmecorp.example', company: 'Acme Corp' },
        { name: 'Devon Ng', role: 'SRE', email: 'devon.ng@acmecorp.example', company: 'Acme Corp' }
      ],
      company: { name: 'Acme Corp', domain: 'acmecorp.example', stage: null },
      deal: null,
      tags: ['internal'],
      summaryHint: 'Daily standup covering auth migration, dashboard latency and a Sev-3 on webhooks.',
      transcript: [
        T(5, 'Sam Ortiz', 'Morning all. Quick round. Riley, you first.'),
        T(14, 'Riley Kim', 'Auth migration is at eighty percent. Blocked on the Redis failover runbook review from Devon.'),
        T(32, 'Devon Ng', 'I can review that today before lunch. Also, Sev-3 on webhook retries overnight; error rate peaked at four percent and is back under one.'),
        T(58, 'Casey Brooks', 'Dashboard p95 latency is still around nine hundred milliseconds. I will ship the query cache patch this afternoon.'),
        T(82, 'Sam Ortiz', 'Casey, can you pair with Riley on the auth UI flags after that? We want the beta toggle live by Thursday.'),
        T(104, 'Casey Brooks', 'Yes. I will open a PR by end of day tomorrow.'),
        T(118, 'Sam Ortiz', 'Devon, please post the Sev-3 write-up in the incidents channel by EOD. Anything else?'),
        T(136, 'Riley Kim', 'Need a decision on whether we keep the legacy JWT path through December.'),
        T(152, 'Sam Ortiz', 'Keep it through December fifteenth, then remove. I will confirm with product today.'),
        T(172, 'Sam Ortiz', 'Okay, that is it. Thanks everyone.')
      ],
      extract: {
        summary: 'Platform standup: auth migration at eighty percent blocked on Redis failover runbook review; Sev-3 webhook retries recovered; dashboard p95 around nine hundred milliseconds with cache patch due today; beta auth UI toggle targeted for Thursday; legacy JWT kept through Dec 15.',
        decisions: [
          { text: 'Keep legacy JWT path through December 15, then remove.', cite: { t: 152, quote: 'Keep it through December fifteenth, then remove.' } }
        ],
        actions: [
          { text: 'Review Redis failover runbook before lunch', owner: 'Devon Ng', due: '2026-11-03', cite: { t: 32, quote: 'I can review that today before lunch.' } },
          { text: 'Ship dashboard query cache patch', owner: 'Casey Brooks', due: '2026-11-03', cite: { t: 58, quote: 'I will ship the query cache patch this afternoon.' } },
          { text: 'Open auth UI flags PR', owner: 'Casey Brooks', due: '2026-11-04', cite: { t: 104, quote: 'I will open a PR by end of day tomorrow.' } },
          { text: 'Post Sev-3 write-up in incidents channel', owner: 'Devon Ng', due: '2026-11-03', cite: { t: 118, quote: 'please post the Sev-3 write-up in the incidents channel by EOD.' } },
          { text: 'Confirm legacy JWT sunset date with product', owner: 'Sam Ortiz', due: '2026-11-03', cite: { t: 152, quote: 'I will confirm with product today.' } }
        ],
        questions: [
          { text: 'Should the legacy JWT path stay through December?', cite: { t: 136, quote: 'Need a decision on whether we keep the legacy JWT path through December.' } }
        ],
        risks: [
          { text: 'Auth migration blocked on Redis failover runbook review.', cite: { t: 14, quote: 'Blocked on the Redis failover runbook review from Devon.' } },
          { text: 'Overnight Sev-3 on webhook retries (peak 4% errors).', cite: { t: 32, quote: 'Sev-3 on webhook retries overnight; error rate peaked at four percent' } }
        ],
        sentiment: { score: 0.55, label: 'neutral', cite: { t: 172, quote: 'Okay, that is it. Thanks everyone.' } },
        followUp: {
          to: 'sam.ortiz@acmecorp.example',
          subject: 'Standup notes · Nov 3 Platform team',
          body: 'Team,\n\nNotes from standup:\n\n• Auth migration 80%; Devon reviews Redis failover runbook before lunch.\n• Sev-3 webhook retries recovered (back under one percent); write-up due EOD from Devon.\n• Casey ships query cache patch today; auth UI flags PR by tomorrow EOD; beta toggle Thursday.\n• Decision: keep legacy JWT through Dec 15; Sam confirms with product today.\n\n— MeetMinder'
        },
        crm: {
          companyUpsert: null,
          contactsUpsert: [],
          dealUpsert: null,
          tasks: [
            { title: 'Review Redis failover runbook', owner: 'Devon Ng', due: '2026-11-03' },
            { title: 'Post Sev-3 write-up', owner: 'Devon Ng', due: '2026-11-03' },
            { title: 'Confirm JWT sunset with product', owner: 'Sam Ortiz', due: '2026-11-03' }
          ],
          activity: { type: 'meeting', subject: 'Engineering standup · Platform team' }
        }
      }
    },
    {
      id: 'demo-qbr',
      title: 'Customer QBR · Globex Retail',
      kind: 'qbr',
      when: '2026-10-21T13:00:00-05:00',
      durationSec: 1800,
      participants: [
        { name: 'Maya Torres', role: 'CSM', email: 'maya.torres@acmecorp.example', company: 'Acme Corp' },
        { name: 'Chris Patel', role: 'Director Digital', email: 'chris.patel@globex.example', company: 'Globex Retail' },
        { name: 'Elena Ruiz', role: 'IT Lead', email: 'elena.ruiz@globex.example', company: 'Globex Retail' }
      ],
      company: { name: 'Globex Retail', domain: 'globex.example', stage: 'customer' },
      deal: { name: 'Globex · Renewal FY27', amount: 120000, stage: 'renewal' },
      tags: ['customer', 'qbr'],
      summaryHint: 'Quarterly business review covering adoption, open support themes and renewal intent.',
      transcript: [
        T(20, 'Maya Torres', 'Welcome to the Q3 QBR. Recording with your consent so we can share notes afterward.'),
        T(38, 'Chris Patel', 'Sounds good. Overall we are happy. Weekly active users are up thirty-two percent since June.'),
        T(62, 'Elena Ruiz', 'The SSO rollout finished in September. Remaining gap is SCIM provisioning; we still create users by hand.'),
        T(92, 'Maya Torres', 'We can prioritize SCIM in the Q4 roadmap. Target for a beta would be early December if that helps.'),
        T(118, 'Chris Patel', 'That would help. For renewal, we want to expand seats from two hundred to three hundred if SCIM lands.'),
        T(148, 'Maya Torres', 'Noted. Any support themes we should watch?'),
        T(160, 'Elena Ruiz', 'Export timeouts on the inventory report above fifty thousand rows. Ticket GLOB-441 is still open.'),
        T(188, 'Maya Torres', 'I will escalate GLOB-441 to engineering today and give you an ETA by Friday.'),
        T(212, 'Chris Patel', 'We also need a success plan for the holiday peak. Black Friday traffic last year nearly doubled.'),
        T(240, 'Maya Torres', 'I will draft a holiday readiness checklist and review it with Elena next week.'),
        T(266, 'Chris Patel', 'Assuming SCIM and the export fix land, we are a yes on the three-year renewal at the quoted one hundred twenty thousand.'),
        T(298, 'Maya Torres', 'Fantastic. I will send the renewal redlines and the success plan draft by next Wednesday.')
      ],
      extract: {
        summary: 'Globex Retail Q3 QBR: WAU up thirty-two percent since June; SSO done, SCIM still missing. Expansion to three hundred seats tied to SCIM; open ticket GLOB-441 on large inventory exports; holiday readiness plan requested. Conditional yes on three-year renewal at one hundred twenty thousand.',
        decisions: [
          { text: 'Prioritize SCIM beta targeting early December.', cite: { t: 92, quote: 'Target for a beta would be early December if that helps.' } },
          { text: 'Proceed toward 3-year renewal at $120k if SCIM and export fix land.', cite: { t: 266, quote: 'we are a yes on the three-year renewal at the quoted one hundred twenty thousand.' } }
        ],
        actions: [
          { text: 'Escalate ticket GLOB-441 and share ETA', owner: 'Maya Torres', due: '2026-10-24', cite: { t: 188, quote: 'I will escalate GLOB-441 to engineering today and give you an ETA by Friday.' } },
          { text: 'Draft holiday readiness checklist and review with Elena', owner: 'Maya Torres', due: '2026-10-28', cite: { t: 240, quote: 'I will draft a holiday readiness checklist and review it with Elena next week.' } },
          { text: 'Send renewal redlines and success plan draft', owner: 'Maya Torres', due: '2026-10-28', cite: { t: 298, quote: 'I will send the renewal redlines and the success plan draft by next Wednesday.' } }
        ],
        questions: [],
        risks: [
          { text: 'SCIM provisioning still manual; blocks seat expansion.', cite: { t: 62, quote: 'Remaining gap is SCIM provisioning; we still create users by hand.' } },
          { text: 'Inventory export timeouts above 50k rows (GLOB-441).', cite: { t: 160, quote: 'Export timeouts on the inventory report above fifty thousand rows.' } },
          { text: 'Holiday peak traffic nearly doubled last Black Friday.', cite: { t: 212, quote: 'Black Friday traffic last year nearly doubled.' } }
        ],
        sentiment: { score: 0.8, label: 'positive', cite: { t: 38, quote: 'Overall we are happy. Weekly active users are up thirty-two percent since June.' } },
        followUp: {
          to: 'chris.patel@globex.example, elena.ruiz@globex.example',
          subject: 'Globex Q3 QBR notes · SCIM, GLOB-441 and renewal',
          body: 'Hi Chris and Elena,\n\nThanks for a productive QBR. Highlights:\n\n• Adoption: WAU up thirty-two percent since June; SSO complete.\n• Ask: SCIM beta targeted for early December; seat expansion two hundred to three hundred contingent on SCIM.\n• Support: escalating GLOB-441 (export timeouts above fifty thousand rows); ETA by Friday.\n• Holiday: readiness checklist draft next week with Elena.\n• Commercial: conditional yes on three-year renewal at one hundred twenty thousand; redlines + success plan by next Wednesday.\n\nBest,\nMaya'
        },
        crm: {
          companyUpsert: { name: 'Globex Retail', domain: 'globex.example' },
          contactsUpsert: [
            { name: 'Chris Patel', email: 'chris.patel@globex.example', title: 'Director Digital' },
            { name: 'Elena Ruiz', email: 'elena.ruiz@globex.example', title: 'IT Lead' }
          ],
          dealUpsert: { name: 'Globex · Renewal FY27', amount: 120000, stage: 'negotiation', company: 'Globex Retail' },
          tasks: [
            { title: 'Escalate GLOB-441 and share ETA', owner: 'Maya Torres', due: '2026-10-24' },
            { title: 'Draft holiday readiness checklist', owner: 'Maya Torres', due: '2026-10-28' },
            { title: 'Send renewal redlines + success plan', owner: 'Maya Torres', due: '2026-10-28' }
          ],
          activity: { type: 'meeting', subject: 'Customer QBR · Globex Retail' }
        }
      }
    },
    {
      id: 'demo-hiring',
      title: 'Hiring sync · Senior data engineer',
      kind: 'hiring',
      when: '2026-11-02T11:00:00-06:00',
      durationSec: 900,
      participants: [
        { name: 'Taylor Brooks', role: 'Recruiter', email: 'taylor.brooks@acmecorp.example', company: 'Acme Corp' },
        { name: 'Sam Ortiz', role: 'Hiring Manager', email: 'sam.ortiz@acmecorp.example', company: 'Acme Corp' },
        { name: 'Priya Nair', role: 'Staff Engineer', email: 'priya.nair@acmecorp.example', company: 'Acme Corp' }
      ],
      company: { name: 'Acme Corp', domain: 'acmecorp.example', stage: null },
      deal: null,
      tags: ['internal', 'hiring'],
      summaryHint: 'Hiring sync on the senior data engineer pipeline, scorecard and interview loop.',
      transcript: [
        T(10, 'Taylor Brooks', 'We have four candidates in pipeline for senior data engineer. Two are past phone screen.'),
        T(28, 'Sam Ortiz', 'I liked Alex Morgan from the phone screen. Strong Spark and dbt background.'),
        T(48, 'Priya Nair', 'Agreed. Their take-home on the streaming assignment scored four out of five. I am free for the system design round on Thursday.'),
        T(74, 'Taylor Brooks', 'I will schedule Alex for Thursday at two PM Central with Priya, and Friday morning with Sam for the hiring manager round.'),
        T(102, 'Sam Ortiz', 'Please also send the updated scorecard. We added a section on data contracts.'),
        T(122, 'Priya Nair', 'One concern: Alex needs sponsorship. Is that still okay for this level?'),
        T(138, 'Taylor Brooks', 'Yes, people ops confirmed sponsorship is available for senior IC roles this quarter.'),
        T(158, 'Sam Ortiz', 'Great. Reject the other phone-screen candidate politely; skills were more analyst than engineer.'),
        T(180, 'Taylor Brooks', 'Will do today. Target offer date if Alex clears rounds is November eighteenth.'),
        T(202, 'Sam Ortiz', 'Sounds right. Thanks everyone.')
      ],
      extract: {
        summary: 'Hiring sync for senior data engineer: Alex Morgan advances (Spark/dbt, take-home 4/5). System design with Priya Thursday 2pm Central; HM round with Sam Friday morning. Sponsorship confirmed OK. Other phone-screen candidate to be declined. Target offer Nov 18.',
        decisions: [
          { text: 'Advance Alex Morgan to onsite loop (system design + HM).', cite: { t: 74, quote: 'I will schedule Alex for Thursday at two PM Central with Priya, and Friday morning with Sam' } },
          { text: 'Sponsorship is available for senior IC roles this quarter.', cite: { t: 138, quote: 'people ops confirmed sponsorship is available for senior IC roles this quarter.' } },
          { text: 'Decline the other phone-screen candidate.', cite: { t: 158, quote: 'Reject the other phone-screen candidate politely' } }
        ],
        actions: [
          { text: 'Schedule Alex: Thu 2pm CT with Priya; Fri morning with Sam', owner: 'Taylor Brooks', due: '2026-11-02', cite: { t: 74, quote: 'I will schedule Alex for Thursday at two PM Central with Priya, and Friday morning with Sam for the hiring manager round.' } },
          { text: 'Send updated scorecard including data contracts section', owner: 'Taylor Brooks', due: '2026-11-02', cite: { t: 102, quote: 'Please also send the updated scorecard. We added a section on data contracts.' } },
          { text: 'Send polite rejection to other phone-screen candidate', owner: 'Taylor Brooks', due: '2026-11-02', cite: { t: 158, quote: 'Reject the other phone-screen candidate politely' } }
        ],
        questions: [
          { text: 'Is sponsorship still okay for this senior IC level?', cite: { t: 122, quote: 'Alex needs sponsorship. Is that still okay for this level?' } }
        ],
        risks: [],
        sentiment: { score: 0.7, label: 'positive', cite: { t: 28, quote: 'I liked Alex Morgan from the phone screen. Strong Spark and dbt background.' } },
        followUp: {
          to: 'taylor.brooks@acmecorp.example, sam.ortiz@acmecorp.example, priya.nair@acmecorp.example',
          subject: 'Hiring sync notes · Senior data engineer (Alex Morgan)',
          body: 'Team,\n\n• Advance Alex Morgan: system design Thu 2pm CT (Priya), HM Fri morning (Sam).\n• Scorecard: Taylor sends updated version with data-contracts section.\n• Sponsorship: confirmed OK for senior IC this quarter.\n• Decline other phone-screen candidate today.\n• Target offer date if cleared: Nov 18.\n\n— MeetMinder'
        },
        crm: {
          companyUpsert: null,
          contactsUpsert: [
            { name: 'Alex Morgan', email: null, title: 'Senior Data Engineer candidate', note: 'Pipeline: system design + HM rounds' }
          ],
          dealUpsert: null,
          tasks: [
            { title: 'Schedule Alex interview loop', owner: 'Taylor Brooks', due: '2026-11-02' },
            { title: 'Send updated hiring scorecard', owner: 'Taylor Brooks', due: '2026-11-02' },
            { title: 'Decline other phone-screen candidate', owner: 'Taylor Brooks', due: '2026-11-02' }
          ],
          activity: { type: 'meeting', subject: 'Hiring sync · Senior data engineer' }
        }
      }
    },
    {
      id: 'demo-messy',
      title: 'Roadmap brainstorm · (messy)',
      kind: 'brainstorm',
      when: '2026-10-30T16:00:00-05:00',
      durationSec: 1500,
      participants: [
        { name: 'Ava Chen', role: 'PM', email: 'ava.chen@acmecorp.example', company: 'Acme Corp' },
        { name: 'Sam Ortiz', role: 'Eng Manager', email: 'sam.ortiz@acmecorp.example', company: 'Acme Corp' },
        { name: 'Casey Brooks', role: 'Frontend', email: 'casey.brooks@acmecorp.example', company: 'Acme Corp' },
        { name: 'Jordan Lee', role: 'Design', email: 'jordan.lee@acmecorp.example', company: 'Acme Corp' }
      ],
      company: { name: 'Acme Corp', domain: 'acmecorp.example', stage: null },
      deal: null,
      tags: ['internal', 'messy'],
      summaryHint: 'Noisy brainstorm with crosstalk, an off-topic tangent, and a few real decisions buried in the noise.',
      transcript: [
        T(8, 'Ava Chen', 'Okay people, roadmap brainstorm for Q1. Mute when you are not talking if you can.'),
        T(22, 'Sam Ortiz', 'We should finally kill the legacy reports page. It is—'),
        T(28, 'Casey Brooks', '—sorry, go ahead Sam, I was saying the same thing.'),
        T(36, 'Sam Ortiz', 'It is costing us roughly two engineer-weeks a quarter in patches.'),
        T(52, 'Jordan Lee', 'Users still open it though. Twenty-eight percent of weekly actives hit it last month.'),
        T(70, 'Ava Chen', 'So maybe redesign rather than delete? We could—'),
        T(78, 'Casey Brooks', 'Wait, has anyone seen the new coffee place downstairs? The flat whites are incredible.'),
        T(92, 'Jordan Lee', 'Ha, yes, I went yesterday. Anyway—sorry—back to reports. A redesign with saved views would cover the use case.'),
        T(118, 'Sam Ortiz', 'Fine. Decision: redesign, not delete. Target design review November twentieth.'),
        T(138, 'Ava Chen', 'Casey, can you spike the data model for saved views by next Friday?'),
        T(152, 'Casey Brooks', 'Yeah I can do that. Also we keep getting asked about mobile offline mode.'),
        T(170, 'Sam Ortiz', 'Offline is a Q2 topic. Do not pull it into Q1.'),
        T(186, 'Jordan Lee', 'One more: empty states are inconsistent across settings. I can audit them this week.'),
        T(206, 'Ava Chen', 'Please do. And Sam, please nominate an owner for the redesign before the design review.'),
        T(226, 'Sam Ortiz', 'I will assign Riley by Monday.'),
        T(240, 'Casey Brooks', 'Did we decide anything about the coffee place for the team lunch?'),
        T(252, 'Ava Chen', 'Parking lot that. Focus: redesign decision, Casey spike, Jordan audit, Riley ownership by Monday. Thanks all.')
      ],
      extract: {
        summary: 'Noisy Q1 roadmap brainstorm. Decision: redesign (not delete) the legacy reports page; design review Nov 20. Casey spikes saved-views data model by next Friday; Jordan audits empty states this week; Sam assigns Riley as redesign owner by Monday. Offline mode deferred to Q2. Off-topic coffee tangent parked.',
        decisions: [
          { text: 'Redesign the legacy reports page rather than delete it; design review Nov 20.', cite: { t: 118, quote: 'Decision: redesign, not delete. Target design review November twentieth.' } },
          { text: 'Mobile offline mode is a Q2 topic, not Q1.', cite: { t: 170, quote: 'Offline is a Q2 topic. Do not pull it into Q1.' } }
        ],
        actions: [
          { text: 'Spike data model for saved views', owner: 'Casey Brooks', due: '2026-11-06', cite: { t: 138, quote: 'can you spike the data model for saved views by next Friday?' } },
          { text: 'Audit inconsistent empty states across settings', owner: 'Jordan Lee', due: '2026-10-31', cite: { t: 186, quote: 'empty states are inconsistent across settings. I can audit them this week.' } },
          { text: 'Nominate Riley as redesign owner', owner: 'Sam Ortiz', due: '2026-11-02', cite: { t: 226, quote: 'I will assign Riley by Monday.' } }
        ],
        questions: [
          { text: 'Redesign or delete the legacy reports page?', cite: { t: 70, quote: 'So maybe redesign rather than delete?' } }
        ],
        risks: [
          { text: 'Legacy reports page costs ~2 engineer-weeks/quarter in patches.', cite: { t: 36, quote: 'It is costing us roughly two engineer-weeks a quarter in patches.' } }
        ],
        sentiment: { score: 0.5, label: 'neutral', cite: { t: 252, quote: 'Focus: redesign decision, Casey spike, Jordan audit, Riley ownership by Monday.' } },
        followUp: {
          to: 'ava.chen@acmecorp.example, sam.ortiz@acmecorp.example, casey.brooks@acmecorp.example, jordan.lee@acmecorp.example',
          subject: 'Q1 roadmap brainstorm notes (reports redesign)',
          body: 'Team,\n\nBuried under the crosstalk, we decided:\n\n• Redesign (do not delete) legacy reports; design review Nov 20.\n• Casey: spike saved-views data model by next Friday.\n• Jordan: audit empty states this week.\n• Sam: assign Riley as redesign owner by Monday.\n• Offline mode → Q2. Coffee-place lunch → parking lot.\n\n— MeetMinder'
        },
        crm: {
          companyUpsert: null,
          contactsUpsert: [],
          dealUpsert: null,
          tasks: [
            { title: 'Spike saved-views data model', owner: 'Casey Brooks', due: '2026-11-06' },
            { title: 'Audit empty states', owner: 'Jordan Lee', due: '2026-10-31' },
            { title: 'Assign Riley as reports redesign owner', owner: 'Sam Ortiz', due: '2026-11-02' }
          ],
          activity: { type: 'meeting', subject: 'Roadmap brainstorm · (messy)' }
        }
      }
    }
  ];

  function byId(id) { return MEETINGS.find((m) => m.id === id) || null; }
  function list() { return MEETINGS.map(({ id, title, kind, when, durationSec, participants, tags, summaryHint }) => ({ id, title, kind, when, durationSec, participants: participants.map((p) => p.name), tags, summaryHint })); }

  return { MEETINGS, byId, list };
});
