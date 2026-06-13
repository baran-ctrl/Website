/* =========================================================
   Bahamut Games — interactions & scroll-driven animation
   Stack: GSAP + ScrollTrigger + MotionPathPlugin + Lenis
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width:768px)").matches;

  /* ---------- Game data (links & images preserved 1:1) ---------- */
  const GAMES = [
    {
      title: "Homeless Life Simulator",
      cover: "images/hls.png",
      type: "Simulation",
      rarity: "Legendary",
      desc: "Survive the streets, scavenge, hustle and rebuild your life from rock bottom.",
      steam: "https://store.steampowered.com/app/3845420/Homeless_Experience_Simulator/"
    },
    {
      title: "Fisher Idle",
      cover: "images/fisherIdle.jpg",
      type: "Idle",
      rarity: "Rare",
      desc: "Cast, catch and chill — a cozy idle fishing adventure across sunny shores.",
      steam: "https://store.steampowered.com/app/3449840/Fisher_Idle/"
    },
    {
      title: "Game Store Simulator",
      cover: "images/gss.jpg",
      type: "Simulation",
      rarity: "Rare",
      desc: "Run your own game shop: stock the shelves, serve customers, build an empire.",
      steam: "https://store.steampowered.com/app/2598930/Game_Store_Simulator/"
    },
    {
      title: "Only One Sword",
      cover: "images/oneSword.jpg",
      type: "Action",
      rarity: "Epic",
      desc: "One blade, endless foes. Master a single sword in a stylized roguelike arena.",
      steam: "https://store.steampowered.com/app/3111570/Only_One_Sword/"
    }
  ];

  const STEAM_ICON =
    '<svg class="steam-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.7 0 .6 4.8.03 10.95l6.45 2.67a3.4 3.4 0 0 1 1.9-.59h.17l2.87-4.16v-.06a4.55 4.55 0 1 1 4.55 4.55h-.1l-4.1 2.93v.14a3.42 3.42 0 0 1-6.78.66L.18 15.2A12 12 0 1 0 12 0ZM7.54 18.2l-1.48-.62a2.57 2.57 0 0 0 4.74-.18 2.56 2.56 0 0 0-1.4-3.35 2.56 2.56 0 0 0-1.95-.02l1.53.63a1.89 1.89 0 1 1-1.45 3.49l.01.05Zm10.49-9.1a3.03 3.03 0 1 0-6.06 0 3.03 3.03 0 0 0 6.06 0Zm-5.3 0a2.28 2.28 0 1 1 4.56 0 2.28 2.28 0 0 1-4.56 0Z"/></svg>';

  /* ---------- Build cards ---------- */
  const deck = document.getElementById("deck");
  if (deck) {
    GAMES.forEach((g) => {
      const card = document.createElement("article");
      card.className = "card pre";
      card.dataset.rarity = g.rarity;
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-top">
            <span class="card-name">${g.title}</span>
            <span class="card-type type-${g.type}">${g.type}</span>
          </div>
          <div class="card-art">
            <img src="${g.cover}" alt="${g.title} cover art" loading="lazy" />
            <span class="card-rarity"><i class="gem"></i>${g.rarity}</span>
          </div>
          <p class="card-desc">${g.desc}</p>
          <div class="card-foot">
            <a class="card-cta" href="${g.steam}" target="_blank" rel="noopener">${STEAM_ICON}<span>Play on Steam</span></a>
          </div>
        </div>
        <div class="card-holo"></div>
        <div class="card-glare"></div>`;
      deck.appendChild(card);
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Loader ---------- */
  const loader = document.getElementById("loader");
  function hideLoader() {
    if (!loader) return;
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 700);
  }
  window.addEventListener("load", () => setTimeout(hideLoader, prefersReduced ? 200 : 1100));
  // safety net
  setTimeout(hideLoader, 4000);

  /* ---------- Nav scrolled state ---------- */
  const nav = document.getElementById("nav");
  function onScrollNav() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* =========================================================
     Sound effects (Web Audio, synthesized — no files needed)
     Default OFF, persisted in localStorage.
     ========================================================= */
  const SFX_KEY = "bahamut-sfx";
  let sfxOn = localStorage.getItem(SFX_KEY) === "on";
  let actx = null;
  function ensureCtx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === "suspended") actx.resume();
    return actx;
  }
  function fireSound() {
    if (!sfxOn) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    const dur = 0.55;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1800, ctx.currentTime);
    lp.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    noise.connect(lp).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + dur);
  }
  function sparkSound() {
    if (!sfxOn) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    [880, 1320, 1760].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.06;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  }
  let lastHover = 0;
  function hoverSound() {
    if (!sfxOn) return;
    const now = performance.now();
    if (now - lastHover < 60) return; // throttle rapid enters
    lastHover = now;
    const ctx = ensureCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.13);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.14);
  }
  function thudSound() {
    if (!sfxOn) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(180, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.26, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.24);
  }
  function boomSound() {
    if (!sfxOn) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    const dur = 0.32;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(900, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + dur);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.4, ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    noise.connect(bp).connect(ng).connect(ctx.destination);
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + dur);
    og.gain.setValueAtTime(0.3, ctx.currentTime);
    og.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(og).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + dur);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  const soundBtn = document.getElementById("soundToggle");
  function syncSoundBtn() {
    if (!soundBtn) return;
    soundBtn.setAttribute("aria-pressed", String(sfxOn));
    soundBtn.querySelector(".sound-ico").textContent = sfxOn ? "🔊" : "🔇";
  }
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      sfxOn = !sfxOn;
      localStorage.setItem(SFX_KEY, sfxOn ? "on" : "off");
      syncSoundBtn();
      if (sfxOn) {
        ensureCtx();
        sparkSound();
      }
    });
    syncSoundBtn();
  }

  /* Hover blips on buttons & cards */
  document
    .querySelectorAll(".btn, .card, .card-cta, .social, .nav-links a")
    .forEach((el) => el.addEventListener("pointerenter", hoverSound));

  /* =========================================================
     Holographic card pointer tracking (tilt + foil shine)
     ========================================================= */
  if (!prefersReduced) {
    document.querySelectorAll(".card").forEach((card) => {
      const damp = 10; // max tilt deg
      function move(e) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--rx", (0.5 - py) * damp + "deg");
        card.style.setProperty("--ry", (px - 0.5) * damp + "deg");
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
      }
      function leave() {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      }
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
    });
  }

  /* =========================================================
     Ember particles (lightweight canvas)
     ========================================================= */
  (function embers() {
    if (prefersReduced) return;
    const c = document.getElementById("emberCanvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    let w, h, raf;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const N = isMobile ? 26 : 60;
    const P = [];
    function reset(p, init) {
      p.x = Math.random() * w;
      p.y = init ? Math.random() * h : h + 10;
      p.r = 1 + Math.random() * 2.6;
      p.vy = 0.2 + Math.random() * 0.7;
      p.vx = (Math.random() - 0.5) * 0.3;
      p.life = 0;
      p.max = 200 + Math.random() * 260;
      p.hue = [38, 320, 190, 270][(Math.random() * 4) | 0];
    }
    function size() {
      w = c.width = innerWidth * DPR;
      h = c.height = innerHeight * DPR;
      c.style.width = innerWidth + "px";
      c.style.height = innerHeight + "px";
    }
    size();
    for (let i = 0; i < N; i++) {
      const p = {};
      reset(p, true);
      P.push(p);
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      P.forEach((p) => {
        p.x += p.vx * DPR;
        p.y -= p.vy * DPR;
        p.life++;
        if (p.y < -10 || p.life > p.max) reset(p, false);
        const a = 0.5 * (1 - p.life / p.max);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * DPR * 3);
        g.addColorStop(0, `hsla(${p.hue},100%,70%,${a})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * DPR * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener("resize", () => {
      cancelAnimationFrame(raf);
      size();
      draw();
    });
  })();

  /* =========================================================
     Dragon fire helper + stick figure reactions
     ========================================================= */
  const dragonFire = document.getElementById("dragonFire");
  function breatheFire() {
    if (!dragonFire || prefersReduced) return;
    dragonFire.classList.remove("lit");
    void dragonFire.offsetWidth; // restart animation
    dragonFire.classList.add("lit");
    fireSound();
  }
  let stickImpulse = null; // set by the cursor-buddy physics below
  function stickCheer() {
    if (stickImpulse) stickImpulse((Math.random() < 0.5 ? -1 : 1) * 7);
  }

  /* Red smoke wisps from the dragon's eyes (more while scrolling) */
  (function dragonEyeSmoke() {
    if (prefersReduced) return;
    const dragon = document.getElementById("dragon");
    if (!dragon) return;
    const eyes = [[89, 92], [51, 92]]; // eye coords in the dragon container
    function puff() {
      const [ex, ey] = eyes[(Math.random() * eyes.length) | 0];
      const s = document.createElement("span");
      s.className = "d-smoke";
      s.style.left = ex + (Math.random() * 6 - 3) + "px";
      s.style.top = ey + (Math.random() * 6 - 3) + "px";
      dragon.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }
    setInterval(() => { if (!document.hidden && Math.random() < 0.6) puff(); }, 420);
    let t = 0;
    window.addEventListener("scroll", () => {
      const n = performance.now();
      if (n - t < 70) return;
      t = n;
      puff();
    }, { passive: true });
  })();

  /* Trailing eye-beams that follow behind the dragon (Unity line-renderer style) */
  (function eyeTrail() {
    if (prefersReduced) return;
    const cv = document.getElementById("eyeTrail");
    const eyes = Array.from(document.querySelectorAll(".d-eye"));
    if (!cv || !eyes.length) return;
    const ctx = cv.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      cv.width = innerWidth * DPR;
      cv.height = innerHeight * DPR;
      cv.style.width = innerWidth + "px";
      cv.style.height = innerHeight + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size();
    window.addEventListener("resize", size);
    const MAX = 28;
    const trails = eyes.map(() => []);
    function loop() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      eyes.forEach((eye, i) => {
        const r = eye.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const tr = trails[i];
        tr.push({ x: cx, y: cy });
        if (tr.length > MAX) tr.shift();
        ctx.globalCompositeOperation = "lighter";
        for (let k = 1; k < tr.length; k++) {
          const a = k / tr.length; // newer -> closer to 1
          ctx.strokeStyle = `rgba(255,${Math.round(30 + 70 * a)},${Math.round(30 + 50 * a)},${0.55 * a})`;
          ctx.lineWidth = 1 + 6 * a;
          ctx.beginPath();
          ctx.moveTo(tr[k - 1].x, tr[k - 1].y);
          ctx.lineTo(tr[k].x, tr[k].y);
          ctx.stroke();
        }
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
        g.addColorStop(0, "rgba(255,120,120,.9)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  /* Card-style shine + tilt on the hero title and the brand logo */
  (function interactiveShine() {
    if (prefersReduced) return;
    function bind(el, area, maxTilt) {
      area = area || el;
      function move(e) {
        const r = area.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
        el.style.setProperty("--rx", (0.5 - py) * maxTilt + "deg");
        el.style.setProperty("--ry", (px - 0.5) * maxTilt + "deg");
      }
      function leave() {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      }
      area.addEventListener("pointermove", move);
      area.addEventListener("pointerleave", leave);
    }
    const title = document.querySelector(".hero-title");
    const hero = document.querySelector(".hero");
    if (title && hero) bind(title, hero, 12);
    const brand = document.querySelector(".brand");
    if (brand) bind(brand, brand, 16);
  })();

  /* =========================================================
     Spaceship that follows the cursor with pendulum physics.
     Anchor = smoothed cursor (lag) + underdamped spring on the swing
     angle driven by pointer velocity -> it banks/overshoots ("savrulma").
     Left click: recoil squish + impact ring + bullet + thud.
     ========================================================= */
  (function cursorShip() {
    const stage = document.getElementById("stickStage");
    const el = document.getElementById("stick");
    if (!stage || !el) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (prefersReduced || !canHover) {
      stage.style.display = "none";
      return;
    }
    const swing = el.querySelector(".swing");
    const char = el.querySelector(".char");
    const pivotX = 40, pivotY = 16; // ship nose in SVG coords

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

    // Left click -> recoil squish + impact ring + thud + bullets
    function spawnImpact(x, y) {
      for (let i = 0; i < 2; i++) {
        const ring = document.createElement("span");
        ring.className = "impact" + (i ? " tint" : "");
        ring.style.left = x + "px";
        ring.style.top = y + "px";
        ring.style.animationDelay = i * 0.06 + "s";
        stage.appendChild(ring);
        ring.addEventListener("animationend", () => ring.remove());
      }
    }
    const bullets = [];
    const HIT_SEL = ".btn, .card, .card-cta, .social, .sound-btn, .brand, .chest, .nav-links a";
    function fireBullet(x, y) {
      const b = document.createElement("span");
      b.className = "bullet";
      b.style.left = x + "px";
      b.style.top = y - 16 + "px"; // from the nose
      stage.appendChild(b);
      bullets.push({ el: b, x: x, y: y - 16, vy: -16 });
    }
    function explodeAt(x, y) {
      for (let i = 0; i < 2; i++) {
        const ring = document.createElement("span");
        ring.className = "impact boom";
        ring.style.left = x + "px";
        ring.style.top = y + "px";
        ring.style.animationDelay = i * 0.05 + "s";
        stage.appendChild(ring);
        ring.addEventListener("animationend", () => ring.remove());
      }
      const n = 10;
      for (let i = 0; i < n; i++) {
        const sp = document.createElement("span");
        sp.className = "spark";
        const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        const dist = 26 + Math.random() * 30;
        sp.style.left = x + "px";
        sp.style.top = y + "px";
        sp.style.setProperty("--tx", Math.cos(ang) * dist + "px");
        sp.style.setProperty("--ty", Math.sin(ang) * dist + "px");
        stage.appendChild(sp);
        sp.addEventListener("animationend", () => sp.remove());
      }
      boomSound();
    }
    function updateBullets() {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y += b.vy;
        b.el.style.top = b.y + "px";
        const tipY = b.y - 9;
        let hit = null;
        if (tipY > 0 && b.x > 0 && b.x < innerWidth) {
          const under = document.elementFromPoint(b.x, tipY);
          hit = under && under.closest ? under.closest(HIT_SEL) : null;
        }
        if (hit) {
          explodeAt(b.x, tipY);
          b.el.remove();
          bullets.splice(i, 1);
        } else if (b.y < -40) {
          b.el.remove();
          bullets.splice(i, 1);
        }
      }
    }
    window.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return; // left only
      char.classList.add("squish");
      spawnImpact(e.clientX, e.clientY);
      fireBullet(e.clientX, e.clientY);
      thudSound();
      angVel += (Math.random() < 0.5 ? -1 : 1) * 3;
    });
    const release = () => char.classList.remove("squish");
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);

    let px = window.innerWidth * 0.5, py = window.innerHeight * 0.5; // raw pointer
    let ax = px, ay = py; // smoothed anchor (trailing)
    let lastPx = px;
    let vx = 0; // smoothed pointer velocity (x)
    let angle = 0, angVel = 0; // swing angle (rad)
    let last = performance.now();

    window.addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; }, { passive: true });
    stickImpulse = (k) => { angVel += k; };

    function frame(now) {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      if (dt <= 0) dt = 0.016;

      // trailing anchor: time-based lerp so the buddy lags then catches up
      const follow = 1 - Math.pow(0.0009, dt);
      ax += (px - ax) * follow;
      ay += (py - ay) * follow;

      // pointer horizontal speed drives the swing target (it trails the motion)
      const moveX = px - lastPx;
      lastPx = px;
      vx = vx * 0.82 + moveX * 0.18;
      const targetA = clamp(-vx * 0.05, -1.15, 1.15);

      // underdamped spring -> overshoot + wobble; target 0 acts like gravity
      const stiffness = 90, damping = 6.5;
      angVel += (stiffness * (targetA - angle) - damping * angVel) * dt;
      angle += angVel * dt;

      el.style.transform = `translate(${ax - pivotX}px, ${ay - pivotY}px)`;
      swing.style.transform = `rotate(${angle}rad)`;

      updateBullets();

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* =========================================================
     GSAP / ScrollTrigger / Lenis
     ========================================================= */
  let lenis = null;
  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);

    /* Smooth scroll (skip when reduced motion) */
    if (!prefersReduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    /* Anchor links -> smooth scroll */
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.1 });
        else target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
      });
    });

    /* Generic reveals */
    gsap.utils.toArray(".reveal").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 86%",
        once: true,
        onEnter: () => el.classList.add("is-in")
      });
    });

    /* Card reveals (fire + cheer + sparkle on each) */
    if (prefersReduced) {
      document.querySelectorAll(".card").forEach((c) => c.classList.remove("pre"));
    } else {
      gsap.utils.toArray(".card").forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top 82%",
          once: true,
          onEnter: () => {
            card.classList.remove("pre");
            gsap.fromTo(
              card,
              { y: 60, rotateY: 45, scale: 0.82, opacity: 0 },
              {
                y: 0,
                rotateY: 0,
                scale: 1,
                opacity: 1,
                duration: 0.85,
                ease: "back.out(1.6)",
                delay: i * 0.08,
                // hand transform back to CSS so the holo tilt (var-based) works
                onComplete: () => gsap.set(card, { clearProps: "transform" })
              }
            );
            breatheFire();
            stickCheer();
            sparkSound();
          }
        });
      });
    }

    /* Hero parallax orbs */
    if (!prefersReduced) {
      gsap.to(".orb-1", { yPercent: 40, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".orb-2", { yPercent: 70, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-title", { yPercent: 24, opacity: 0.55, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to("#gameBits", { yPercent: -12, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 } });
    }

    /* ---------- Flying dragon along motion path ---------- */
    const dragon = document.getElementById("dragon");
    if (dragon && !prefersReduced && !isMobile && window.MotionPathPlugin) {
      gsap.set(dragon, { xPercent: -50, yPercent: -50 });
      let dragonTl = null;
      function pathPoints() {
        const W = innerWidth, H = innerHeight;
        return [
          { x: W * 0.12, y: H * 0.28 },
          { x: W * 0.80, y: H * 0.20 },
          { x: W * 0.30, y: H * 0.42 },
          { x: W * 0.82, y: H * 0.34 },
          { x: W * 0.22, y: H * 0.52 },
          { x: W * 0.72, y: H * 0.42 },
          { x: W * 0.45, y: H * 0.32 }
        ];
      }
      function buildDragonPath() {
        if (dragonTl) {
          dragonTl.scrollTrigger && dragonTl.scrollTrigger.kill();
          dragonTl.kill();
        }
        gsap.set(dragon, { x: pathPoints()[0].x, y: pathPoints()[0].y });
        dragonTl = gsap.timeline({
          scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 }
        });
        dragonTl.to(dragon, {
          motionPath: { path: pathPoints(), curviness: 1.3, autoRotate: false },
          ease: "none"
        });
      }
      buildDragonPath();
      // gentle idle bob independent of scroll
      gsap.to(dragon, { rotation: "+=4", duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      let rt;
      window.addEventListener("resize", () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
          buildDragonPath();
          ScrollTrigger.refresh();
        }, 250);
      });
    } else if (dragon && (isMobile || prefersReduced)) {
      // park the dragon in a corner on mobile / reduced
      gsap.set(dragon, { x: innerWidth * 0.5, y: 90, xPercent: -50, yPercent: -50 });
    }

    ScrollTrigger.refresh();
  }
})();
