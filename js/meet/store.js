/* Persist meetings, CRM and settings in localStorage. Keys never land in exports. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./crm'), require('../agentkit/keystore'));
  else (root.Meet = root.Meet || {}).store = factory(root.Meet.crm, root.AgentKit.keystore);
})(typeof self !== 'undefined' ? self : this, function (crm, keystore) {
  'use strict';
  const PREFIX = 'meetminder';
  function createStore(opts) {
    const ls = (opts && opts.local) || (typeof localStorage !== 'undefined' ? localStorage : null);
    const mem = { meetings: {}, order: [], crm: null, settings: defaultSettings(), undo: [] };
    function read(k, fallback) {
      try { const raw = ls && ls.getItem(PREFIX + '.' + k); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
    }
    function write(k, v) {
      try { if (ls) ls.setItem(PREFIX + '.' + k, JSON.stringify(v)); } catch (e) { /* quota */ }
    }
    function load() {
      mem.meetings = read('meetings', {}) || {};
      mem.order = read('order', []) || [];
      mem.crm = read('crm', null) || crm.seedDemo(crm.empty());
      mem.settings = Object.assign(defaultSettings(), read('settings', {}));
      return mem;
    }
    function saveMeetings() { write('meetings', mem.meetings); write('order', mem.order); }
    function saveCrm() { write('crm', mem.crm); }
    function saveSettings() { write('settings', mem.settings); }

    function listMeetings() { return mem.order.map((id) => mem.meetings[id]).filter(Boolean); }
    function getMeeting(id) { return mem.meetings[id] || null; }
    function putMeeting(m) {
      if (!m || !m.id) return null;
      const isNew = !mem.meetings[m.id];
      mem.meetings[m.id] = m;
      if (isNew) mem.order.unshift(m.id);
      saveMeetings();
      return m;
    }
    function deleteMeeting(id) {
      const m = mem.meetings[id];
      if (!m) return null;
      delete mem.meetings[id];
      mem.order = mem.order.filter((x) => x !== id);
      saveMeetings();
      pushUndo({ type: 'deleteMeeting', meeting: m });
      return m;
    }
    function restoreMeeting(m) {
      if (!m || !m.id) return;
      mem.meetings[m.id] = m;
      if (!mem.order.includes(m.id)) mem.order.unshift(m.id);
      saveMeetings();
    }
    function pushUndo(entry) {
      mem.undo.unshift(Object.assign({ at: Date.now() }, entry));
      if (mem.undo.length > 20) mem.undo.pop();
    }
    function popUndo() { return mem.undo.shift() || null; }

    function getCrm() { return mem.crm; }
    function setCrm(db) { mem.crm = db; saveCrm(); }
    function applyCrmSnapshot(snapshot) { mem.crm = snapshot; saveCrm(); }

    function getSettings() { return mem.settings; }
    function setSettings(patch) { mem.settings = Object.assign({}, mem.settings, patch); saveSettings(); return mem.settings; }

    function exportAll() {
      return keystore.redact({ meetings: mem.meetings, order: mem.order, crm: mem.crm, settings: Object.assign({}, mem.settings, { keys: undefined }) });
    }
    function clearAll() {
      mem.meetings = {}; mem.order = []; mem.crm = crm.seedDemo(crm.empty()); mem.settings = defaultSettings(); mem.undo = [];
      saveMeetings(); saveCrm(); saveSettings();
    }

    load();
    return { listMeetings, getMeeting, putMeeting, deleteMeeting, restoreMeeting, getCrm, setCrm, applyCrmSnapshot, getSettings, setSettings, exportAll, clearAll, pushUndo, popUndo, _mem: mem };
  }

  function defaultSettings() {
    return {
      mode: 'demo', // demo | live
      provider: 'openai',
      model: '',
      baseUrl: '',
      keyMode: 'local', // local | session
      redactEmails: false,
      redactPhones: false,
      serverUrl: '',
      theme: 'system',
      consentAck: false
    };
  }

  function newMeetingId() { return 'mtg_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

  return { createStore, defaultSettings, newMeetingId, PREFIX };
});
