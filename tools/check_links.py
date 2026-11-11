#!/usr/bin/env python3
"""Проверка: все локальные ссылки и файлы (src/href/poster) на страницах сайта существуют."""
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "reels/index.html", "video/index.html", "design/index.html", "privacy/index.html"]
bad = []
for page in PAGES:
    f = ROOT / page
    if not f.exists():
        bad.append(f"нет страницы {page}")
        continue
    text = f.read_text(encoding="utf-8")
    base = f.parent
    for url in re.findall(r'(?:src|href|poster|data-reel)="([^"]+)"', text):
        if url.startswith(("http:", "https:", "mailto:", "tel:", "#", "data:", "javascript:")):
            continue
        path = unquote(urlsplit(url).path)
        if not path:
            continue
        target = (ROOT / path.lstrip("/")) if path.startswith("/") else (base / path)
        if path.endswith("/"):
            target = target / "index.html"
        if not target.exists():
            bad.append(f"{page}: битая ссылка {url}")
for b in bad:
    print("ОШИБКА:", b)
print("Ссылки в порядке" if not bad else f"Найдено проблем: {len(bad)}")
sys.exit(1 if bad else 0)
