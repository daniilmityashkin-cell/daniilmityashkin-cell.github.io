(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const goal = n => { try { ym(114162135, 'reachGoal', n); } catch (e) {} };

  // phone: bring the active section pill into view inside the scrollable bar
  const bar = document.querySelector('.topbar .pills'), on = bar && bar.querySelector('.pill.on');
  if (on) bar.scrollLeft = on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2;

  // reveal on scroll
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => rio.observe(el));

  // videos play (muted) only while on screen; loaded lazily
  const vids = [...document.querySelectorAll('.wcard video')];
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); }
    else v.pause();
  }), { threshold: .5 });
  if (!reduce) vids.forEach(v => vio.observe(v));

  // modal: video with sound / large image
  const modal = document.getElementById('modal'), box = modal.querySelector('.box');
  const open = card => {
    const v = card.querySelector('video'), im = card.querySelector('img');
    if (v) { const src = v.getAttribute('src'); box.innerHTML = `<video src="${src}" controls playsinline autoplay></video>`; }
    else if (im) box.innerHTML = `<img src="${im.src}" alt="${im.alt}">`;
    else return;
    vids.forEach(x => x.pause());
    modal.hidden = false; document.body.style.overflow = 'hidden';
  };
  const close = () => {
    box.innerHTML = ''; modal.hidden = true; document.body.style.overflow = '';
    vids.forEach(v => { const r = v.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) v.play().catch(() => {}); });
  };
  document.querySelectorAll('.wcard').forEach(c => c.addEventListener('click', () => open(c)));
  modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('x')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });

  // soft light following the cursor
  const light = document.querySelector('.cursor-light');
  if (!reduce) addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    light.style.setProperty('--cx', e.clientX + 'px'); light.style.setProperty('--cy', e.clientY + 'px');
  }, { passive: true });

  document.addEventListener('click', e => { if (e.target.closest('a[href*="t.me/noirout"]')) goal('tg_click'); });
})();
