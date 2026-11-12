document.documentElement.classList.add('js');
(() => {
  const pad = n => String(n).padStart(2, '0');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const goal = n => { try { ym(114162135, 'reachGoal', n); } catch (e) {} };

  // ---------- coverflow carousels ----------
  document.querySelectorAll('[data-flow]').forEach(flow => {
    const stage = flow.querySelector('.stage');
    const cards = [...stage.children];
    const n = cards.length;
    const cap = flow.querySelector('.cap'), cnt = flow.querySelector('.cnt');
    let cur = 0, visible = false;
    const probe = document.createElement('i');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;height:0;width:var(--step)';
    flow.appendChild(probe);
    const step = () => probe.getBoundingClientRect().width || 250;
    const off = i => { let o = ((i - cur) % n + n) % n; if (o > n / 2) o -= n; return o; };

    function render() {
      const s = step();
      cards.forEach((el, i) => {
        const o = off(i), a = Math.abs(o);
        el.style.transform = `translate(-50%,-50%) translateX(${o * s}px) scale(${1 - Math.min(a, 3) * 0.15})`;
        el.style.zIndex = 100 - a;
        el.style.opacity = a > 2.5 ? 0 : 1;
        el.style.pointerEvents = a > 2.5 ? 'none' : '';
        el.style.filter = `brightness(${1 - Math.min(a, 2) * 0.32})`;
        el.classList.toggle('on', o === 0);
        el.setAttribute('aria-hidden', o !== 0);
        const v = el.querySelector('video');
        if (v) {
          if (o === 0 && visible) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); }
          else { v.pause(); if (o !== 0) { v.muted = true; el.classList.remove('sound'); } }
        }
      });
      cap.textContent = cards[cur].dataset.cap;
      cnt.textContent = pad(cur + 1) + ' / ' + pad(n);
    }
    const go = d => { cur = (cur + d + n) % n; render(); };
    flow.querySelector('.prev').onclick = () => go(-1);
    flow.querySelector('.next').onclick = () => go(1);

    cards.forEach((el, i) => el.addEventListener('click', () => {
      if (moved) return;
      if (i !== cur) { cur = i; render(); return; }
      const v = el.querySelector('video');
      if (v) {                       // active video: toggle sound
        const on = v.muted;
        document.querySelectorAll('.card video').forEach(o => { o.muted = true; o.closest('.card').classList.remove('sound'); });
        if (on) { v.muted = false; v.currentTime = 0; v.play().catch(() => {}); el.classList.add('sound'); }
      } else {
        const img = el.querySelector('img');
        if (img) openModal(img.dataset.full || img.src, 'img');
      }
    }));

    // swipe
    let x0 = null, moved = false;
    stage.addEventListener('pointerdown', e => { x0 = e.clientX; moved = false; });
    stage.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { moved = true; go(dx < 0 ? 1 : -1); setTimeout(() => moved = false, 50); }
    });
    flow.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });

    new IntersectionObserver(es => es.forEach(e => {
      visible = e.isIntersecting;
      if (visible && !flow.classList.contains('open')) setTimeout(() => flow.classList.add('open'), 250);
      render();
    }), { threshold: .3 }).observe(stage);
    // tilt the media inside the active card after the cursor
    stage.addEventListener('pointermove', e => {
      const c = e.target.closest('.card.on'); if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg');
      c.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 8 + 'deg');
    });
    addEventListener('resize', render);
    render();
  });

  // ---------- modal (design images) ----------
  const modal = document.getElementById('modal'), box = modal.querySelector('.box');
  function openModal(src, kind) {
    box.innerHTML = kind === 'img' ? `<img src="${src}" alt="">` : `<video src="${src}" controls playsinline autoplay></video>`;
    modal.hidden = false; document.body.style.overflow = 'hidden';
    document.querySelectorAll('.card video').forEach(v => v.pause());
  }
  function closeModal() { box.innerHTML = ''; modal.hidden = true; document.body.style.overflow = ''; }
  modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('x')) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });


  // ================= motion layer =================
  const hero = document.querySelector('.hero');
  // intro
  const start = () => requestAnimationFrame(() => document.body.classList.add('loaded'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else addEventListener('load', start);
  setTimeout(start, 2500);   // safety net

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  if (!reduce) {
    // mouse parallax + cursor light
    const light = document.querySelector('.cursor-light');
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      hero.style.setProperty('--mx', (e.clientX / innerWidth - .5).toFixed(3));
      hero.style.setProperty('--my', (e.clientY / innerHeight - .5).toFixed(3));
      light.style.setProperty('--cx', e.clientX + 'px'); light.style.setProperty('--cy', e.clientY + 'px');
    }, { passive: true });
    // hero dissolves while scrolling
    const onScroll = () => hero.style.setProperty('--sp', Math.min(1, scrollY / innerHeight).toFixed(3));
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    // living dust in the hero (smoke-like particles drifting on a flow field)
    const cv = hero.querySelector('.dust'), cx = cv.getContext('2d');
    let W, H, P = [], run = false, mx = -1e4, my = -1e4;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => {
      W = cv.width = hero.clientWidth * dpr; H = cv.height = hero.clientHeight * dpr;
      const n = innerWidth < 700 ? 90 : 190;
      P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.6 + .4) * dpr, a: Math.random() * .55 + .1, s: Math.random() * .6 + .2 }));
    };
    size(); addEventListener('resize', size);
    hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mx = (e.clientX - r.left) * dpr; my = (e.clientY - r.top) * dpr; });
    hero.addEventListener('pointerleave', () => { mx = my = -1e4; });
    let t = 0;
    const tick = () => {
      if (!run) return;
      t += .004; cx.clearRect(0, 0, W, H);
      for (const p of P) {
        const ang = Math.sin(p.x * .0021 + t) + Math.cos(p.y * .0017 - t * 1.3);   // smooth swirling field
        p.x += Math.cos(ang) * p.s * dpr + .15 * dpr; p.y += Math.sin(ang) * p.s * dpr - .25 * dpr;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 22000 * dpr * dpr) { const f = 1.8 / Math.sqrt(d2 + 1); p.x += dx * f; p.y += dy * f; }   // push away from cursor
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10; if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
        cx.globalAlpha = p.a * (.6 + .4 * Math.sin(t * 6 + p.x));
        cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill();
      }
      requestAnimationFrame(tick);
    };
    new IntersectionObserver(es => { run = es[0].isIntersecting; if (run) requestAnimationFrame(tick); }).observe(hero);
  }


  // ---------- service windows ----------
  let svcOpen = null, svcBack = null;
  function openSvc(key, btn) {
    const w = document.getElementById('svc-' + key); if (!w) return;
    svcBack = btn; svcOpen = w; w.hidden = false; document.body.classList.add('svc-on');
    document.querySelectorAll('.card video').forEach(v => v.pause());
    w.querySelectorAll('video').forEach(v => { v.preload = 'auto'; v.play().catch(() => {}); });
    requestAnimationFrame(() => w.classList.add('open'));
    w.scrollTop = 0; w.querySelector('.svc-x').focus({ preventScroll: true });
    goal('service_' + key);
  }
  function closeSvc() {
    const w = svcOpen; if (!w) return; svcOpen = null;
    w.classList.remove('open'); w.querySelectorAll('video').forEach(v => v.pause());
    setTimeout(() => { w.hidden = true; document.body.classList.remove('svc-on'); if (svcBack) svcBack.focus({ preventScroll: true }); }, 350);
  }
  document.querySelectorAll('[data-svc]').forEach(b => b.addEventListener('click', () => openSvc(b.dataset.svc, b)));
  document.querySelectorAll('.svc').forEach(w => w.addEventListener('click', e => { if (e.target === w || e.target.closest('.svc-x')) closeSvc(); }));
  addEventListener('keydown', e => { if (e.key === 'Escape' && svcOpen) closeSvc(); });

  // ---------- goals ----------
  document.addEventListener('click', e => { if (e.target.closest('a[href*="t.me/noirout"]')) goal('tg_click'); });
  if (reduce) document.querySelectorAll('.card video').forEach(v => v.removeAttribute('autoplay'));
})();
