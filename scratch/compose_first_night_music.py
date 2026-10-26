"""An original 18-second instrumental cue for Somangi's first-night storybook."""
from pathlib import Path
import json
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/first-night-music-v1'
OUT.mkdir(exist_ok=True)
SR, SECONDS = 44100, 18
audio = np.zeros((SR * SECONDS, 2), dtype=np.float64)


def play(midi, start, length, gain, box=False, pan=0):
    t = np.arange(int((length + 4) * SR)) / SR
    hz = 440 * 2 ** ((midi - 69) / 12)
    signal = np.zeros_like(t)
    partials = [(1, 1, 2.4), (2, .09, 1), (3.01, .025, .6)] if box else [
        (1, 1, 2.9), (2, .17, 1.4), (3, .04, .8)]
    for ratio, amplitude, decay in partials:
        tone = np.sin(2 * np.pi * hz * ratio * t)
        if not box:
            tone = .6 * tone + .4 * np.sin(2 * np.pi * hz * ratio * 1.0005 * t)
        signal += amplitude * tone * np.exp(-t / decay)
    signal *= (1 - np.exp(-t / (.01 if box else .025)))
    signal *= np.exp(-np.maximum(t - length, 0) / .9) * gain
    offset = int(start * SR)
    count = min(len(signal), len(audio) - offset)
    audio[offset:offset + count] += signal[:count, None] * np.sqrt([(1-pan)/2, (1+pan)/2])


# A minor's hesitation, a soft F major cradle, then home in C major.
# Space between notes accompanies the two captions and the eye-closing dissolve.
for start, bass, chord in [(.25, 45, [57, 60, 64]), (4.25, 41, [57, 60, 65]),
                           (8.25, 43, [55, 59, 62]), (12.25, 48, [55, 60, 64])]:
    play(bass, start, 3.8, .10, pan=-.12)
    for step, index in enumerate([0, 1, 2, 1]):
        play(chord[index], start + .55 + step * .8, 2.3, .045, pan=-.22 + index * .16)

for start, midi, held in [
    (1.1, 76, 1.4), (2.9, 74, 1.4), (4.7, 72, 1.6),
    (6.5, 69, 1.5), (8.5, 71, 1.3), (10.3, 74, 1.1),
    (12.1, 72, 1.5), (14.4, 67, 1.7), (15.4, 72, 2.0),
]:
    play(midi, start, held, .052, box=True, pan=.16)
for midi, delay in [(48, 0), (55, .035), (60, .075), (64, .11)]:
    play(midi, 15.15 + delay, 2, .055 if midi > 50 else .08, pan=-.08)

dry = audio.copy()
for delay, gain in [(.14, .10), (.29, .08), (.48, .06), (.73, .035), (1.07, .018)]:
    shift = int(SR * delay)
    audio[shift:] += dry[:-shift, ::-1] * gain
audio *= np.minimum(np.arange(len(audio)) / (SR * .65), 1)[:, None]
# Follow the visual fade to black at 17 seconds, without an empty trailing tail.
audio *= np.minimum(np.arange(len(audio))[::-1] / (SR * 1.5), 1)[:, None]
audio *= .60 / np.max(np.abs(audio))
assert np.isfinite(audio).all()
pcm = np.round(audio * 32767).astype('<i2')
with wave.open(str(OUT / 'rest-here-tonight.wav'), 'wb') as stream:
    stream.setnchannels(2)
    stream.setsampwidth(2)
    stream.setframerate(SR)
    stream.writeframes(pcm.tobytes())
report = dict(title='오늘은 여기서 쉬어도 돼', durationSeconds=SECONDS,
    kind='Original instrumental; softly synthesized piano and music box; no vocals or external samples',
    peak=float(np.max(np.abs(audio))), sampleRate=SR, gameInstalled=False,
    perSecondRmsDb=[round(20 * float(np.log10(max(1e-10, np.sqrt(np.mean(audio[i*SR:(i+1)*SR]**2))))), 2)
                    for i in range(SECONDS)])
(OUT / 'music-info.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False))
