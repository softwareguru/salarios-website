// SG Tech Pulse 2026 — interacción de la landing.
// Tema, menú móvil, control de movimiento, scroll spy y sistema molecular.
(function () {

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let motionOn = !reduced;   // la controla el botón de la barra superior

  /* ── Interruptor claro / oscuro ── */
  (function () {
    const root = document.documentElement;
    const btn = document.getElementById("theme-toggle");
    const sysDark = window.matchMedia("(prefers-color-scheme: dark)");

    function current() {
      const stamped = root.getAttribute("data-theme");
      if (stamped) return stamped;
      return sysDark.matches ? "dark" : "light";
    }
    function paint() {
      const dark = current() === "dark";
      // el CSS decide qué etiqueta se ve, para no pisar el media query de móvil
      btn.classList.toggle("is-dark", dark);
      btn.setAttribute("aria-pressed", String(dark));
    }
    try {
      const saved = localStorage.getItem("tp-theme");
      if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
    } catch (e) { /* almacenamiento bloqueado: seguimos con el tema del sistema */ }

    btn.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("tp-theme", next); } catch (e) {}
      paint();
      document.querySelectorAll("canvas.swarm").forEach(drawSwarm);
      pulse.redraw();
    });
    sysDark.addEventListener("change", paint);
    paint();
  })();

  /* ── Revelado al entrar en pantalla ── */
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("in"), i * 70);
          io.unobserve(e.target);
        }
      });
    }, { threshold: .18 });
    document.querySelectorAll(".rise").forEach(el => io.observe(el));
  } else {
    document.querySelectorAll(".rise").forEach(el => el.classList.add("in"));
  }

  /* ── Enjambre del cuarto paso ── */
  function drawSwarm(cv) {
    const ctx = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const S = 300;
    cv.width = S * dpr; cv.height = S * dpr;
    ctx.scale(dpr, dpr);
    const palette = ["#6B3DFA", "#6B3DFA", "#BBA3FC", "#C4E833", "#FD655C"];
    // disposición determinista: mismo dibujo en cada carga
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    ctx.clearRect(0, 0, S, S);
    for (let i = 0; i < 78; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.pow(rnd(), .62) * 118;
      const x = S / 2 + Math.cos(a) * r;
      const y = S / 2 + Math.sin(a) * r * .82;
      const rad = 5 + rnd() * 13;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fillStyle = palette[Math.floor(rnd() * palette.length)];
      ctx.globalAlpha = .55 + rnd() * .45;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  document.querySelectorAll("canvas.swarm").forEach(drawSwarm);

  /* ── Panel animado: flotan, se enlazan y se ordenan en figuras ── */
  const pulse = (function () {
    const cv = document.getElementById("live-viz");
    if (!cv) return { redraw() {} };
    const ctx = cv.getContext("2d");
    const COLORS = ["#6B3DFA", "#6B3DFA", "#BBA3FC", "#C4E833", "#FD655C"];
    const N = 130;              // suficientes para leer estructura, pocas para enlazar a 60 fps
    const LINK = 86;            // radio de enlace, en px de CSS
    let W = 0, H = 0, dpr = 1, parts = [], raf = 0, running = false;
    let mode = "free", tMode = 0, shapeIdx = 0;

    let seed = 20260908;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    function measure() {
      const box = cv.getBoundingClientRect();
      W = Math.max(200, Math.round(box.width));
      H = Math.max(150, Math.round(box.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function build() {
      parts = Array.from({ length: N }, () => ({
        x: rnd() * W, y: rnd() * H,
        vx: (rnd() - .5) * .38, vy: (rnd() - .5) * .38,
        r: 2.4 + rnd() * 4.2,
        c: COLORS[Math.floor(rnd() * COLORS.length)],
        tx: 0, ty: 0
      }));
    }

    /* Figuras: cada una devuelve las posiciones destino de las N moléculas. */
    function shapeHex() {
      // anillos hexagonales concéntricos
      const cx = W / 2, cy = H / 2;
      const step = Math.min(W, H) / 9;
      const pts = [{ x: cx, y: cy }];
      for (let ring = 1; ring <= 6 && pts.length < N; ring++) {
        for (let side = 0; side < 6 && pts.length < N; side++) {
          for (let k = 0; k < ring && pts.length < N; k++) {
            const a1 = (Math.PI / 3) * side, a2 = (Math.PI / 3) * (side + 1);
            const x1 = cx + Math.cos(a1) * step * ring, y1 = cy + Math.sin(a1) * step * ring;
            const x2 = cx + Math.cos(a2) * step * ring, y2 = cy + Math.sin(a2) * step * ring;
            const t = k / ring;
            pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
          }
        }
      }
      return pts;
    }

    function shapeTriangle() {
      const size = Math.min(W, H) * .82;
      const cx = W / 2, cy = H / 2 + size * .08;
      const h = size * Math.sqrt(3) / 2;
      const A = { x: cx, y: cy - h * .62 };
      const B = { x: cx - size / 2, y: cy + h * .38 };
      const C = { x: cx + size / 2, y: cy + h * .38 };
      const pts = [];
      let rows = 15;
      for (let i = 0; i <= rows && pts.length < N; i++) {
        for (let j = 0; j <= i && pts.length < N; j++) {
          const u = i / rows, v = i === 0 ? 0 : j / i;
          const px = A.x + (B.x - A.x) * u + (C.x - B.x) * u * v;
          const py = A.y + (B.y - A.y) * u + (C.y - B.y) * u * v;
          pts.push({ x: px, y: py });
        }
      }
      return pts;
    }

    function shapeGrid() {
      const cols = Math.ceil(Math.sqrt(N * (W / H)));
      const rows = Math.ceil(N / cols);
      const mx = W * .12, my = H * .14;
      const gw = (W - mx * 2) / Math.max(1, cols - 1);
      const gh = (H - my * 2) / Math.max(1, rows - 1);
      const pts = [];
      for (let r = 0; r < rows && pts.length < N; r++)
        for (let c = 0; c < cols && pts.length < N; c++)
          pts.push({ x: mx + c * gw, y: my + r * gh });
      return pts;
    }

    function shapeRings() {
      const cx = W / 2, cy = H / 2;
      const maxR = Math.min(W, H) * .42;
      const pts = [];
      const rings = 4;
      for (let ring = 1; ring <= rings && pts.length < N; ring++) {
        const count = Math.round(N * ring / (rings * (rings + 1) / 2));
        const rad = maxR * ring / rings;
        for (let k = 0; k < count && pts.length < N; k++) {
          const a = (Math.PI * 2 * k) / count - Math.PI / 2;
          pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad * .92 });
        }
      }
      return pts;
    }

    const SHAPES = [shapeHex, shapeTriangle, shapeGrid, shapeRings];

    function assign() {
      const pts = SHAPES[shapeIdx % SHAPES.length]();
      for (let i = 0; i < parts.length; i++) {
        const t = pts[i % pts.length];
        parts[i].tx = t.x; parts[i].ty = t.y;
      }
      shapeIdx++;
    }

    function step(dt) {
      tMode += dt;
      if (mode === "free" && tMode > 4200) { mode = "shape"; tMode = 0; assign(); }
      else if (mode === "shape" && tMode > 4600) { mode = "free"; tMode = 0; }

      for (const p of parts) {
        if (mode === "shape") {
          p.x += (p.tx - p.x) * .055;
          p.y += (p.ty - p.y) * .055;
        } else {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 6 || p.x > W - 6) p.vx *= -1;
          if (p.y < 6 || p.y > H - 6) p.vy *= -1;
          p.x = Math.max(6, Math.min(W - 6, p.x));
          p.y = Math.max(6, Math.min(H - 6, p.y));
        }
      }
    }

    function render() {
      ctx.clearRect(0, 0, W, H);
      // enlaces por proximidad
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i];
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          const d = Math.sqrt(d2);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = a.c;
          ctx.globalAlpha = (1 - d / LINK) * (mode === "shape" ? .5 : .28);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      // moléculas
      for (const p of parts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = .9;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    let last = 0;
    function loop(now) {
      if (!running) return;
      const dt = last ? Math.min(now - last, 48) : 16;
      last = now;
      step(dt);
      render();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true; last = 0;
      raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    function redraw() { measure(); build(); render(); }

    measure(); build();

    if (reduced) {
      // sin movimiento: se muestra ya ordenado en la retícula hexagonal
      mode = "shape"; assign();
      for (const p of parts) { p.x = p.tx; p.y = p.ty; }
      render();
    } else {
      render();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((es) => {
          es.forEach(e => (e.isIntersecting && motionOn) ? start() : stop());
        }, { threshold: .12 }).observe(cv);
      } else { start(); }
      document.addEventListener("visibilitychange", () => {
        (document.hidden || !motionOn) ? stop() : start();
      });
    }

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { measure(); build(); if (!running) render(); }, 200);
    });

    return { redraw, start, stop, render };
  })();

  /* ── Pulso ambiente del hero ── */
  const heroPulse = (function () {
    const cv = document.getElementById("pulse-canvas");
    const ctx = cv.getContext("2d");
    let w, h, dpr, nodes = [], raf;

    const COLORS = ["#6B3DFA", "#BBA3FC", "#C4E833", "#FD655C"];

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.offsetWidth; h = cv.offsetHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function build() {
      const count = w < 700 ? 16 : 30;
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .22,
        vy: (Math.random() - .5) * .22,
        r: 3 + Math.random() * 9,
        c: COLORS[Math.floor(Math.random() * COLORS.length)]
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -30) n.x = w + 30; if (n.x > w + 30) n.x = -30;
        if (n.y < -30) n.y = h + 30; if (n.y > h + 30) n.y = -30;
      }
      // enlaces
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 132) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = a.c;
            ctx.globalAlpha = (1 - d / 132) * .2;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        }
      }
      // nodos
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.c;
        ctx.globalAlpha = .5;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (!motionOn) return;
      size(); build(); cancelAnimationFrame(raf); frame();
    }
    function stop() { cancelAnimationFrame(raf); ctx && ctx.clearRect(0, 0, w, h); }
    if (motionOn) start(); else { size(); }
    let t; window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(start, 180); });
    return { start, stop };
  })();

  /* ── Pausar / reanudar el movimiento (WCAG 2.2.2 · Nielsen 3) ── */
  (function () {
    const btn = document.getElementById("motion-toggle");
    if (!btn) return;
    if (reduced) { btn.classList.add("is-paused"); }
    function apply() {
      btn.classList.toggle("is-paused", !motionOn);
      btn.setAttribute("aria-label", motionOn ? "Pausar las animaciones" : "Reanudar las animaciones");
      btn.setAttribute("aria-pressed", String(!motionOn));
      if (motionOn) { heroPulse.start(); pulse.start(); }
      else { heroPulse.stop(); pulse.stop(); pulse.render(); }
    }
    btn.addEventListener("click", () => { motionOn = !motionOn; apply(); });
    apply();
  })();
  /* ── Menú de navegación en móvil (Nielsen 3, 7) ── */
  (function () {
    const btn = document.getElementById("nav-toggle");
    const menu = document.getElementById("nav-menu");
    if (!btn || !menu) return;
    function close() {
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Abrir el menú de navegación");
    }
    function open() {
      menu.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Cerrar el menú de navegación");
    }
    btn.addEventListener("click", () =>
      menu.classList.contains("is-open") ? close() : open());
    // cerrar al elegir destino, con Escape, o al tocar fuera
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    document.addEventListener("click", e => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) close();
    });
    window.addEventListener("resize", () => { if (window.innerWidth > 860) close(); });
    close();
  })();

  /* ── Sección activa en el nav (Nielsen 1) ── */
  (function () {
    const links = [...document.querySelectorAll('.nav-links a[href^="#"]')]
      .filter(a => a.getAttribute("href").length > 1 && !a.classList.contains("btn"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map();
    links.forEach(a => {
      const el = document.querySelector(a.getAttribute("href"));
      if (el) map.set(el, a);
    });
    if (!map.size) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(a => a.classList.remove("is-current"));
          const a = map.get(en.target);
          if (a) { a.classList.add("is-current"); a.setAttribute("aria-current", "true"); }
          links.filter(x => x !== a).forEach(x => x.removeAttribute("aria-current"));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, el) => io.observe(el));
  })();


})();