(() => {
  const source = document.createElement('script');
  source.src = new URL('./globe-data.js', document.currentScript.src).href;
  const ready = new Promise((resolve, reject) => { source.onload = resolve; source.onerror = reject; });
  document.head.appendChild(source);
  const TAU = Math.PI * 2;
  const rgb = hex => { const h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  window.Globe = class {
    constructor(canvas, options = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.options = { variant: 'orbit', color: '#4999ff', pointColor: '#7abbff', scale: .4, centerX: .5, centerY: .5, tilt: .12, rotation: 1.6, arcs: true, grid: true, ...options };
      this.color = rgb(this.options.color); this.pointColor = rgb(this.options.pointColor);
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.paused = false; this.dead = false; this.pointer = { x: 0, y: 0 }; this.smooth = { x: 0, y: 0 };
      this.resize = () => {
        const rect = canvas.getBoundingClientRect(); this.w = rect.width; this.h = rect.height;
        this.dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(this.w * this.dpr); canvas.height = Math.round(this.h * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        if (this.points && (this.reduced || this.paused)) this.draw(this.time || 0);
      };
      this.observer = new ResizeObserver(this.resize); this.observer.observe(canvas);
      this.move = e => { const b = canvas.getBoundingClientRect(); this.pointer.x = (e.clientX - b.left) / b.width - .5; this.pointer.y = (e.clientY - b.top) / b.height - .5; };
      this.leave = () => { this.pointer.x = 0; this.pointer.y = 0; };
      canvas.addEventListener('pointermove', this.move); canvas.addEventListener('pointerleave', this.leave);
      this.intersection = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; }); this.intersection.observe(canvas); this.visible = true;
      ready.then(() => {
        if (this.dead) return;
        this.points = []; const p = window.FEE_GLOBE_POINTS;
        for (let i = 0; i < p.length; i += 2) {
          const lon = p[i] * Math.PI / 180, lat = p[i + 1] * Math.PI / 180;
          this.points.push({x: Math.cos(lat) * Math.sin(lon), y: -Math.sin(lat), z: Math.cos(lat) * Math.cos(lon), bright: .65 + .35 * Math.sin(i * 1.738) ** 2});
        }
        this.resize(); this.time = 0; this.last = performance.now(); this.draw(0);
        const frame = now => {
          if (this.dead) return;
          const delta = Math.min((now - this.last) / 1000, .05); this.last = now;
          if (!this.paused && !document.hidden && this.visible) {
            if (!this.reduced) this.time += delta;
            this.draw(this.time);
          }
          if (!this.reduced) this.frame = requestAnimationFrame(frame);
        };
        frame(performance.now()); canvas.dataset.ready = 'true';
      }).catch(() => { canvas.dataset.error = 'true'; });
    }
    setPaused(value) { this.paused = value; if (this.reduced && this.points) this.draw(this.time); }
    destroy() { this.dead = true; cancelAnimationFrame(this.frame); this.observer.disconnect(); this.intersection.disconnect(); this.canvas.removeEventListener('pointermove', this.move); this.canvas.removeEventListener('pointerleave', this.leave); }
    draw(t) {
      const c = this.ctx, o = this.options, W = this.w, H = this.h;
      if (!W || !H) return;
      c.clearRect(0, 0, W, H);
      const light = o.variant === 'daylight', signal = o.variant === 'signal';
      const r = Math.min(W, H) * o.scale, cx = W * o.centerX, cy = H * o.centerY;
      this.smooth.x += (this.pointer.x - this.smooth.x) * .035; this.smooth.y += (this.pointer.y - this.smooth.y) * .035;
      const rot = o.rotation + (this.reduced ? 0 : t * .052) + this.smooth.x * .18;
      const tilt = o.tilt + this.smooth.y * .09;
      const cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
      const color = this.color.join(','), point = this.pointColor.join(',');
      const project = (x, y, z, radius = r) => {
        const nx = x * cr + z * sr, nz = z * cr - x * sr;
        const ny = y * ct - nz * st, zz = y * st + nz * ct;
        return [cx + nx * radius, cy + ny * radius, zz];
      };
      let glow = c.createRadialGradient(cx, cy, r * .78, cx, cy, r * 1.22);
      glow.addColorStop(0, `rgba(${color},0)`); glow.addColorStop(.45, `rgba(${color},${light ? .07 : .09})`); glow.addColorStop(1, `rgba(${color},0)`);
      c.fillStyle = glow; c.beginPath(); c.arc(cx, cy, r * 1.22, 0, TAU); c.fill();
      const sphere = c.createRadialGradient(cx - r * .35, cy - r * .4, 0, cx, cy, r);
      if (light) { sphere.addColorStop(0, '#edf4ff'); sphere.addColorStop(.65, '#dbe9ff'); sphere.addColorStop(1, '#acc9fa'); }
      else { sphere.addColorStop(0, '#0d1d39'); sphere.addColorStop(.7, '#07152d'); sphere.addColorStop(1, '#020715'); }
      c.fillStyle = sphere; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
      c.strokeStyle = `rgba(${color},${light ? .25 : .4})`; c.lineWidth = .7; c.stroke();
      if (o.grid) {
        c.strokeStyle = `rgba(${color},${signal ? .19 : light ? .15 : .095})`; c.lineWidth = .55;
        const trace = fn => { c.beginPath(); let pen = false; for (let i = 0; i <= 180; i++) { const a = fn(i / 180 * TAU); const p = project(...a); if (p[2] > -.03) { if (pen) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); pen = true; } else pen = false; } c.stroke(); };
        for (let lat = -60; lat <= 60; lat += 30) { const l = lat * Math.PI / 180; trace(a => [Math.cos(l) * Math.sin(a), -Math.sin(l), Math.cos(l) * Math.cos(a)]); }
        for (let lon = 0; lon < 180; lon += 30) { const l = lon * Math.PI / 180; trace(a => [Math.cos(a) * Math.sin(l), -Math.sin(a), Math.cos(a) * Math.cos(l)]); }
      }
      c.fillStyle = `rgb(${point})`;
      for (let i = 0; i < this.points.length; i++) {
        const v = this.points[i], p = project(v.x, v.y, v.z);
        if (p[2] < -.05) continue;
        const depth = Math.max(0, p[2]);
        const radius = Math.max(.48, r / 250 * (.5 + .45 * depth)) * (signal ? .8 : 1);
        c.globalAlpha = (.24 + depth * .72) * v.bright;
        c.beginPath(); c.arc(p[0], p[1], radius, 0, TAU); c.fill();
        if (!light && i % 91 === 0 && depth > .2) {
          c.globalAlpha = .13 * depth; c.beginPath(); c.arc(p[0], p[1], radius * 5, 0, TAU); c.fill();
          c.globalAlpha = .8; c.fillStyle = '#ddf5ff'; c.beginPath(); c.arc(p[0], p[1], radius, 0, TAU); c.fill(); c.fillStyle = `rgb(${point})`;
        }
      }
      c.globalAlpha = 1;
      if (o.arcs) {
        for (let n = 0; n < 2; n++) {
          const rr = r * (1.15 + n * .08), angle = -.36 + n * 1.05;
          c.save(); c.translate(cx, cy); c.rotate(angle);
          c.strokeStyle = `rgba(${color},${light ? .16 : .22})`; c.lineWidth = .7;
          c.beginPath(); c.ellipse(0, 0, rr, rr * .31, 0, 0, TAU); c.stroke();
          const a = t * (.22 + n * .06) + n * 2.5;
          const x = Math.cos(a) * rr, y = Math.sin(a) * rr * .31;
          const beam = c.createRadialGradient(x,y,0,x,y,12);beam.addColorStop(0,`rgba(${color},.6)`);beam.addColorStop(1,`rgba(${color},0)`);
          c.fillStyle=beam;c.beginPath();c.arc(x,y,12,0,TAU);c.fill();
          c.fillStyle = light ? '#225cf6' : '#d6f6ff'; c.beginPath(); c.arc(x,y,2.2,0,TAU);c.fill(); c.restore();
        }
      }
      // A moving meridian gives the technical concept a slow scanning rhythm.
      if (signal) {
        const lon = t * .15, coords = [];
        for (let i = 0; i <= 100; i++) { const lat = -Math.PI / 2 + i * Math.PI / 100; coords.push(project(Math.cos(lat)*Math.sin(lon),-Math.sin(lat),Math.cos(lat)*Math.cos(lon))); }
        c.strokeStyle=`rgba(${color},.7)`;c.lineWidth=1;c.beginPath();let pen=false;
        for (const p of coords) {if(p[2]>0){if(pen)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);pen=true;}else pen=false;}c.stroke();
      }
      const mark = project(Math.cos(.627) * Math.sin(-1.375), -Math.sin(.627), Math.cos(.627) * Math.cos(-1.375));
      if (mark[2] > .15) {
        const pulse = this.reduced ? .5 : (t * .55) % 1;
        c.strokeStyle=`rgba(${color},${(1-pulse)*.8})`;c.lineWidth=1;c.beginPath();c.arc(mark[0],mark[1],5+pulse*18,0,TAU);c.stroke();
        c.fillStyle=light?'#144fef':'#e7faff';c.beginPath();c.arc(mark[0],mark[1],3,0,TAU);c.fill();
      }
    }
  };
})();
