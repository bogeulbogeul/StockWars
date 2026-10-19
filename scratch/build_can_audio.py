import math, random, struct, wave
from pathlib import Path

random.seed(42)
rate = 44100
samples = []
previous = 0.0
for i in range(int(rate * 2.2)):
    t = i / rate
    noise = random.uniform(-1, 1)
    high = noise - previous
    previous = noise
    pop = max(0, t - .28)
    value = 0.0
    if .28 <= t < .4:
        value += .42 * math.exp(-pop * 55) * (math.sin(2 * math.pi * 1900 * pop) + .5 * noise)
    if .35 <= t < 1.95:
        value += .075 * math.exp(-(t - .35) * 2.5) * high
    for j in range(16):
        u = t - (.45 + j * .077)
        if 0 <= u < .1:
            value += .045 * math.exp(-u * 48) * math.sin(2 * math.pi * ((700 + j % 5 * 150) * u - 1700 * u * u))
    samples.append(struct.pack('<h', round(max(-1, min(1, value)) * 32767)))
out = Path(__file__).resolve().parent.parent / 'web/assets/effects/energy-drink-opening-v1/can-open-fizz.wav'
with wave.open(str(out), 'wb') as stream:
    stream.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
    stream.writeframes(b''.join(samples))
print(out)
