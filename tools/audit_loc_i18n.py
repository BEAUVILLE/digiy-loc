from __future__ import annotations

import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path('.')
OUTPUT_JSON = ROOT / 'loc-i18n-inventory.json'
OUTPUT_MD = ROOT / 'loc-i18n-audit.md'
SUPPORTED = ('fr', 'en', 'es', 'de', 'it', 'nl', 'ar')


class VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hidden_depth = 0
        self.texts: list[str] = []
        self.attributes: list[dict[str, str]] = []
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {'script', 'style', 'template', 'noscript'}:
            self.hidden_depth += 1
        data = {k: (v or '') for k, v in attrs}
        if tag == 'a' and data.get('href'):
            self.links.append(data['href'])
        for key in ('placeholder', 'title', 'aria-label', 'alt', 'value'):
            value = data.get(key, '').strip()
            if value:
                self.attributes.append({'tag': tag, 'attribute': key, 'text': value})

    def handle_endtag(self, tag: str) -> None:
        if tag in {'script', 'style', 'template', 'noscript'} and self.hidden_depth:
            self.hidden_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.hidden_depth:
            return
        text = re.sub(r'\s+', ' ', data).strip()
        if text:
            self.texts.append(text)


def extract_dynamic_strings(source: str) -> list[str]:
    scripts = re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', source, flags=re.I | re.S)
    found: list[str] = []
    for script in scripts:
        for value in re.findall(r'`([^`]{3,1200})`', script, flags=re.S):
            compact = re.sub(r'\s+', ' ', value).strip()
            if compact and re.search(r'[A-Za-zÀ-ÿ\u0600-\u06ff]', compact):
                found.append(compact)
        for quote, value in re.findall(r'(["\'])(.*?)(?<!\\)\1', script, flags=re.S):
            compact = re.sub(r'\s+', ' ', value).strip()
            if 3 <= len(compact) <= 220 and re.search(r'[A-Za-zÀ-ÿ\u0600-\u06ff]', compact):
                found.append(compact)
    return sorted(set(found))


def language_markers(source: str) -> dict[str, bool]:
    lower = source.lower()
    return {
        lang: bool(
            re.search(rf'\b{re.escape(lang)}\s*:', source)
            or f'data-lang="{lang}"' in lower
            or f"data-lang='{lang}'" in lower
            or f'lang={lang}' in lower
            or f'?lang={lang}' in lower
        )
        for lang in SUPPORTED
    }


def main() -> None:
    files: dict[str, dict[str, object]] = {}
    html_paths = sorted(
        path for path in ROOT.rglob('*.html')
        if '.git' not in path.parts and not any(part.startswith('.') for part in path.parts)
    )

    for path in html_paths:
        source = path.read_text(encoding='utf-8', errors='replace')
        parser = VisibleTextParser()
        parser.feed(source)
        files[path.as_posix()] = {
            'visible_text': sorted(set(parser.texts)),
            'attributes': parser.attributes,
            'dynamic_strings': extract_dynamic_strings(source),
            'internal_links': sorted(set(link for link in parser.links if link.startswith(('/', './', '../')))),
            'languages_detected': language_markers(source),
            'has_rtl': 'dir="rtl"' in source.lower() or "dir='rtl'" in source.lower() or 'document.documentelement.dir' in source.lower(),
            'has_lang_query': 'urlsearchparams' in source.lower() and 'lang' in source.lower(),
            'has_shared_passport': 'loc-language-passport.js' in source,
        }

    summary = {
        'html_file_count': len(files),
        'html_files': list(files),
        'supported_languages': list(SUPPORTED),
        'files': files,
    }
    OUTPUT_JSON.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    lines = [
        '# Audit internationalisation DIGIY LOC',
        '',
        f'- Pages HTML analysées : **{len(files)}**',
        f'- Langues cibles : **{", ".join(SUPPORTED)}**',
        '',
        '## Couverture par fichier',
        '',
        '| Fichier | 7 langues | RTL | Passeport partagé | Textes visibles | Chaînes dynamiques |',
        '|---|---:|---:|---:|---:|---:|',
    ]
    for name, data in files.items():
        langs = data['languages_detected']
        complete = all(bool(langs.get(lang)) for lang in SUPPORTED)
        lines.append(
            f"| `{name}` | {'✅' if complete else '❌'} | {'✅' if data['has_rtl'] else '❌'} | "
            f"{'✅' if data['has_shared_passport'] else '❌'} | {len(data['visible_text'])} | {len(data['dynamic_strings'])} |"
        )

    lines.extend(['', '## Priorités automatiques', ''])
    for name, data in files.items():
        missing = [lang for lang, present in data['languages_detected'].items() if not present]
        if missing:
            lines.append(f"- `{name}` : langues absentes ou non détectées — {', '.join(missing)}")
        if not data['has_shared_passport']:
            lines.append(f"- `{name}` : pas encore raccordé au passeport linguistique commun.")
    OUTPUT_MD.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Audit LOC écrit : {len(files)} pages HTML.')


if __name__ == '__main__':
    main()
