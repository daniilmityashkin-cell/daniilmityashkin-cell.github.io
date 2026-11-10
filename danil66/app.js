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
    const step = () => parseFloat(getComputedStyle(flow).getPropertyValue('--step')) || 250;
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

    new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; render(); }), { threshold: .35 }).observe(stage);
    addEventListener('resize', render);
    render();
  });

  // ---------- modal (showreel + design images) ----------
  const modal = document.getElementById('modal'), box = modal.querySelector('.box');
  function openModal(src, kind) {
    box.innerHTML = kind === 'img' ? `<img src="${src}" alt="">` : `<video src="${src}" controls playsinline autoplay></video>`;
    modal.hidden = false; document.body.style.overflow = 'hidden';
    document.querySelectorAll('.card video').forEach(v => v.pause());
  }
  function closeModal() { box.innerHTML = ''; modal.hidden = true; document.body.style.overflow = ''; }
  modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('x')) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  document.querySelectorAll('[data-reel]').forEach(b => b.addEventListener('click', () => { openModal(b.dataset.reel, 'video'); goal('showreel_open'); }));

  // ---------- goals ----------
  document.addEventListener('click', e => { if (e.target.closest('a[href*="t.me/noirout"]')) goal('tg_click'); });
  if (reduce) document.querySelectorAll('.card video').forEach(v => v.removeAttribute('autoplay'));
})();
