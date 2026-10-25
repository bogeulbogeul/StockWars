"""Original, synthesized music-box and soft-piano listening sketch."""
from pathlib import Path
import argparse
import json
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--full-opening', action='store_true')
parser.add_argument('--short-opening', action='store_true')
args = parser.parse_args()
FULL = args.full_opening or args.short_opening
SHORT = args.short_opening
OUT = ROOT / 'output' / ('opening-music-110s-v1' if SHORT else 'opening-music-140s-v1' if FULL else 'opening-music-v2')
OUT.mkdir(parents=True, exist_ok=True)
SR = 44100
BPM = 66
BEAT = 60 / BPM
LEAD_IN = 1.0
DURATION = 110 if SHORT else 140 if FULL else LEAD_IN + 64 * BEAT + 7
mix = np.zeros((int(DURATION * SR), 2), dtype=np.float64)
rng = np.random.default_rng(21)


def note(midi, beat, length, velocity, instrument='piano', pan=0):
    start = LEAD_IN + beat * BEAT
    duration = length * BEAT
    tail = 4.8 if instrument == 'box' else 3.8
    t = np.arange(int((duration + tail) * SR)) / SR
    hz = 440 * 2 ** ((midi - 69) / 12)
    if instrument == 'box':
        # A quiet rounded fundamental with the sparse overtones of a tine.
        y = np.zeros_like(t)
        for ratio, amp, decay in [(1, 1, 1.7), (2, .12, .8), (3.01, .055, .5), (5.98, .018, .25)]:
            y += amp * np.sin(2 * np.pi * hz * ratio * t) * np.exp(-t / decay)
        y *= 1 - np.exp(-t / .007)
    else:
        y = np.zeros_like(t)
        for harmonic, amp in [(1, 1), (2, .24), (3, .075), (4, .025)]:
            detune = 1 + .00032 * harmonic
            carrier = .6 * np.sin(2 * np.pi * hz * harmonic * t)
            carrier += .4 * np.sin(2 * np.pi * hz * harmonic * detune * t)
            y += amp * carrier * np.exp(-t / (2.3 / harmonic ** .5))
        y *= 1 - np.exp(-t / .016)
    release = np.exp(-np.maximum(t - duration, 0) / .65)
    y *= release * velocity
    offset = int(start * SR)
    end = min(offset + len(y), len(mix))
    gains = np.sqrt([(1 - pan) / 2, (1 + pan) / 2])
    mix[offset:end] += y[:end-offset, None] * gains


# G major: home, uncertainty, and a gentle return. Four bars per phrase.
chords = [
    (43, [55, 59, 62]), (38, [54, 57, 62]),
    (40, [55, 59, 64]), (36, [55, 60, 64]),
    (43, [55, 59, 62]), (47, [54, 59, 62]),
    (36, [55, 60, 64]), (38, [54, 57, 62]),
    (40, [55, 59, 64]), (36, [55, 60, 64]),
    (43, [55, 59, 62]), (38, [54, 57, 62]),
    (36, [55, 60, 64]), (38, [54, 57, 62]),
    (43, [55, 59, 62]), (43, [55, 59, 62]),
]
# (offset in beats, MIDI pitch, held beats); rests leave room for the story.
melody = [
    [(1, 74, 1), (2, 71, 1), (3, 69, .8)],
    [(0, 69, 1.5), (2, 67, 1.5)],
    [(.5, 67, 1), (1.5, 71, 1), (3, 74, .8)],
    [(0, 76, 2), (2.5, 74, 1)],
    [(.5, 74, 1), (1.5, 79, 1.5), (3, 78, .8)],
    [(0, 74, 2), (2.5, 71, 1)],
    [(0, 72, 1), (1.5, 71, 1), (3, 67, .8)],
    [(0, 69, 2.5)],
    [(.5, 71, 1), (2, 67, 1.5)],
    [(0, 64, 1.5), (2, 67, 1), (3, 72, .8)],
    [(0, 71, 1), (1.5, 74, 1), (3, 79, .8)],
    [(0, 78, 1.5), (2, 74, 1.5)],
    [(.5, 76, 1.5), (2.5, 74, 1)],
    [(0, 72, 1), (1.5, 69, 1), (3, 66, .8)],
    [(0, 67, 1.5), (2, 71, 1), (3, 69, .8)],
    [(0, 67, 3.8)],
]

if FULL:
    # Reprise the opening, linger in the reflective phrase, then return home.
    order = list(range(16)) + ([] if SHORT else list(range(8))) + list(range(4, 16))
    chords = [chords[index] for index in order]
    melody = [melody[index] for index in order]

for bar, ((bass, voicing), phrase) in enumerate(zip(chords, melody)):
    base = bar * 4
    softness = .85 if 8 <= bar < 10 else 1
    note(bass, base, 3.5, .13 * softness, pan=-.13)
    pattern = [(0, 0), (.75, 1), (1.5, 2), (2.5, 1), (3.25, 2)]
    for offset, tone in pattern:
        timing = rng.uniform(-.018, .018)
        note(voicing[tone], base + offset + timing, 1.9,
             rng.uniform(.055, .072) * softness, pan=-.2 + tone * .16)
    for offset, pitch, held in phrase:
        note(pitch, base + offset, held, .085 * softness, 'box', pan=.14)
        # Quiet lower piano doubles only the beginning of each long phrase.
        if bar in (4, 12) and offset == phrase[0][0]:
            note(pitch - 12, base + offset + .03, held, .035, pan=-.1)

# Close with an audible two-bar coda instead of leaving the render tail empty.
for beat, pitch, velocity in [(64, 74, .065), (65, 71, .062),
                              (66, 69, .056), (67, 71, .052), (69, 67, .075)]:
    note(pitch, beat + (48 if SHORT else 80 if FULL else 0), 2.4, velocity, 'box', pan=.12)
for beat, pitch in [(64, 43), (64.1, 55), (65, 59), (66, 62),
                    (67, 59), (68, 55), (69, 43), (69.05, 55),
                    (69.1, 59), (69.15, 62)]:
    note(pitch, beat + (48 if SHORT else 80 if FULL else 0), 2.5, .055 if pitch > 50 else .10, pan=-.1)

dry = mix.copy()
for delay, gain in [(.113, .13), (.229, .10), (.367, .075), (.541, .055), (.793, .035)]:
    shift = int(delay * SR)
    mix[shift:] += dry[:-shift, ::-1] * gain
mix *= np.minimum(np.arange(len(mix)) / (SR * 1.2), 1)[:, None]
mix *= np.minimum(np.arange(len(mix))[::-1] / (SR * 1.5), 1)[:, None]
mix *= .72 / max(np.max(np.abs(mix)), 1e-9)
pcm = np.round(np.clip(mix, -1, 1) * 32767).astype('<i2')
target = OUT / 'first-little-journey.wav'
with wave.open(str(target), 'wb') as stream:
    stream.setnchannels(2)
    stream.setsampwidth(2)
    stream.setframerate(SR)
    stream.writeframes(pcm.tobytes())
(OUT / 'music-info.json').write_text(json.dumps({
    'title': '작은 소망의 첫 여행', 'bpm': BPM, 'key': 'G major',
    'duration_seconds': round(DURATION, 2), 'sample_rate': SR,
    'creation': 'Original composition; additive synthesized music box and piano; no external samples',
    'status': 'Listening sketch; not installed in game',
    'peak': round(float(np.max(np.abs(mix))), 4),
}, ensure_ascii=False, indent=2), encoding='utf-8')
print(target)
print(f'{DURATION:.2f}s stereo; peak {np.max(np.abs(mix)):.3f}; finite: {np.isfinite(mix).all()}')
