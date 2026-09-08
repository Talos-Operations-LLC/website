/* Fee Simple demo — a stand-in server that lives in the browser.
   Every call the pages make to /api/... is answered here from the canned
   sample data under /demo/data/. Nothing is sent anywhere. What you do in
   the demo (runs, fixes, captures, exports) is kept in this tab's session
   storage until you restart the demo. */
(function () {
'use strict';
var BASE = '/demo/';
var DATA_URL = BASE + 'data/index.json';
var STORE_KEY = 'feesimple-demo-v1';
var ME = 'sam@demo-firm.example';
var FIRM = 'Demo Law Firm';
var RUN_MS = 7000;
var realFetch = window.fetch.bind(window);

/* ---------- fresh start: the home-page button and the Restart link ---------- */
(function () {
  var p = new URLSearchParams(location.search);
  if (!p.has('fresh')) return;
  try { sessionStorage.removeItem(STORE_KEY); } catch (e) {}
  p.delete('fresh');
  var q = p.toString();
  history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
})();

/* ---------- state ---------- */
var S = null;
function state() {
  if (S) return S;
  try { S = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null'); } catch (e) { S = null; }
  if (!S || S.v !== 1) S = { v: 1, jobs: {}, clones: {}, deleted: [], edits: {}, imports: {} };
  return S;
}
function save() { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {} }
function E(run) { var s = state(); if (!s.edits[run]) s.edits[run] = {}; return s.edits[run]; }

var D = null;
var READY = realFetch(DATA_URL, { cache: 'no-store' }).then(function (r) { return r.json(); })
  .then(function (d) { D = d; return d; });

/* ---------- small helpers ---------- */
function pad(n) { return (n < 10 ? '0' : '') + n; }
function isoLocal(ms) {
  var d = new Date(ms), o = -d.getTimezoneOffset(), sg = o >= 0 ? '+' : '-'; o = Math.abs(o);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' +
    pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
    sg + pad(Math.floor(o / 60)) + ':' + pad(o % 60);
}
function stampOf(ms) {
  var d = new Date(ms);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}
function timeOf(started) { return (started || '').slice(0, 16).replace('T', '  '); }
function rand4() { return Math.random().toString(16).slice(2, 6); }
function safeSlug(s) { return s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function pretty(c) { return c ? c.charAt(0).toUpperCase() + c.slice(1) : ''; }
function enc(s) { return String(s).split('/').map(encodeURIComponent).join('/'); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
}
function fail(status, detail) { var e = new Error(detail); e.status = status; return e; }
function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
async function form(init) {
  var b = init && init.body, out = {};
  if (!b) return out;
  if (typeof FormData !== 'undefined' && b instanceof FormData) { b.forEach(function (v, k) { out[k] = v; }); return out; }
  if (typeof URLSearchParams !== 'undefined' && b instanceof URLSearchParams) { b.forEach(function (v, k) { out[k] = v; }); return out; }
  if (typeof b === 'string') { try { return JSON.parse(b); } catch (e) { new URLSearchParams(b).forEach(function (v, k) { out[k] = v; }); return out; } }
  return out;
}
function readFileB64(file) {
  return new Promise(function (res, rej) {
    var fr = new FileReader();
    fr.onload = function () { res(String(fr.result).split(',')[1] || ''); };
    fr.onerror = function () { rej(fr.error); };
    fr.readAsDataURL(file);
  });
}
var BLOBS = {};
function blobUrl(key, b64, type) {
  if (BLOBS[key]) return BLOBS[key];
  if (!b64) return '';
  var bin = atob(b64), arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  BLOBS[key] = URL.createObjectURL(new Blob([arr], { type: type || 'application/pdf' }));
  return BLOBS[key];
}

/* ---------- which run is which ---------- */
function resolveRun(name) {
  var s = state();
  if (s.deleted.indexOf(name) >= 0) throw fail(404, 'no such run');
  if (D.runs[name]) return { name: name, tpl: D.runs[name], dir: name };
  var c = s.clones[name];
  if (c && D.runs[c.template]) return { name: name, tpl: D.runs[c.template], dir: c.template, clone: c };
  var im = s.imports[name];
  if (im) return { name: name, imp: im, dir: null };
  throw fail(404, 'no such run');
}
function jobFor(run) {
  var s = state(), best = null;
  Object.keys(s.jobs).forEach(function (id) { if (s.jobs[id].run === run) best = s.jobs[id]; });
  return best;
}
function jobStatus(j) {
  if (j.cancelled) return 'cancelled';
  return (Date.now() - j.t0) >= RUN_MS ? 'done' : 'running';
}
function runDone(R) {
  if (!R.clone) return true;
  var j = jobFor(R.name);
  return !j || jobStatus(j) === 'done';
}

/* problems the pipeline left, and whether a person fixed each */
function resolvedOf(R, ed) {
  var t = R.tpl, problems = [], fixes = ed.fixes || [];
  if (!t.detail.success) problems.push('record');
  if (t.detail.deed_label === 'FAILED') problems.push('deed');
  if (!problems.length) return false;
  return problems.every(function (p) {
    if (p === 'record') return fixes.some(function (f) { return f.what === 'record'; });
    return ed.deed_hand === 'retrieved' || fixes.some(function (f) { return f.what === 'deed'; });
  });
}

function buildRow(name) {
  var R = resolveRun(name), ed = E(name);
  if (R.imp) return importRow(R.imp);
  var row = clone(R.tpl.history);
  row.run = name;
  if (R.clone) {
    row.started = R.clone.started; row.time = timeOf(row.started);
    row.mine = true; row.owner = ME; row.private = true; row.section = '';
    if (!runDone(R)) {
      row.finished = false; row.final = ''; row.ok = false; row.resolved = false;
      row.taxcard = 'FAILED'; row.deed = '-'; row.bookpage = ''; row.has_csv = false;
      row.ldv = 'none'; row.deed_hand = 'none';
      return row;
    }
  }
  if (ed.private !== undefined) row.private = ed.private;
  if (ed.deed_hand) row.deed_hand = ed.deed_hand;
  if (ed.ldv) row.ldv = ed.ldv.state;
  if (ed.fixes && ed.fixes.some(function (f) { return f.what === 'record'; })) row.has_csv = true;
  row.resolved = resolvedOf(R, ed);
  return row;
}
function importRow(im) {
  return { ldv: (E(im.run).ldv || {}).state || 'none', deed_hand: 'none', deed_error: '', rod_url: '',
    taxcard_url: '', taxcard_pdf: '', started: im.started, time: timeOf(im.started), elapsed: '',
    address: im.stem, city: '', county: '', taxcard: '-', deed: 'imported', bookpage: '', ok: false,
    resolved: false, has_csv: false, run: im.run, private: (E(im.run).private !== undefined ? E(im.run).private : true),
    mine: true, owner: ME, section: '', final: '', has_events: false, finished: true };
}
function historyRows() {
  var s = state(), rows = [];
  D.order.forEach(function (n) { if (s.deleted.indexOf(n) < 0) rows.push(buildRow(n)); });
  Object.keys(s.clones).forEach(function (n) { if (s.deleted.indexOf(n) < 0) rows.push(buildRow(n)); });
  Object.keys(s.imports).forEach(function (n) { if (s.deleted.indexOf(n) < 0) rows.push(buildRow(n)); });
  rows.sort(function (a, b) { return (b.started + b.run) < (a.started + a.run) ? -1 : 1; });
  return rows;
}

function buildDetail(name) {
  var R = resolveRun(name), ed = E(name);
  if (R.imp) return importDetail(R.imp);
  var d = clone(R.tpl.detail);
  d.run = name;
  if (R.clone) { d.time = timeOf(R.clone.started); d.finished = runDone(R); }
  if (ed.deed_hand) d.deed_hand = ed.deed_hand;
  d.fixes = clone(ed.fixes || []);
  d.resolved = resolvedOf(R, ed);
  d.exported = ed.exports && ed.exports.length ? { exports: clone(ed.exports) } : (d.exported || null);
  if (ed.deed_import) {
    var url = blobUrl('deed:' + name, ed.deed_import.b64, 'application/pdf');
    d.evidence.push({ label: 'Deed PDF (imported)', name: ed.deed_import.name, source: 'Imported by hand',
      source_url: '', view: url || '#', download: url || '#', pages: null });
    d.has_deed_pdf = true;
    d['import'] = { imported_at: ed.deed_import.at, imported_by: ME,
      original_filename: ed.deed_import.name, size_bytes: ed.deed_import.size };
  }
  return d;
}
function importDetail(im) {
  var url = blobUrl('imp:' + im.run, im.b64, 'application/pdf');
  return { run: im.run, address: im.stem, city: '', county: '', time: timeOf(im.started), elapsed: '',
    finished: true, success: false, has_csv: false, bookpage: '', deed_label: '-', deed_error: '',
    deed_hand: 'none', deed_grantee: '', deed_name: '', notice_mode: '', rod_url: '',
    property: { PropAdd: '', PropCity: '', PropSt: '', PropZip: '' },
    mailing: { MailingAdd: '', MailCity: '', MailState: '', MZip: '' },
    evidence: [{ label: 'Deed PDF (imported)', name: im.pdf, source: 'Imported by hand', source_url: '',
      view: url || '#', download: url || '#', pages: null }],
    has_deed_pdf: true, imported: true,
    'import': { imported_at: im.started, imported_by: ME, original_filename: im.pdf, size_bytes: im.size },
    resolved: false, fixes: [], exported: null, taxcard_url: '' };
}
function buildLdv(name) {
  var R = resolveRun(name), ed = E(name), l;
  if (R.imp) {
    l = { run: name, ldv_error: null, deed_pdf: R.imp.pdf, pages: 0, deed_kind: 'imported', state: 'none',
      final_text: '', detail: {}, captured_at: null, source_pdf: null, skip_blocked: '', reasons: D.reasons };
  } else {
    l = clone(R.tpl.ldv); l.run = name; l.ldv_error = null;
    if (!l.deed_pdf && ed.deed_import) { l.deed_pdf = ed.deed_import.name; l.pages = 0; l.deed_kind = 'imported'; }
  }
  if (ed.ldv) {
    l.state = ed.ldv.state; l.final_text = ed.ldv.final_text || '';
    l.detail = ed.ldv.detail || {}; l.captured_at = ed.ldv.captured_at || null;
    l.source_pdf = ed.ldv.source_pdf || null;
  }
  l.skip_blocked = l.state === 'captured' ? 'This parcel already has a saved capture; a skip cannot replace it.' : '';
  return l;
}

/* ---------- the live replay ---------- */
function offsets(recs) {
  var n = recs.length, span = RUN_MS - 250, ts = recs.map(function (r) { return Date.parse(r.ts || ''); });
  var ok = ts.every(function (t) { return !isNaN(t); }) && n > 1 && ts[n - 1] > ts[0];
  var out = [], t0 = ts[0], tN = ts[n - 1];
  for (var i = 0; i < n; i++) {
    var o = ok ? (ts[i] - t0) / (tN - t0) * span : (n > 1 ? i / (n - 1) * span : 0);
    if (i && o < out[i - 1]) o = out[i - 1];
    out.push(Math.round(o));
  }
  return out;
}
function liveFor(name, since) {
  var R = resolveRun(name);
  var empty = { run: name, present: false, status: null, stage: '', done: false, total: 0,
    county: '', address: '', started: '', records: [], display: [] };
  if (R.imp || !R.tpl.live || !R.tpl.live.present) return empty;
  var live = R.tpl.live, recs = live.records, disp = live.display || [];
  var done = true, status = live.status, started = live.started;
  if (R.clone) {
    var j = jobFor(name), el = j ? Date.now() - j.t0 : RUN_MS;
    if (j && j.cancelled) el = Math.min(el, RUN_MS - 1);
    var off = offsets(recs), n = 0;
    for (var i = 0; i < recs.length; i++) if (off[i] <= el) n = i + 1;
    if (j && j.cancelled && n === recs.length) n = recs.length - 1;
    done = n >= recs.length;
    recs = recs.slice(0, n).map(function (r, k) {
      var c = clone(r); c.run_id = name; c.ts = isoLocal(j ? j.t0 + off[k] : Date.now()); return c;
    });
    status = done ? live.status : 'Pending';
    started = isoLocal(j ? j.t0 : Date.now());
  }
  var fresh = recs.filter(function (r) { return r.malformed || (r.seq || 0) > since; });
  var seen = {}; fresh.forEach(function (r) { seen[r.seq] = true; });
  var ok = recs.filter(function (r) { return !r.malformed; });
  return { run: name, present: true, status: status,
    stage: ok.length ? (ok[ok.length - 1].stage || '') : '', done: done,
    total: ok.length ? ok[ok.length - 1].seq : recs.length,
    county: live.county, address: live.address, started: started,
    records: fresh, display: disp.filter(function (d) { return seen[d.seq]; }) };
}

/* ---------- CSV + a tiny zip writer (stored entries) for Export ---------- */
function csvQuote(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
function csvFor(names) {
  var cols = D.csv_columns, lines = [cols.map(csvQuote).join(',')], marked = [];
  names.forEach(function (name) {
    var R; try { R = resolveRun(name); } catch (e) { return; }
    if (R.imp) return;
    var ed = E(name), ldv = buildLdv(name), legal = ldv.state === 'captured' ? ldv.final_text : '';
    var rows = clone(R.tpl.record_rows || []);
    var fix = (ed.fixes || []).filter(function (f) { return f.what === 'record'; }).pop();
    if (fix) {
      var f = fix.fields || {}, r = {};
      cols.forEach(function (c) { r[c] = ''; });
      r.DeedName = f.deed_name || ''; r.MailingAdd = f.mailing_add || ''; r.MailCity = f.mail_city || '';
      r.MailState = (f.mail_state || '').toUpperCase(); r.MZip = f.mzip || ''; r.PropAdd = f.prop_add || '';
      r.PropCity = f.prop_city || ''; r.PropSt = (f.prop_st || '').toUpperCase(); r.PropZip = f.prop_zip || '';
      rows = [r];
    }
    if (!rows.length) return;
    rows.forEach(function (r) {
      if (legal && 'LegalDesc' in r) r.LegalDesc = legal;
      lines.push(cols.map(function (c) { return csvQuote(r[c]); }).join(','));
    });
    marked.push(name);
  });
  return { text: lines.join('\r\n') + '\r\n', marked: marked };
}
var CRC_T = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStored(files) {
  var parts = [], central = [], offset = 0, enc = new TextEncoder();
  function u16(v) { return [v & 255, (v >> 8) & 255]; }
  function u32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
  var d = new Date(), dt = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  var dd = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  files.forEach(function (f) {
    var name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
    var head = [].concat(u32(0x04034b50), u16(20), u16(0x800), u16(0), u16(dt), u16(dd), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
    parts.push(new Uint8Array(head), name, data);
    central.push([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x800), u16(0), u16(dt), u16(dd), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset)), name);
    offset += head.length + name.length + data.length;
  });
  var cdStart = offset, cdLen = 0;
  central.forEach(function (c) { var h = new Uint8Array(c[0]); parts.push(h, c[1]); cdLen += h.length + c[1].length; });
  parts.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdLen), u32(cdStart), u16(0))));
  return new Blob(parts, { type: 'application/zip' });
}

/* ---------- the routes ---------- */
async function route(method, p, q, init) {
  var s = state(), m;
  if (p === '/health') return json({ ok: true, demo: true });
  if (p === '/api/whoami') return json({ me: ME, active: [], firm: 'demo', firm_name: FIRM, operator: false, multi: true,
    section: '', role: '', version: D.version || 'demo', release: '' });
  if (p === '/api/settings') return json({ version: D.version || 'demo', counties: D.counties });
  if (p === '/api/session') return json({ county: 'wake', state: 'not started', detail: '' });
  if (p === '/api/active_all' || p === '/api/status' || p === '/api/dashboard') throw fail(403, 'operators only');
  if (p === '/api/active') {
    var jobs = [];
    Object.keys(s.jobs).forEach(function (id) { var j = s.jobs[id]; if (jobStatus(j) === 'running') jobs.push({ id: j.id, label: j.label, status: 'running', started: isoLocal(j.t0) }); });
    return json({ active: jobs.length, labels: jobs.map(function (j) { return j.label; }), running: jobs.length, queued: 0, jobs: jobs });
  }
  if (p === '/api/history') {
    var rows = historyRows(), passed = rows.filter(function (r) { return r.ok; }).length;
    return json({ rows: rows, passed: passed, failed: rows.length - passed });
  }
  if (p === '/api/live-run') { var rows2 = historyRows(); return json({ run: rows2.length ? rows2[0].run : '' }); }
  if ((m = p.match(/^\/api\/log\/([^/]+)$/))) {
    var j = s.jobs[m[1]]; if (!j) throw fail(404, 'no such job');
    var st = jobStatus(j), tpl = D.runs[s.clones[j.run] ? s.clones[j.run].template : ''];
    return json({ lines: [], next: 0, dropped: 0, buffer: 4000, status: st,
      returncode: st === 'done' ? (tpl && tpl.detail.success ? 0 : 1) : null,
      run_dirs: [j.run], live_run: j.run, label: j.label });
  }
  if ((m = p.match(/^\/api\/stop\/([^/]+)$/)) && method === 'POST') {
    var j2 = s.jobs[m[1]]; if (!j2) throw fail(404, 'no such job');
    if (jobStatus(j2) === 'running') { j2.cancelled = true; save(); return json({ status: 'cancelled' }); }
    return json({ status: jobStatus(j2) });
  }
  if (p === '/api/run' && method === 'POST') {
    var f = await form(init), addr = String(f.address || '').trim(), county = String(f.county || '');
    if (!addr) throw fail(400, 'address required');
    var running = Object.keys(s.jobs).some(function (id) { return jobStatus(s.jobs[id]) === 'running'; });
    if (running) throw fail(400, 'A run is already in progress in this demo. Let it finish first.');
    var hit = null;
    D['try'].forEach(function (t) { if (norm(t.address) === norm(addr)) hit = t; });
    if (!hit) throw fail(400, 'This demo runs on the sample addresses listed under the run. Click one to fill the form, then press Run.');
    if (hit.county !== county) throw fail(400, 'In this demo ' + hit.address + ' is in ' + pretty(hit.county) + ' County. Pick ' + pretty(hit.county) + ' in the county box and run again.');
    var t0 = Date.now(), name = stampOf(t0) + '_demo-pc_' + rand4() + '_' + county + '_' + safeSlug(addr);
    var id = 'job-' + rand4() + rand4();
    s.clones[name] = { template: hit.run, started: isoLocal(t0), t0: t0 };
    s.jobs[id] = { id: id, run: name, label: county + ' — ' + addr, t0: t0, cancelled: false };
    save();
    return json({ job_id: id });
  }
  if (p === '/api/batch' && method === 'POST') throw fail(400, 'Batch runs are turned off in this demo. Try one of the sample addresses instead.');
  if ((m = p.match(/^\/api\/live-run\/(.+)$/))) return json(liveFor(decodeURIComponent(m[1]), parseInt(q.get('since') || '0', 10) || 0));
  if ((m = p.match(/^\/api\/run-events\/(.+)$/))) {
    var R = resolveRun(decodeURIComponent(m[1]));
    if (R.imp) return json({ events: null });
    if (R.clone) { var lv = liveFor(R.name, 0); return json({ events: lv.records }); }
    return json(R.tpl.events);
  }
  if ((m = p.match(/^\/api\/run-detail\/(.+)$/))) return json(buildDetail(decodeURIComponent(m[1])));
  if ((m = p.match(/^\/api\/evidence\/(.+)$/))) {
    var R2 = resolveRun(decodeURIComponent(m[1]));
    if (R2.imp) return json({ run: R2.name, groups: [{ group: 'Documents', items: [{ label: 'Deed PDF (imported)', file: R2.imp.pdf, size: R2.imp.size }] }] });
    var ev = clone(R2.tpl.evidence); ev.run = R2.name; return json(ev);
  }
  if ((m = p.match(/^\/api\/ldv\/state\/(.+)$/))) return json(buildLdv(decodeURIComponent(m[1])));
  if (p === '/api/ldv/ocr' && method === 'POST') {
    var fo = await form(init), Ro = resolveRun(String(fo.run || ''));
    await delay(700);
    var text = (Ro.tpl && Ro.tpl.ocr_text) || D.ocr_text || '';
    return json({ text: text, redirect_markers: [] });
  }
  if (p === '/api/ldv/save' && method === 'POST') {
    var body = await form(init), name2 = String(body.run || ''), Rs = resolveRun(name2), ed = E(name2);
    var frags = body.fragments || [];
    if (!frags.length) throw fail(400, 'no fragments');
    if (ed.ldv && ed.ldv.state === 'captured' && !body.supersede)
      throw fail(409, 'This parcel already has a saved legal-description capture. Save this one as well? The earlier capture is KEPT, renamed with a .superseded stamp — it is never deleted.');
    var l = buildLdv(name2);
    ed.ldv = { state: 'captured', final_text: frags.map(function (fr) { return String(fr.final_text || ''); }).join(' '),
      captured_at: isoLocal(Date.now()).slice(0, 19), source_pdf: l.deed_pdf, detail: {} };
    save();
    return json({ saved: 'legal_desc.json' });
  }
  if (p === '/api/ldv/skip' && method === 'POST') {
    var fs = await form(init), name3 = String(fs.run || ''); resolveRun(name3);
    var ed3 = E(name3);
    if (ed3.ldv && ed3.ldv.state === 'captured') throw fail(409, 'This parcel already has a saved capture; a skip cannot replace it.');
    if (!fs.code) throw fail(400, 'unknown reason code');
    if (fs.code === 'other' && !String(fs.note || '').trim()) throw fail(400, "'other' requires a note");
    ed3.ldv = { state: 'skipped', final_text: '', detail: { reason_code: fs.code, reason_text: String(fs.note || '') } };
    save();
    return json({ saved: 'legal_desc_skip.json' });
  }
  if ((m = p.match(/^\/api\/ldv\/title-export\/(.+)$/)) && method === 'POST') {
    var name4 = decodeURIComponent(m[1]), R4 = resolveRun(name4), l4 = buildLdv(name4);
    var ex = { status: l4.state === 'captured' ? 'CAPTURED' : (l4.state === 'skipped' ? 'SKIPPED' : 'NOT_CAPTURED'),
      legal_description: l4.state === 'captured' ? l4.final_text : '',
      county: R4.tpl ? R4.tpl.detail.county : '', run_id: name4, exported_at: isoLocal(Date.now()).slice(0, 19), exported_by: ME };
    E(name4).title_export = ex; save();
    return json({ saved: 'title_export.json', 'export': ex });
  }
  if (p === '/api/ldv/import' && method === 'POST') {
    var fi = await form(init), file = fi.file;
    if (!file || !file.name) throw fail(400, 'no file');
    if (!/\.pdf$/i.test(file.name)) throw fail(400, 'That file is not a PDF.');
    var stem = file.name.replace(/\.pdf$/i, ''), t1 = Date.now();
    var run = stampOf(t1) + '_demo-pc_' + rand4() + '_import_' + safeSlug(stem);
    var b64 = file.size <= 2500000 ? await readFileB64(file) : '';
    s.imports[run] = { run: run, pdf: file.name, stem: stem, size: file.size, started: isoLocal(t1), b64: b64 };
    save();
    return json({ run: run, pdf: file.name });
  }
  if (p === '/api/deed/retrieved' && method === 'POST') {
    var fd = await form(init), name5 = String(fd.run || ''), R5 = resolveRun(name5);
    if (!R5.tpl || R5.tpl.detail.deed_label !== 'FAILED') throw fail(409, "This run's deed did not fail — there is nothing to retrieve by hand.");
    E(name5).deed_hand = 'retrieved'; save();
    return json({ saved: 'deed_hand.json' });
  }
  if ((m = p.match(/^\/api\/run\/delete\/(.+)$/)) && method === 'POST') {
    var name6 = decodeURIComponent(m[1]); resolveRun(name6);
    s.deleted.push(name6); delete s.clones[name6]; delete s.imports[name6]; save();
    return json({ deleted: name6 });
  }
  if ((m = p.match(/^\/api\/resolve\/deed\/(.+)$/)) && method === 'POST') {
    var name7 = decodeURIComponent(m[1]), R7 = resolveRun(name7), fr7 = await form(init);
    if (!R7.tpl || R7.tpl.detail.deed_label !== 'FAILED') throw fail(409, "This run's deed did not fail — there is nothing to resolve.");
    var f7 = fr7.file; if (!f7 || !f7.name) throw fail(400, 'no file');
    if (!/\.pdf$/i.test(f7.name)) throw fail(400, 'That file is not a PDF.');
    var ed7 = E(name7), at7 = isoLocal(Date.now()).slice(0, 19);
    ed7.deed_import = { name: f7.name, size: f7.size, at: at7, b64: f7.size <= 2500000 ? await readFileB64(f7) : '' };
    ed7.deed_hand = 'retrieved';
    ed7.fixes = ed7.fixes || [];
    ed7.fixes.push({ what: 'deed', by: ME, at: at7, fields: { grantee: String(fr7.grantee || '').trim(), pdf: f7.name } });
    save();
    return json({ saved: f7.name });
  }
  if ((m = p.match(/^\/api\/resolve\/record\/(.+)$/)) && method === 'POST') {
    var name8 = decodeURIComponent(m[1]); resolveRun(name8);
    var f8 = await form(init), cl = function (k) { return String(f8[k] || '').split(/\s+/).join(' ').trim(); };
    if (!cl('prop_add') && !cl('mailing_add')) throw fail(400, 'Type at least the property address or the mailing address.');
    var ed8 = E(name8); ed8.fixes = ed8.fixes || [];
    ed8.fixes.push({ what: 'record', by: ME, at: isoLocal(Date.now()).slice(0, 19), fields: {
      deed_name: cl('deed_name'), mailing_add: cl('mailing_add'), mail_city: cl('mail_city'), mail_state: cl('mail_state'),
      mzip: cl('mzip'), prop_add: cl('prop_add'), prop_city: cl('prop_city'), prop_st: cl('prop_st'), prop_zip: cl('prop_zip'),
      book: cl('book'), page: cl('page') } });
    save();
    return json({ saved: 'record.csv' });
  }
  if ((m = p.match(/^\/api\/private\/(.+)$/)) && method === 'POST') {
    var name9 = decodeURIComponent(m[1]), R9 = resolveRun(name9), f9 = await form(init);
    if (R9.tpl && R9.tpl.history.mine === false) throw fail(403, "only the run's creator can change this");
    E(name9).private = String(f9.private) === '1'; save();
    return json({ run: name9, private: String(f9.private) === '1' });
  }
  if (p === '/api/export' && method === 'POST') {
    var fe = await form(init), names = String(fe.runs || '').split(',').filter(function (x) { return x.trim(); });
    if (!names.length) throw fail(400, 'nothing selected');
    var out = csvFor(names);
    if (!out.marked.length) throw fail(400, 'no record.csv rows in selection');
    var stamp = stampOf(Date.now()).replace('-', '').replace('-', ''), wb = 'tm_import_' + stamp + '.csv';
    out.marked.forEach(function (n) { var e = E(n); e.exports = e.exports || []; e.exports.push({ by: ME, at: isoLocal(Date.now()).slice(0, 19), workbook: wb }); });
    save();
    return new Response(zipStored([{ name: wb, text: out.text }]), { status: 200, headers: { 'Content-Type': 'application/zip' } });
  }
  throw fail(404, 'not found in the demo: ' + p);
}

/* ---------- the fetch override ---------- */
window.fetch = async function (input, init) {
  var url = (typeof input === 'string') ? input : ((input && input.url) || String(input));
  var u = new URL(url, location.origin), p = u.pathname;
  if (u.origin !== location.origin) return new Response('', { status: 404 });
  if (p.indexOf(BASE) === 0) return realFetch(input, init);
  if (p.indexOf('/view/') === 0) {
    var rest = p.slice(6);
    return realFetch(rest.indexOf('/demo/') === 0 ? rest : BASE + 'data/' + rest);
  }
  await READY;
  try {
    return await route(((init && init.method) || 'GET').toUpperCase(), p, u.searchParams, init);
  } catch (e) {
    if (e && e.status) {
      /* The Run page writes "Could not start: ..." and then busy(false)
         overwrites it with "Ready" a tick later, so a refused run shows
         nothing. Put the reason back once the page has settled. */
      if (p === '/api/run') setTimeout(function () {
        var st = document.getElementById('status');
        if (st) st.textContent = 'Could not start: ' + e.message;
      }, 120);
      return json({ detail: e.message }, e.status);
    }
    console.error('demo: route failed', p, e);
    return json({ detail: 'demo: ' + (e && e.message) }, 500);
  }
};

/* ---------- helpers the pages call for file and page-image URLs ---------- */
/* The files live under short folder names (r01/deed.pdf); the index maps
   each run's display names to them. A run you started here reads its
   template's files. */
function tplOf(run) {
  var s = state();
  if (D && D.runs[run]) return D.runs[run];
  if (s.clones[run] && D) return D.runs[s.clones[run].template] || null;
  return null;
}
window.DEMO = {
  pageUrl: function (run, pdf, i) {
    var t = tplOf(run);
    if (!t || !pdf) return '';
    return BASE + 'data/' + t.dir + '/' + ((t.files || {})[pdf] || pdf) + '.pages/' + i + '.jpg';
  },
  pageUrlFromView: function (view, i) { return String(view) + '.pages/' + i + '.jpg'; },
  fileUrl: function (run, name) {
    var t = tplOf(run), s = state();
    if (t) return BASE + 'data/' + t.dir + '/' + ((t.files || {})[name] || name);
    var im = s.imports[run];
    if (im && im.pdf === name) return blobUrl('imp:' + run, im.b64) || '#';
    return '#';
  },
  titleExportUrl: function (run) {
    var ex = E(run).title_export || {};
    return 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ex, null, 2));
  },
  reset: function () { try { sessionStorage.removeItem(STORE_KEY); } catch (e) {} S = null; }
};

/* ---------- the Run page's "Try an address" list ---------- */
function tryList() {
  var main = document.querySelector('#tab-run .main'), live = document.getElementById('live');
  if (!main || !live) return;
  READY.then(function (d) {
    var box = document.createElement('div');
    box.className = 'sect'; box.id = 'tryBox';
    var n = d['try'].length;
    var what = n === 1 ? 'one sample property' : (n + ' sample properties');
    var h = '<div class="sect-h">Try an address<span class="prov">This demo runs on ' +
      what + '. Click ' + (n === 1 ? 'it' : 'one') +
      ' to fill the form, then press Run.</span></div><div class="trylist">';
    d['try'].forEach(function (t, i) {
      h += '<button type="button" class="tryrow" data-i="' + i + '"><b>' + t.address.replace(/</g, '&lt;') + '</b><span>' + t.city + ' · ' + pretty(t.county) + ' County</span></button>';
    });
    box.innerHTML = h + '</div>';
    live.parentNode.insertBefore(box, live.nextSibling);
    box.querySelectorAll('.tryrow').forEach(function (b) {
      b.onclick = function () {
        var t = d['try'][+b.dataset.i];
        document.getElementById('address').value = t.address;
        document.getElementById('city').value = t.city;
        if (typeof window.cCommit === 'function') window.cCommit(t.county);
        else { document.getElementById('county').value = t.county; }
        var st = document.getElementById('status'); if (st) st.textContent = 'Ready — press Run';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.getElementById('runBtn').focus();
      };
    });
  });
}
function styles() {
  var css = '.demo-pill{font:700 10.5px "Segoe UI",system-ui,sans-serif;letter-spacing:.06em;color:#9a6b00;background:#fdf6e3;border:1px solid #e8cf8a;border-radius:4px;padding:2px 7px;flex:0 0 auto}' +
    '.trylist{display:flex;gap:10px;flex-wrap:wrap}' +
    '.tryrow{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 14px;border:1px solid var(--rule,#e3e1da);border-radius:8px;background:#fff;cursor:pointer;text-align:left;font-weight:400;font-family:inherit}' +
    '.tryrow b{font-size:14px;color:#1c2733}.tryrow span{font-size:12px;color:#5a6875}.tryrow:hover{border-color:#2b4a6f}';
  var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { styles(); tryList(); });
else { styles(); tryList(); }
})();
