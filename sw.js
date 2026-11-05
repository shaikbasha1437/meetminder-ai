/* MeetMinder AI service worker: network-first, per-file cache, versioned, offline fallback.
   Bump CACHE on each release; old caches are removed on activate. Demo mode works fully offline. */
const CACHE = 'meetminder-ai-v1';
const ASSETS = ["./", "./index.html", "./styles.css", "./manifest.webmanifest", "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./js/agentkit/guard.js", "./js/agentkit/keystore.js", "./js/agentkit/llm.js", "./js/agentkit/modal.js", "./js/agentkit/webllm.js", "./js/app.js", "./js/data/meetings.js", "./js/main.js", "./js/meet/adapters.js", "./js/meet/agent.js", "./js/meet/cite.js", "./js/meet/crm.js", "./js/meet/crmdiff.js", "./js/meet/extract.js", "./js/meet/live.js", "./js/meet/parse.js", "./js/meet/playback.js", "./js/meet/quality.js", "./js/meet/redact.js", "./js/meet/speech.js", "./js/meet/store.js", "./js/ui.js", "./js/views/crm.js", "./js/views/ingest.js", "./js/views/meeting.js", "./js/views/meetings.js", "./js/views/server.js", "./js/views/settings.js"];
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((a) => c.add(new Request(a, { cache: 'reload' })).catch(() => {})))));
});
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('meetminder-ai-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => {
    if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })
    .then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html').then((i) => i || caches.match('./')) : undefined))
    .then((r) => r || Response.error())));
});
