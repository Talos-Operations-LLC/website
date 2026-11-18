/* Home page: the dust globe, the panels and the two forms. */
/* ---------- the dust ---------- */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = new URLSearchParams(location.search).get('q');      // ?q=lite or ?q=still to test the governor
  if (!reduced) root.classList.add('motion');

  const cvs = document.getElementById('dust'), ctx = cvs.getContext('2d');
  const dock = document.getElementById('main');
  const panels = [...dock.querySelectorAll('.panel')];
  const NAMES = ['home', 'talk', 'early-access'];
  const D2R = Math.PI / 180, PERSP = 4, DUR = 1.55, SCAT = .55, LV = 6, NB = LV * 2;

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, S = 1, phone = false;
  let quality = q === 'lite' ? 1 : 2, still = q === 'still';
  let N = 0, TG = null, cur = 0, morph = null, GEO = null, t0 = 0, raf = 0, last = 0, startMs = 0, samples = [];
  let tmx = 0, tmy = 0, pmx = 0, pmy = 0;
  let CX, CY, CZ, CW, CC, FX, FY, FZ, FW, FC, SX, SY, SZ, DL, LS, PH, PH2, FQ, SZ0, BUF, cnt;

  /* seeded random, so every load draws the same shapes */
  let seed = 7;
  const R = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

  /* every shape is N points: x, y, z, weight (brightness), colour (0 white, 1 blue), loose (drifting dust) */
  function makeShape(n, fill) {
    const P = [];
    const add = (x, y, z, w = 1, c = 0, l = 0) => P.push(x, y, z, w, c, l);
    const line = (a, b, k, w = 1, c = 0, j = .006) => { for (let i = 0; i < k; i++) { const t = R(); add(a[0] + (b[0] - a[0]) * t + (R() - .5) * j, a[1] + (b[1] - a[1]) * t + (R() - .5) * j, a[2] + (b[2] - a[2]) * t + (R() - .5) * j, w, c); } };
    const ball = (o, r, k, w = 1, c = 0) => { for (let i = 0; i < k; i++) { const d = norm([gauss(), gauss(), gauss()]); add(o[0] + d[0] * r, o[1] + d[1] * r, o[2] + d[2] * r, w, c); } };
    const loose = (k, rx, ry, rz) => { for (let i = 0; i < k; i++) add((R() * 2 - 1) * rx, (R() * 2 - 1) * ry, (R() * 2 - 1) * rz, .5, 0, 1); };
    fill({ add, line, ball, loose, k: n / 3000 });
    const M = P.length / 6, L = Math.max(M, n), idx = new Uint32Array(L);
    for (let i = 0; i < L; i++) idx[i] = i < M ? i : (R() * M) | 0;
    for (let i = L - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0, t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    const o = { x: new Float32Array(n), y: new Float32Array(n), z: new Float32Array(n), w: new Float32Array(n), c: new Uint8Array(n), l: new Uint8Array(n) };
    for (let i = 0; i < n; i++) { const j = idx[i] * 6, jt = i >= M ? .01 : 0; o.x[i] = P[j] + (R() - .5) * jt; o.y[i] = P[j + 1] + (R() - .5) * jt; o.z[i] = P[j + 2] + (R() - .5) * jt; o.w[i] = P[j + 3]; o.c[i] = P[j + 4]; o.l[i] = P[j + 5]; }
    return o;
  }

  /* 1. the globe, with a pin in North Carolina (the logo, in dust) */
  const ll = (lon, lat, r = 1) => { const a = lon * D2R, b = lat * D2R; return [Math.cos(b) * Math.sin(a) * r, Math.sin(b) * r, Math.cos(b) * Math.cos(a) * r]; };
  function genGlobe(n) {
    return makeShape(n, ({ add, line, ball, loose, k }) => {
      if (GEO) {
        const Lp = [], w = GEO.world, u = GEO.us;
        for (let i = 0; i < w.length; i += 2) Lp.push(w[i] / 10, w[i + 1] / 10);
        for (let i = 0; i < u.length; i += 2) {
          const lon = u[i] / 100, lat = u[i + 1] / 100;
          if (inPoly(lon, lat, NC)) { for (let r = 0; r < 3; r++) { const p = ll(lon + (R() - .5) * .3, lat + (R() - .5) * .3); add(p[0], p[1], p[2], 1, 1); } }
          else if (i % 18 === 0) Lp.push(lon, lat);
        }
        // the globe only sways about the Atlantic, so land on the far side is never seen: skip it
        for (let j = 0; j < Lp.length; j += 2) { const lon = Lp[j]; if (lon < -175 || lon > 42) continue; const p = ll(lon + (R() - .5) * .45, Lp[j + 1] + (R() - .5) * .45); add(p[0], p[1], p[2], .9, 0); }
      }
      const ng = Math.round(420 * k);
      for (let i = 0; i < ng; i++) {
        const p = R() < .55 ? ll(((R() * 12) | 0) * 30, (R() * 2 - 1) * 84) : ll(R() * 360, [-60, -30, 0, 30, 60][(R() * 5) | 0]);
        add(p[0], p[1], p[2], .26, 0);
      }
      for (let i = 0, ns = Math.round(120 * k); i < ns; i++) { const d = norm([gauss(), gauss(), gauss()]); add(d[0], d[1], d[2], .12, 0); }
      const lon = -79, lat = 35.6, a = lon * D2R, b = lat * D2R, nrm = ll(lon, lat);
      const east = [Math.cos(a), 0, -Math.sin(a)], north = [-Math.sin(b) * Math.sin(a), Math.cos(b), -Math.sin(b) * Math.cos(a)];
      const dir = norm([nrm[0] * .5 + east[0] * .62 + north[0] * .62, nrm[1] * .5 + east[1] * .62 + north[1] * .62, nrm[2] * .5 + east[2] * .62 + north[2] * .62]);
      const tip = [nrm[0] * .99, nrm[1] * .99, nrm[2] * .99], end = [nrm[0] + dir[0] * .5, nrm[1] + dir[1] * .5, nrm[2] + dir[2] * .5];
      line(tip, end, Math.round(110 * k), 1, 1, .008);
      ball([nrm[0] + dir[0] * .585, nrm[1] + dir[1] * .585, nrm[2] + dir[2] * .585], .085, Math.round(170 * k), 1, 1);
      for (let i = 0, nr = Math.round(70 * k); i < nr; i++) { const t = R() * Math.PI * 2, r = .075; add(nrm[0] + (east[0] * Math.cos(t) + north[0] * Math.sin(t)) * r, nrm[1] + (east[1] * Math.cos(t) + north[1] * Math.sin(t)) * r, nrm[2] + (east[2] * Math.cos(t) + north[2] * Math.sin(t)) * r, .9, 1); }
      for (let i = 0, nlo = Math.round(150 * k); i < nlo; i++) { const d = norm([gauss(), gauss(), gauss()]), r = 1.15 + R() * .65; add(d[0] * r, d[1] * r, d[2] * r, .5, 0, 1); }
    });
  }

  /* North Carolina's outline, used to light the state blue on the globe */
  const NC = [[-76.02,36.55],[-76.92,36.55],[-77.9,36.54],[-79,36.54],[-80,36.54],[-80.9,36.56],[-81.68,36.59],[-81.93,36.3],[-82.03,36.13],[-82.41,36.07],[-82.62,36],[-82.96,35.8],[-83.25,35.7],[-83.5,35.56],[-83.95,35.46],[-84.04,35.28],[-84.29,35.22],[-84.32,34.99],[-83.62,34.99],[-83.11,35],[-82.78,35.08],[-82.4,35.2],[-81.97,35.19],[-81.04,35.15],[-80.93,35.1],[-80.8,34.82],[-79.67,34.81],[-78.54,33.85],[-78.2,33.92],[-77.96,33.84],[-77.88,34.1],[-77.7,34.3],[-77.4,34.5],[-77.13,34.63],[-76.8,34.7],[-76.53,34.64],[-76.33,34.97],[-76.48,35.25],[-76.03,35.42],[-75.75,35.7],[-75.9,35.95],[-76.02,36.2]];
  function inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  const SH = [
    { gen: genGlobe, rot: t => [1.2 + Math.sin(t * .13) * .42, .5], s: 1, oy: -.06, dk: .9 },
  ];

  function layout() {
    W = innerWidth; H = innerHeight; phone = W < 761;
    dpr = Math.min(devicePixelRatio || 1, quality >= 2 ? 2 : 1);
    cvs.width = (W * dpr) | 0; cvs.height = (H * dpr) | 0; cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (phone) { const open = dock.classList.contains('open'); cx = W * .5; cy = H * (open ? .27 : .37); S = Math.min(W * .37, H * .21) * (open ? .8 : 1); }
    else { cx = W * .37; cy = H * .47; S = Math.min(W * .2, H * .3); }
  }

  function alloc() {
    const f = () => new Float32Array(N);
    CX = f(); CY = f(); CZ = f(); CW = f(); CC = new Uint8Array(N); FX = f(); FY = f(); FZ = f(); FW = f(); FC = new Uint8Array(N);
    SX = f(); SY = f(); SZ = f(); DL = f(); LS = f(); PH = f(); PH2 = f(); FQ = f(); SZ0 = f();
    for (let i = 0; i < N; i++) {
      const d = norm([gauss(), gauss() + .35, gauss()]), m = .45 + R();
      SX[i] = d[0] * m; SY[i] = d[1] * m; SZ[i] = d[2] * m;
      LS[i] = .03 + R() * .05; PH[i] = R(); PH2[i] = R() * 6.28; FQ[i] = .6 + R() * 2.2; SZ0[i] = .8 + R() * .75;
    }
    BUF = Array.from({ length: NB }, () => new Float32Array(N * 3)); cnt = new Uint32Array(NB);
  }

  function frame(ms) {
    const t = ms / 1000, tt = t - t0;
    pmx += (tmx - pmx) * .045; pmy += (tmy - pmy) * .045;
    const sh = SH[cur], T = TG[cur], r = sh.rot(tt), a = r[0] + pmx * .22, b = r[1] + pmy * .08;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), s = sh.s, oy = sh.oy;
    const dk = morph ? morph.dk + (sh.dk - morph.dk) * Math.min(1, (t - morph.t0) / 1.2) : sh.dk;
    let mt = -1;
    if (morph) { mt = t - morph.t0; if (mt > DUR + .5) { morph = null; mt = -1; } }
    ctx.clearRect(0, 0, W, H); cnt.fill(0);
    const step = quality < 2 ? 2 : 1;
    for (let i = 0; i < N; i += step) {
      let x = T.x[i] * s, y = T.y[i] * s, z = T.z[i] * s, w = T.w[i], c = T.c[i];
      if (T.l[i]) { const ph = (tt * LS[i] + PH[i]) % 1; y += (ph - .5) * .9 * s; w *= Math.sin(ph * Math.PI); }
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      let vx = x1, vy = y * cb - z1 * sb + oy, vz = y * sb + z1 * cb;
      if (mt >= 0) {
        let e = (mt - DL[i]) / DUR; e = e < 0 ? 0 : e > 1 ? 1 : e; e = e < .5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2;
        const qq = Math.sin(e * Math.PI) * SCAT;
        vx = FX[i] + (vx - FX[i]) * e + SX[i] * qq; vy = FY[i] + (vy - FY[i]) * e + SY[i] * qq; vz = FZ[i] + (vz - FZ[i]) * e + SZ[i] * qq;
        w = FW[i] + (w - FW[i]) * e; if (e < .5) c = FC[i];
      }
      CX[i] = vx; CY[i] = vy; CZ[i] = vz; CW[i] = w; CC[i] = c;
      const f = PERSP / (PERSP - vz), px = cx + vx * f * S, py = cy - vy * f * S;
      if (px < -4 || py < -4 || px > W + 4 || py > H + 4) continue;
      const dz = Math.min(1, Math.max(0, (vz + 1.1) / 2.2));
      const al = w * (1 - dk * (1 - dz)) * (.72 + .28 * Math.sin(tt * FQ[i] + PH2[i]));
      if (al < .03) continue;
      const k = c * LV + (al >= 1 ? LV - 1 : (al * LV) | 0), o = cnt[k] * 3, B = BUF[k];
      B[o] = px; B[o + 1] = py; B[o + 2] = SZ0[i] * f * (step === 2 ? 1.25 : 1); cnt[k]++;
    }
    for (let k = 0; k < NB; k++) {
      const n = cnt[k]; if (!n) continue;
      ctx.fillStyle = (k >= LV ? 'rgba(118,146,255,' : 'rgba(240,240,236,') + ((k % LV + .7) / LV).toFixed(3) + ')';
      const B = BUF[k];
      for (let j = 0, e = n * 3; j < e; j += 3) { const z = B[j + 2]; ctx.fillRect(B[j] - z * .5, B[j + 1] - z * .5, z, z); }
    }
  }

  /* the governor: a machine that can't keep up steps down to lite (half the dust, 1x), then still (one frame) */
  function govern(ms, dt) {
    if (ms - startMs < 1200 || dt > 250) return;
    samples.push(dt); if (samples.length < 20) return;
    const m = samples.sort((x, y) => x - y)[10]; samples = [];
    if (m > 70 || (quality === 1 && m > 34)) { still = true; root.dataset.quality = 'still'; morph = null; frame(performance.now()); }
    else if (m > 34 && quality === 2) { quality = 1; root.dataset.quality = 'lite'; layout(); }
  }
  function loop(ms) {
    raf = 0; if (still || reduced) return;
    if (last) govern(ms, ms - last); last = ms;
    frame(ms); raf = requestAnimationFrame(loop);
  }
  const drawOnce = () => { morph = null; frame(performance.now()); };

  function morphTo(k, intro) {
    if (!TG) { cur = k; return; }
    if (k === cur && !intro) return;
    if (reduced || still) { cur = k; drawOnce(); return; }
    const now = performance.now() / 1000;
    if (intro) { for (let i = 0; i < N; i++) { const d = norm([gauss(), gauss(), gauss()]), r = 1.6 + R() * 1.6; FX[i] = d[0] * r; FY[i] = d[1] * r * .6; FZ[i] = d[2] * r; FW[i] = 0; FC[i] = 0; DL[i] = R() * .5; } }
    else { FX.set(CX); FY.set(CY); FZ.set(CZ); FW.set(CW); FC.set(CC); for (let i = 0; i < N; i++) DL[i] = Math.random() * .45; }
    morph = { t0: now, dk: SH[cur].dk }; cur = k;
  }

  /* panels, driven by the URL hash so Back works */
  const nameFromHash = () => { const h = location.hash.slice(1); return NAMES.includes(h) ? h : 'home'; };
  function show(name, first) {
    let active;
    panels.forEach(p => { const on = p.dataset.panel === name; p.classList.toggle('on', on); p.hidden = !on; if (on) active = p; });
    dock.classList.toggle('open', name !== 'home');
    if (phone && TG) layout();
    [...active.children].forEach((el, i) => el.style.setProperty('--i', i));
    if (!first) { dock.style.setProperty('--base', '160ms'); const h = active.querySelector('h2'); if (h) h.focus({ preventScroll: true }); }
  }
  addEventListener('hashchange', () => show(nameFromHash()));
  addEventListener('keydown', e => { if (e.key === 'Escape' && nameFromHash() !== 'home') location.hash = ''; });
  /* the forms post to Netlify Forms in the background; without script they post the normal way */
  const THANKS = { talk: "Sent. We'll write back soon.", 'early-access': "You're on the list. We'll reach out to set up access." };
  document.querySelectorAll('.form').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    const note = f.querySelector('.sent'), btn = f.querySelector('button[type=submit]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…'; note.textContent = '';
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() });
      if (!r.ok) throw new Error(String(r.status));
      const done = document.createElement('p');
      done.className = 'done'; done.setAttribute('role', 'status'); done.tabIndex = -1;
      done.textContent = THANKS[f.getAttribute('name')] || 'Sent.';
      f.replaceWith(done); done.focus({ preventScroll: true });
    } catch {
      btn.disabled = false; btn.textContent = label;
      note.innerHTML = 'That didn’t send. Email <a class="u" href="mailto:info@talosoperations.com">info@talosoperations.com</a>.';
    }
  }));
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; tmx = (e.clientX / W - .5) * 2; tmy = (e.clientY / H - .5) * 2; }, { passive: true });
  addEventListener('resize', () => { layout(); if (still || reduced) drawOnce(); });

  /* a reveal must never leave the page blank: if the rise animation hasn't run, drop it */
  setTimeout(() => { const tag = document.querySelector('.tag'); if (tag && +getComputedStyle(tag).opacity < .99) root.classList.remove('motion'); }, 4200);

  const first = nameFromHash();
  show(first, true);
  if (first !== 'home') dock.style.setProperty('--base', '700ms');
  layout();

  fetch('/assets/data/hero-geometry.json').then(r => r.json()).catch(() => null).then(g => {
    GEO = g; N = phone ? 3600 : 9000;
    alloc(); TG = SH.map(sh => sh.gen(N));
    t0 = performance.now() / 1000; startMs = performance.now();
    cur = 0; morphTo(0, true);
    if (reduced || still) drawOnce(); else raf = requestAnimationFrame(loop);
  });
})();
