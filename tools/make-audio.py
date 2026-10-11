#!/usr/bin/env python3
"""Make mp3 voices for the Listening questions.

Reads portal/audio/script.csv (id, line1, line2) and writes
portal/audio/<voice>/<id>.mp3 for each of 4 voices. Uses the free Kokoro
text-to-speech (Apache-2.0) and ffmpeg. Runs on Michael's Mac only - this
file is NOT uploaded to the live site.

Run:
  ~/kokoro-env/bin/python tools/make-audio.py              # only makes files that don't exist yet
  ~/kokoro-env/bin/python tools/make-audio.py --force      # remake everything
  ~/kokoro-env/bin/python tools/make-audio.py --ids 212 1040   # just these questions (remade)

For a two-line dialogue, line 2 is read by the partner voice
(us_woman <-> us_man, uk_woman <-> uk_man) after a short pause.
"""
import argparse, csv, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from kokoro import KPipeline

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, 'portal', 'audio', 'script.csv')
OUTDIR = os.path.join(ROOT, 'portal', 'audio')

# folder name -> (Kokoro language code, Kokoro voice, partner folder)
VOICES = {
    'us_woman': ('a', 'af_heart',   'us_man'),
    'us_man':   ('a', 'am_michael', 'us_woman'),
    'uk_woman': ('b', 'bf_alice',   'uk_man'),
    'uk_man':   ('b', 'bm_lewis',   'uk_woman'),
}
# "quarter after" is American, so these ids get no UK voices.
SKIP_UK = {'1198'}
RATE  = 24000
PAUSE = 0.5   # seconds between the two lines of a dialogue

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--ids', nargs='*')
    a = ap.parse_args()

    rows = list(csv.DictReader(open(SCRIPT, encoding='utf-8')))
    if a.ids:
        rows = [r for r in rows if r['id'] in set(a.ids)]
    pipes = {}
    def speak(text, voice_name):
        lang, voice, _ = VOICES[voice_name]
        if lang not in pipes:
            pipes[lang] = KPipeline(lang_code=lang, repo_id='hexgrad/Kokoro-82M')
        return np.concatenate([np.asarray(x) for _, _, x in pipes[lang](text, voice=voice)])

    made = skipped = 0
    for r in rows:
        for vname in VOICES:
            if vname.startswith('uk_') and r['id'] in SKIP_UK:
                continue
            out = os.path.join(OUTDIR, vname, r['id'] + '.mp3')
            if os.path.exists(out) and not (a.force or a.ids):
                skipped += 1
                continue
            parts = [speak(r['line1'], vname)]
            if r['line2'].strip():
                parts += [np.zeros(int(PAUSE * RATE), dtype=np.float32), speak(r['line2'], VOICES[vname][2])]
            audio = np.concatenate(parts)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with tempfile.TemporaryDirectory() as td:
                wav = os.path.join(td, 'x.wav')
                sf.write(wav, audio, RATE)
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-b:a', '64k', out], check=True)
            made += 1
        print('done id', r['id'], flush=True)
    print(f'made {made} files, skipped {skipped} that already existed')

if __name__ == '__main__':
    main()
