/* Cookie consent (152-ФЗ): Яндекс Метрика загружается только после согласия посетителя. */
(() => {
  const KEY = 'danil66-consent', ID = 114162135;
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  function loadMetrika() {
    if (window.ym) return;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + ID, 'ym');
    ym(ID, 'init', { ssr: true, webvisor: true, clickmap: true, referrer: document.referrer, url: location.href, accurateTrackBounce: true, trackLinks: true });
  }

  function banner() {
    const el = document.createElement('div');
    el.className = 'cookie';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Согласие на cookie');
    el.innerHTML = '<p>Сайт использует cookie и Яндекс Метрику, чтобы понимать, как им пользуются. ' +
      'Подробнее в <a href="/privacy/">Политике обработки персональных данных</a>.</p>' +
      '<div class="cookie-btns"><button type="button" data-v="no">Отклонить</button><button type="button" class="ok" data-v="yes">Принять</button></div>';
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      set(b.dataset.v); el.classList.add('out'); setTimeout(() => el.remove(), 400);
      if (b.dataset.v === 'yes') loadMetrika();
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
  }

  const start = () => {
    const v = get();
    if (v === 'yes') loadMetrika(); else if (v !== 'no') banner();
    document.addEventListener('click', e => {
      const r = e.target.closest('[data-cookie-reset]'); if (!r) return;
      e.preventDefault(); try { localStorage.removeItem(KEY); } catch (err) {} location.reload();
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
