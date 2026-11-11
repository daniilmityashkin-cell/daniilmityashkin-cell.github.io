#!/usr/bin/env python3
"""Сборка сайта DANIL66 из одного файла с работами.

Все работы лежат в works.json. Этот скрипт по нему:
  * обновляет карусели Reels / Видео / Дизайн на главной (index.html);
  * собирает страницы /reels/, /video/, /design/;
  * собирает страницу политики /privacy/ (данные оператора берутся из tools/site.json);
  * собирает sitemap.xml.

Ссылки на файлы получают метку версии из содержимого файла (?v=...), поэтому
после замены видео браузеры сами подтянут новую версию.

Запуск:
  python3 tools/build.py          пересобрать сайт
  python3 tools/build.py --check  только проверить, что всё собрано и файлы на месте
                                  (так запускает GitHub при каждом изменении)
"""
import hashlib
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://portfolio-danil.ru"
TG = "https://t.me/noirout"
IG = "https://instagram.com/prostoout"
VK = "https://vk.ru/prostout"

SECTIONS = {
    "reels": dict(num="01", title="Reels", sub="ВЕРТИКАЛЬНЫЕ РОЛИКИ", grid="v",
                  desc="Все Reels и вертикальные ролики DANIL66: коммерческие эдиты, fashion-съёмка, speed ramp, субтитры."),
    "video": dict(num="02", title="Видео", sub="ГОРИЗОНТАЛЬНЫЕ РОЛИКИ", grid="h",
                  desc="Все горизонтальные видео DANIL66: кинематографичная съёмка, репортажи с мероприятий, промо, эдиты."),
    "design": dict(num="03", title="Дизайн", sub="АЙДЕНТИКА И СОЦСЕТИ", grid="d",
                   desc="Работы по дизайну DANIL66: лендинг, логотипы, оформление соцсетей, шаблоны, сертификаты."),
}

errors = []


def ver(url):
    """url with a content hash, so a replaced file is never served from cache"""
    f = ROOT / url.lstrip("/")
    if not f.is_file():
        errors.append(f"нет файла: {url}")
        return url
    return f"{url}?v={hashlib.md5(f.read_bytes()).hexdigest()[:8]}"


def esc(s):
    return html.escape(s, quote=True)


def plural(n):
    if n % 10 == 1 and n % 100 != 11:
        return "работа"
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return "работы"
    return "работ"


# ---------- shared page parts ----------
def head(title, desc, path, css_ver):
    return f'''<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="canonical" href="{SITE}{path}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{SITE}{path}">
  <meta property="og:image" content="{SITE}/brand/66-smoke-on-black.png">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta name="theme-color" content="#050505">
  <link rel="icon" href="/brand/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="/fonts/unbounded-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{css_ver}">
  <script>document.documentElement.classList.add('js')</script>
  <script src="{ver('/consent.js')}" defer></script>
</head>'''


def footer():
    return f'''<footer>
  <img draggable="false" src="/brand/66-white.svg" alt="" width="60" height="57">
  <span>© 2026 DANIL66. Все права защищены</span>
  <p class="legal">Все работы, логотип и тексты сайта защищены авторским правом. Копирование и использование без письменного разрешения автора запрещено.<br>
  <a href="/privacy/">Политика обработки персональных данных</a></p>
  <p class="legal small">* Instagram принадлежит компании Meta Platforms Inc., деятельность которой признана экстремистской и запрещена на территории Российской Федерации.</p>
  <a href="#top" onclick="scrollTo(0,0);return false">Наверх ↑</a>
</footer>'''


GUARD = ("<script>/* no \"save image\" menu or dragging for the logo and works */"
         "document.addEventListener('contextmenu',e=>{if(e.target.closest('img,video,.logo,.card,.wcard'))e.preventDefault()});"
         "document.addEventListener('dragstart',e=>{if(e.target.closest('img,video'))e.preventDefault()});</script>")


def topbar(active):
    pills = "".join(f'<a class="pill{" on" if k == active else ""}" href="/{k}/">{v["title"]}</a>'
                    for k, v in SECTIONS.items())
    return f'''<header class="topbar">
  <a class="back" href="/" aria-label="На главную"><img draggable="false" src="/brand/66-white.svg" alt="DANIL66" width="40" height="38"><span>← Главная</span></a>
  <nav class="pills" aria-label="Разделы">{pills}<a class="pill" href="/#about">Обо мне</a><a class="pill" href="/#prices">Прайс</a></nav>
</header>'''


# ---------- cards ----------
def home_card(w):
    t = esc(w["title"])
    if "video" in w:
        return (f'      <figure class="card" data-cap="{t}"><video src="{ver(w["video"])}" poster="{ver(w["poster"])}" '
                f'muted loop playsinline preload="none"></video><span class="snd" aria-hidden="true">♪</span></figure>')
    return f'      <figure class="card" data-cap="{t}"><img src="{ver(w["image"])}" alt="{t}" loading="lazy"></figure>'


def grid_card(w, i):
    t = esc(w["title"])
    if "video" in w:
        media = (f'<video src="{ver(w["video"])}" poster="{ver(w["poster"])}" muted loop playsinline preload="none"></video>'
                 f'<span class="snd" aria-hidden="true">♪</span>')
        kind = "video"
    else:
        media = f'<img src="{ver(w["image"])}" alt="{t}" loading="lazy">'
        kind = "image"
    return (f'      <figure class="wcard" data-kind="{kind}" data-reveal style="--d:{(i % 4) * 90}ms">'
            f'<div class="wbox">{media}</div><figcaption>{t}</figcaption></figure>')


def section_page(sid, works, css):
    c = SECTIONS[sid]
    title = f'{c["title"]} — все работы · DANIL66'
    cards = "\n".join(grid_card(w, i) for i, w in enumerate(works))
    n = len(works)
    return f'''{head(title, c["desc"], f"/{sid}/", css)}
<body class="page">
<div class="cursor-light" aria-hidden="true"></div>
{topbar(sid)}
<main>
  <section class="sec" data-amb id="works">
    <div class="sec-head" data-reveal><span class="num">{c["num"]}</span><h1 class="streak" data-t="{c["title"]}">{c["title"]}</h1><span class="outline">{c["sub"]}</span></div>
    <p class="count" data-reveal>{n} {plural(n)} · нажми, чтобы открыть</p>
    <div class="wrap">
      <div class="wgrid {c["grid"]}">
{cards}
      </div>
    </div>
    <div class="links" data-reveal><a href="/">← На главную</a><a href="/#prices">Прайс →</a><a href="{TG}" target="_blank" rel="noopener">Заказать →</a></div>
  </section>
</main>
{footer()}
<div class="modal" id="modal" hidden><button class="x" aria-label="Закрыть">×</button><div class="box"></div></div>
<script src="{ver('/works.js')}"></script>
{GUARD}
</body>
</html>
'''


def privacy_page(site, css):
    name = site.get("operator_name", "").strip()
    email = site.get("operator_email", "").strip()
    if not name or not email:
        errors.append("в tools/site.json не заполнены operator_name и operator_email (нужны для политики)")
    name = esc(name or "[ФИО НЕ УКАЗАНО]")
    email = esc(email or "[EMAIL НЕ УКАЗАН]")
    date = esc(site.get("policy_date", ""))
    title = "Политика обработки персональных данных · DANIL66"
    desc = "Политика обработки персональных данных сайта portfolio-danil.ru."
    return f'''{head(title, desc, "/privacy/", css)}
<body class="page">
{topbar("")}
<main>
  <section class="sec doc" id="privacy">
    <div class="wrap">
      <h1>Политика обработки персональных данных</h1>
      <p class="muted">Редакция от {date}</p>

      <h2>1. Общие положения</h2>
      <p>Настоящая политика составлена в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных посетителей сайта <b>portfolio-danil.ru</b> (далее — Сайт).</p>
      <p>Оператор персональных данных: <b>{name}</b> (далее — Оператор). Связь с Оператором: <a href="mailto:{email}">{email}</a>, Telegram <a href="{TG}" target="_blank" rel="noopener">@noirout</a>.</p>

      <h2>2. Какие данные обрабатываются</h2>
      <p>Сайт не содержит форм и не запрашивает имя, телефон или адрес почты. Обрабатываются только технические данные, которые собирает сервис веб-аналитики «Яндекс Метрика» и только после согласия посетителя: файлы cookie, IP-адрес, сведения о браузере, устройстве и операционной системе, источник перехода, время посещения, действия на страницах (просмотры, клики, прокрутка, в том числе запись сеансов «Вебвизор»).</p>
      <p>Если посетитель сам пишет Оператору в Telegram или на почту, Оператор получает данные, которые посетитель указал в сообщении, и использует их только для ответа и обсуждения заказа.</p>

      <h2>3. Цели обработки</h2>
      <p>Анализ посещаемости и удобства Сайта, улучшение его работы; ответ на обращения и обсуждение заказов.</p>

      <h2>4. Правовое основание</h2>
      <p>Согласие посетителя, которое он даёт кнопкой «Принять» в уведомлении о cookie. Без согласия «Яндекс Метрика» на Сайте не загружается. Обращение в Telegram или на почту — согласие на обработку указанных в нём данных для ответа.</p>

      <h2>5. Передача данных третьим лицам</h2>
      <p>Данные веб-аналитики обрабатываются ООО «Яндекс» (сервис «Яндекс Метрика») по поручению Оператора, данные хранятся на серверах на территории Российской Федерации. Иным третьим лицам данные не передаются и не продаются.</p>

      <h2>6. Срок хранения</h2>
      <p>Данные аналитики хранятся в течение срока, установленного сервисом «Яндекс Метрика». Переписка хранится до достижения цели обращения или до отзыва согласия.</p>

      <h2>7. Права посетителя</h2>
      <p>Посетитель вправе получить сведения об обработке своих данных, потребовать их уточнения или удаления, отозвать согласие. Отозвать согласие на cookie можно в любой момент: <a href="#" data-cookie-reset>сбросить выбор</a> или удалить cookie в настройках браузера. Запросы направляются на <a href="mailto:{email}">{email}</a>, ответ — в течение 10 рабочих дней.</p>

      <h2>8. Защита данных</h2>
      <p>Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного доступа, изменения, распространения и уничтожения.</p>

      <h2>9. Изменение политики</h2>
      <p>Оператор может изменять политику. Актуальная редакция всегда доступна на этой странице.</p>
    </div>
  </section>
</main>
{footer()}
{GUARD}
</body>
</html>
'''


def sitemap():
    urls = ["/", "/reels/", "/video/", "/design/", "/privacy/"]
    body = "\n".join(f"  <url><loc>{SITE}{u}</loc></url>" for u in urls)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n'


def update_home(home, works):
    for sid in SECTIONS:
        m = re.search(r'(<section class="sec" data-amb id="%s">.*?<div class="stage">\n)(.*?)(\n      </div>)' % sid, home, re.S)
        if not m:
            errors.append(f"на главной не найдена карусель #{sid}")
            continue
        cards = "\n".join(home_card(w) for w in works[sid])
        home = home[:m.start(2)] + cards + home[m.end(2):]
    home = re.sub(r'<script src="/consent\.js[^"]*" defer></script>',
                  f'<script src="{ver("/consent.js")}" defer></script>', home)
    home = re.sub(r'<link rel="stylesheet" href="[^"]*style\.css[^"]*">',
                  f'<link rel="stylesheet" href="{ver("/style.css")}">', home)
    home = re.sub(r'<script src="[^"]*app\.js[^"]*"></script>', f'<script src="{ver("/app.js")}"></script>', home)
    return home


def main():
    check = "--check" in sys.argv
    works = json.loads((ROOT / "works.json").read_text(encoding="utf-8"))
    site = json.loads((ROOT / "tools/site.json").read_text(encoding="utf-8"))
    for sid in SECTIONS:
        if not works.get(sid):
            errors.append(f"в works.json нет раздела {sid}")
        for w in works.get(sid, []):
            if not w.get("title") or not ("video" in w or "image" in w):
                errors.append(f"{sid}: у работы нет названия или файла: {w}")
            if "video" in w and "poster" not in w:
                errors.append(f"{sid}: у видео «{w.get('title')}» нет обложки (poster)")

    css = ver("/style.css")
    out = {
        "index.html": update_home((ROOT / "index.html").read_text(encoding="utf-8"), works),
        "privacy/index.html": privacy_page(site, css),
        "sitemap.xml": sitemap(),
    }
    for sid in SECTIONS:
        out[f"{sid}/index.html"] = section_page(sid, works.get(sid, []), css)

    stale = []
    for rel, text in out.items():
        f = ROOT / rel
        old = f.read_text(encoding="utf-8") if f.exists() else None
        if old != text:
            stale.append(rel)
            if not check:
                f.parent.mkdir(parents=True, exist_ok=True)
                f.write_text(text, encoding="utf-8")

    if check and stale:
        errors.append("сайт не пересобран после изменения works.json (запусти python3 tools/build.py): " + ", ".join(stale))
    for e in errors:
        print("ОШИБКА:", e)
    if not check:
        print("Пересобрано:", ", ".join(stale) if stale else "ничего не изменилось")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
