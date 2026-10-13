#!/usr/bin/env python3
"""
212 English: make real voices for the Conversation questions with Kokoro (free, runs on this Mac).
F = American woman (af_heart), M = American man (am_michael).
Run:  ~/kokoro-env/bin/python tools/conversation-voices/make_voices.py   (from the project folder)
Makes one file per question in portal/audio/conversation/: <id>.m4a (needs conversation-voices.csv next to this script: id,line,voice F/M,text)
Skips files that already exist, so you can stop (Ctrl+C) and run again.
"""
import csv, os, subprocess, sys
import numpy as np, soundfile as sf
from kokoro import KPipeline

HERE = os.path.dirname(os.path.abspath(__file__))
LIST = os.path.join(HERE, "conversation-voices.csv")
# Repo copy: writes straight into the portal folder (the original on the Desktop wrote next to the script)
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "portal", "audio", "conversation"))
VOICE = {"F": "af_heart", "M": "am_michael"}
RATE = 24000

def speak(pipe, text, voice):
    parts = [np.asarray(audio, dtype=np.float32) for _, _, audio in pipe(text, voice=voice, speed=0.9)]
    return np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)

def main():
    os.makedirs(OUT, exist_ok=True)
    lines = {}
    for r in csv.DictReader(open(LIST, encoding="utf-8")):
        lines.setdefault(r["id"], []).append(r)
    todo = [i for i in lines if not os.path.exists(os.path.join(OUT, i + ".m4a"))]
    print(f"{len(lines)} conversations, {len(lines) - len(todo)} already done, {len(todo)} to make.")
    print("Loading the voice model (the first time it downloads about 300 MB)...")
    pipe = KPipeline(lang_code="a")
    gap = np.zeros(int(RATE * 0.7), dtype=np.float32)
    lead = np.zeros(int(RATE * 0.3), dtype=np.float32)
    for n, i in enumerate(todo, 1):
        chunks = [lead]
        for r in sorted(lines[i], key=lambda r: int(r["line"])):
            chunks += [speak(pipe, r["text"], VOICE[r["voice"]]), gap]
        wav = os.path.join(OUT, i + ".wav")
        sf.write(wav, np.concatenate(chunks), RATE)
        m4a = os.path.join(OUT, i + ".m4a")
        res = subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000", wav, m4a])
        if res.returncode == 0:
            os.remove(wav)
            print(f"[{n}/{len(todo)}] saved {i}.m4a")
        else:
            print(f"[{n}/{len(todo)}] saved {i}.wav (could not convert to m4a)")
    print("Done. The files are in:", OUT)

if __name__ == "__main__":
    main()
