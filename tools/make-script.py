#!/usr/bin/env python3
"""Rebuild portal/audio/script.csv (the sentences the mp3 voices read) from portal/homework-content.csv.

Same rule the Listen button uses (portal/components/listen.js):
  - only type=listening rows
  - the spoken text is every "double-quoted" part after the words "You hear" (or from the start if there is no "You hear")
  - 2 quoted parts = a two-person dialogue (line1, line2)
Run on the Mac only (never uploaded):
  python3 tools/make-script.py            # rewrites portal/audio/script.csv
Then make the audio:  ~/kokoro-env/bin/python tools/make-audio.py   (only makes files that don't exist yet)
"""
import csv, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'portal', 'homework-content.csv')
OUT = os.path.join(ROOT, 'portal', 'audio', 'script.csv')

rows = []
for r in csv.DictReader(open(SRC, encoding='utf-8')):
    if r['type'].strip().lower() != 'listening':
        continue
    s = r['question']
    m = re.search(r'you hear', s, re.I)
    start = m.start() if m else 0
    spoken = [x.strip() for x in re.findall(r'"([^"]+)"', s[start:])]
    if not spoken:
        print('COULD NOT PARSE id', r['id'], s)
        continue
    rows.append((r['id'], spoken[0], spoken[1] if len(spoken) > 1 else ''))

with open(OUT, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['id', 'line1', 'line2'])
    w.writerows(rows)
print(f'{len(rows)} listening questions written to {OUT} ({sum(1 for r in rows if r[2])} dialogues)')
