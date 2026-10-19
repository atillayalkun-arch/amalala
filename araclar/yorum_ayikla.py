#!/usr/bin/env python3
"""Video .md dosyalarindan yorumlari ayiklar.

Scripti `videolar` klasorune koy, ayni klasorde terminal ac:

    python yorum_ayikla.py                    # secili yorumlar -> yorumlar_secili/
    python yorum_ayikla.py --tam              # tum yorumlar    -> yorumlar_tam/
    python yorum_ayikla.py --videolar 002 015 # sadece bu videolar

Her videonun yorumlari, video dosyasiyla ayni adli bir .md dosyasina yazilir.
Dogrulama sonucu `dogrulama_raporu.txt` dosyasina yazilir.
"""
import argparse
import random
import re
import sys
from pathlib import Path

HEAD = re.compile(r'^\*\*\[👍\s*(\d[\d.,]*)\s*·\s*(\d{4}-\d{2}-\d{2})([^\]]*)\]\*\*\s?(.*)$')
REPLY = re.compile(r'^>\s*↳\s*\*\*\[👍\s*(\d[\d.,]*)\s*·\s*(\d{4}-\d{2}-\d{2})([^\]]*)\]\*\*\s?(.*)$')
SECTION = re.compile(r'^## Yorumlar\b(.*)$')
COUNTS = re.compile(r'([\d.,]+) yorum: ([\d.,]+) ana yorum, ([\d.,]+) cevap(?: · kanal sahibinin cevapları: ([\d.,]+))?')
TITLE = re.compile(r'^# (.+)$')

ZERO_WIDTH = re.compile('[​‌‍⁠﻿]')
MENTION = re.compile(r'@[^\s　]+')

QUESTION = re.compile(r'[？?]|ですか|でしょうか|ますか|なぜ|どうして|教えて|どうなの')
REQUEST = re.compile(r'してほしい|して欲しい|ほしい|欲しい|お願い|取り上げ|解説して|見たい|知りたい|聞きたい|扱って')
STORY = re.compile(r'私|わたし|自分|僕|ぼく|俺|母|父|親|上司|同僚|会社|職場|友達|友人|夫|妻|子供|子ども|彼')

QUOTA = {'top': 0.30, 'soru': 0.20, 'istek': 0.15, 'hikaye': 0.15, 'rastgele': 0.20}


def num(text):
    return int(re.sub(r'[.,]', '', text))


def new_item(m):
    return {'likes': num(m.group(1)), 'date': m.group(2),
            'owner': 'Kanal sahibi' in m.group(3),
            'lines': [m.group(4)], 'replies': []}


def finish(item):
    item['text'] = '\n'.join(l.rstrip() for l in item['lines']).strip()
    seen, uniq, dup = set(), [], 0
    for r in item['replies']:
        r['text'] = '\n'.join(l.rstrip() for l in r['lines']).strip()
        key = (r['likes'], r['date'], r['owner'], r['text'])
        if key in seen:
            dup += 1
            continue
        seen.add(key)
        uniq.append(r)
    item['replies_raw'] = item['replies']
    item['replies'] = uniq
    item['dup'] = dup


def parse(path):
    raw = path.read_text(encoding='utf-8-sig').replace('\r\n', '\n').split('\n')
    title = path.stem
    for line in raw:
        m = TITLE.match(line)
        if m:
            title = m.group(1).strip()
            break
    start = next((i for i, l in enumerate(raw) if SECTION.match(l)), None)
    if start is None:
        return {'title': title, 'has_section': False, 'expected': None,
                'mains': [], 'unparsed': 0, 'joined': 0, 'samples': [], 'dup': 0}
    c = COUNTS.search(raw[start])
    expected = None
    if c:
        expected = {'total': num(c.group(1)), 'main': num(c.group(2)),
                    'reply': num(c.group(3)),
                    'owner': num(c.group(4)) if c.group(4) else None}
    mains, item, last, unparsed = [], None, None, 0
    joined, samples = 0, []
    for line in raw[start + 1:]:
        if line.startswith('## '):
            break
        m = HEAD.match(line)
        if m:
            item = last = new_item(m)
            mains.append(item)
            continue
        r = REPLY.match(line)
        if r and mains:
            item = last = new_item(r)
            mains[-1]['replies'].append(item)
            continue
        if line == '':
            item = None
            continue
        text = re.sub(r'^>\s?', '', line) if line.startswith('>') else line
        if item is not None:
            item['lines'].append(text)
        elif last is not None:
            if not text.strip():
                continue
            # bos satirdan sonra gelen satir: onceki yorumun devami say
            last['lines'].extend(['', text])
            item = last
            joined += 1
            if len(samples) < 3:
                samples.append(line.strip()[:60])
        elif not line.startswith('_('):
            unparsed += 1
    for m in mains:
        finish(m)
    if expected and sum(len(m['replies_raw']) for m in mains) == expected['reply']:
        # baslik ham sayiyla tutuyor: ayni gorunen cevaplar gercek, silme
        for m in mains:
            m['replies'], m['dup'] = m['replies_raw'], 0
    return {'title': title, 'has_section': True, 'expected': expected,
            'mains': mains, 'unparsed': unparsed, 'joined': joined,
            'samples': samples, 'dup': sum(m['dup'] for m in mains)}


def clean(text, max_chars):
    text = ZERO_WIDTH.sub('', text)
    text = MENTION.sub('@…', text)
    text = re.sub(r'\s*\n\s*', ' / ', text)
    text = re.sub(r'[ \t]{2,}', ' ', text).strip()
    if max_chars and len(text) > max_chars:
        text = text[:max_chars] + '…(+%d karakter)' % (len(text) - max_chars)
    return text


def select(mains, limit):
    if len(mains) <= limit:
        return [(c, 'hepsi') for c in mains]
    n = {k: max(1, round(limit * v)) for k, v in QUOTA.items()}
    chosen = {}

    def pick(name, pred):
        cands = [i for i, c in enumerate(mains) if i not in chosen and pred(c)]
        cands.sort(key=lambda i: (-mains[i]['likes'], i))
        for i in cands[:n[name]]:
            chosen[i] = name

    pick('top', lambda c: True)
    pick('soru', lambda c: QUESTION.search(c['text']))
    pick('istek', lambda c: REQUEST.search(c['text']))
    pick('hikaye', lambda c: len(c['text']) >= 80 and STORY.search(c['text']))
    rest = [i for i in range(len(mains)) if i not in chosen]
    for i in random.Random(42).sample(rest, min(n['rastgele'], len(rest))):
        chosen[i] = 'rastgele'
    return [(mains[i], chosen[i]) for i in sorted(chosen)]


def label(item, tag=None):
    parts = ['👍 %d' % item['likes'], item['date']]
    if item['owner']:
        parts.append('🎬 Kanal sahibi')
    if tag:
        parts.append(tag)
    return '[' + ' · '.join(parts) + ']'


def render(no, data, picks, args):
    mains = data['mains']
    n_reply = sum(len(m['replies']) for m in mains)
    out = ['# ' + data['title'], '',
           'Video %s · toplam yorum: %d (%d ana, %d cevap) · bu dosyada: %d ana yorum%s'
           % (no, len(mains) + n_reply, len(mains), n_reply, len(picks),
              '' if args.tam else ' (secim)'), '']
    if not mains:
        out.append('(yorum yok)')
    for c, tag in picks:
        out.append('- %s %s' % (label(c, None if args.tam else tag), clean(c['text'], args.max_chars)))
        replies = c['replies']
        if args.tam:
            shown = replies
        else:
            others = [r for r in replies if not r['owner']][:args.cevap_max]
            shown = [r for r in replies if r['owner'] or r in others]
        for r in shown:
            out.append('  - ↳ %s %s' % (label(r), clean(r['text'], args.max_chars)))
        if len(shown) < len(replies):
            out.append('  - (+%d cevap gosterilmedi)' % (len(replies) - len(shown)))
    return '\n'.join(out) + '\n'


def check(data):
    """(durum, aciklama) dondurur. HATA: dosyada basliktakinden az yorum var (veri kaybi)."""
    mains = data['mains']
    got_reply = sum(len(m['replies']) for m in mains)
    got_owner = sum(m['owner'] for m in mains) + sum(r['owner'] for m in mains for r in m['replies'])
    exp = data['expected']
    if not data['has_section']:
        return 'UYARI', 'yorum bolumu bulunamadi'
    if exp is None:
        return 'UYARI', 'yorum basligindaki sayilar okunamadi (ana %d, cevap %d)' % (len(mains), got_reply)
    status, notes = 'OK', []

    def worse(new):
        nonlocal status
        if new == 'HATA' or status == 'OK':
            status = new

    notes.append('ana %d/%d' % (len(mains), exp['main']))
    if len(mains) < exp['main']:
        worse('HATA')
    elif len(mains) > exp['main']:
        worse('UYARI')
    notes.append('cevap %d/%d' % (got_reply, exp['reply']))
    if got_reply < exp['reply']:
        worse('HATA')
    elif got_reply > exp['reply']:
        worse('UYARI')
        notes.append('dosyada basliktakinden fazla cevap var')
    if data['dup']:
        notes.append('%d yinelenen cevap silindi' % data['dup'])
    if exp['owner'] is not None and got_owner != exp['owner']:
        worse('UYARI')
        notes.append('kanal sahibi %d/%d' % (got_owner, exp['owner']))
    if data['joined']:
        notes.append('%d bolum bos satirdan sonra onceki yoruma eklendi' % data['joined'])
    if data['unparsed']:
        worse('UYARI')
        notes.append('%d taninmayan satir' % data['unparsed'])
    return status, '; '.join(notes)


def main():
    try:
        sys.stdout.reconfigure(errors='replace')
    except Exception:
        pass
    ap = argparse.ArgumentParser(description='Video .md dosyalarindan yorumlari ayiklar.')
    ap.add_argument('--girdi', default='.', help='video .md dosyalarinin klasoru (varsayilan: bulundugun klasor)')
    ap.add_argument('--tam', action='store_true', help='secim yapma, tum yorumlari kisaltmadan yaz')
    ap.add_argument('--limit', type=int, default=100, help='video basina en fazla ana yorum (varsayilan 100)')
    ap.add_argument('--max-chars', type=int, default=300, help='yorum basina en fazla karakter, 0 = sinirsiz')
    ap.add_argument('--cevap-max', type=int, default=3, help='ana yorum basina gosterilecek cevap (kanal sahibinin cevaplari hep gosterilir)')
    ap.add_argument('--videolar', nargs='*', help='sadece bu video numaralari, ornek: 002 015 048')
    args = ap.parse_args()
    if args.tam:
        args.max_chars = 0

    src = Path(args.girdi)
    files = sorted(p for p in src.glob('*.md') if re.match(r'^\d{3}_', p.name))
    if args.videolar:
        wanted = {v.zfill(3) for v in args.videolar}
        files = [p for p in files if p.name[:3] in wanted]
    if not files:
        print('Video dosyasi bulunamadi (beklenen ad: 001_...md). Klasor: %s' % src.resolve())
        sys.exit(1)

    out_dir = src / ('yorumlar_tam' if args.tam else 'yorumlar_secili')
    out_dir.mkdir(exist_ok=True)
    report = []
    bad = warn = 0
    for p in files:
        no = p.name[:3]
        data = parse(p)
        picks = [(c, 'tam') for c in data['mains']] if args.tam else select(data['mains'], args.limit)
        (out_dir / p.name).write_text(render(no, data, picks, args), encoding='utf-8')
        status, note = check(data)
        bad += status == 'HATA'
        warn += status == 'UYARI'
        line = '%s | %-5s | %s | secilen ana yorum: %d' % (no, status, note, len(picks))
        report.append(line)
        for smp in data['samples']:
            report.append('      ornek devam satiri: ' + smp)
        print(line)

    summary = 'Toplam %d video: %d OK, %d UYARI, %d HATA. Cikti klasoru: %s' % (
        len(files), len(files) - bad - warn, warn, bad, out_dir.resolve())
    report += ['', summary]
    (src / 'dogrulama_raporu.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
    print('\n' + summary)
    if bad:
        print('HATA olan videolari bana bildir; script ayrisim kuralini duzeltmem gerek.')


if __name__ == '__main__':
    main()
