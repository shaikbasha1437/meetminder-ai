# MeetMinder AI

A meeting agent that turns live speech, uploads or transcripts into **cited notes**, action items and a **CRM changeset** you approve field-by-field. Follow-up emails are **drafts only**. Nothing is ever sent from the browser.

**Live:** https://shaikbasha1437.github.io/meetminder-ai/  
**Source:** https://github.com/shaikbasha1437/meetminder-ai

## What it does

- **Ingest:** Web Speech live mic, upload VTT/SRT/TXT/JSON (Zoom/Meet/Teams-style), paste text, or play a simulated live demo meeting.
- **Notes:** Summary, decisions, action items (owner + due), open questions, risks, sentiment, follow-up email draft. Every item links back to a transcript timestamp/quote; unbacked claims are flagged.
- **Local CRM:** Companies, contacts, deals, activities and tasks in your browser. The agent proposes a per-field diff; you approve/reject, apply, and undo.
- **Connectors:** Builds exact HubSpot and Salesforce API payloads (and curl). Actual push only through the optional self-hosted server with **your** token — never from the static demo page.
- **Demo mode:** Five fictional meetings (sales discovery, standup, QBR, hiring sync, messy brainstorm) with `.example` domains. Works offline, no API key.
- **Live mode:** Your own OpenAI / Anthropic / Gemini / OpenAI-compatible key (stored only in this browser). Optional WebLLM (untested end-to-end).

## Joining Zoom / Meet / Teams

Browsers **cannot** join those calls as a bot. MeetMinder is honest about that in the UI.

The optional `/server` (Node, no npm dependencies, Dockerfile included) adds:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness |
| `POST /webhooks/transcript` | Receive a transcript JSON body |
| `GET /transcripts` | List received transcripts for the web app to pull |
| `POST /adapters/recall/start` | Recall.ai-style adapter (simulated unless `RECALL_API_KEY` + `MOCK_CONNECTORS=0`) |
| `POST /connectors/hubspot/push` | Push HubSpot ops (mock by default) |
| `POST /connectors/salesforce/push` | Push Salesforce ops (mock by default) |

### Run the server

```bash
cd server
npm start
# listens on http://127.0.0.1:8787 with MOCK_CONNECTORS=1

# or Docker
docker build -t meetminder-server ./server
docker run --rm -p 8787:8787 meetminder-server
```

Environment (optional, for real pushes — **not tested with real keys in this repo**):

- `HUBSPOT_TOKEN`
- `SALESFORCE_TOKEN` + `SALESFORCE_INSTANCE`
- `RECALL_API_KEY`
- `MOCK_CONNECTORS=0` to attempt real outbound calls

Point the web app at the server under **Server → Save & ping**.

## Privacy

- Consent reminder before recording (laws vary; tell attendees).
- Optional email/phone redaction.
- Delete meeting with undo toast.
- API keys never appear in exports or share links.

## Development

```bash
npm test                 # app unit tests
npm run server:test      # server tests (mocks)
```

## License

MIT
