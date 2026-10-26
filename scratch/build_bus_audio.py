"""Original procedural bus engine loop and pneumatic brake; no external samples."""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 32000
OUT = Path(__file__).resolve().parents[1] / 'web/assets/cinematics/bus/audio'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(104)

def save(name, samples):
    peak = max(abs(v) for v in samples)
    with wave.open(str(OUT / name), 'wb') as audio:
        audio.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        audio.writeframes(b''.join(struct.pack('<h', round(v * 32767)) for v in samples))
    print(name, 'seconds', len(samples) / RATE, 'peak', round(peak, 4))

# Integer-frequency harmonics produce a seamless three-second loop.
partials = [(random.randint(180, 1800), random.random() * math.tau) for _ in range(32)]
engine = []
for i in range(RATE * 3):
    t = i / RATE
    rumble = sum(math.sin(math.tau * 46 * k * t) / k ** 1.6 for k in range(1, 8))
    road = sum(math.sin(math.tau * hz * t + phase) for hz, phase in partials) / 32
    engine.append(.29 * rumble * (1 + .15 * math.sin(math.tau * 8 * t)) + .12 * road)
save('engine-loop.wav', engine)

brake, low = [], 0
for i in range(int(RATE * .85)):
    t = i / RATE
    noise = random.uniform(-1, 1)
    low += .18 * (noise - low)
    envelope = min(t / .035, 1) * (1 - t / .85) ** 2
    brake.append(.38 * (noise - low) * envelope)
save('air-brake.wav', brake)
