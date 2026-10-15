import math, random, struct, wave
from pathlib import Path

random.seed(126)
rate = 44100
data = []
previous = 0.0
for i in range(int(rate * 1.05)):
    t = i / rate
    noise = random.uniform(-1, 1)
    high = noise - previous
    previous = noise
    value = 0.0
    # Plastic outlet flap opens, can scrapes over its lip, flap closes.
    for start, strength, frequency in [(0.02,.7,420),(.10,.3,730),(.68,.6,310),(.75,.25,560)]:
        u = t - start
        if 0 <= u < .17:
            value += strength * (.23 * math.exp(-u*40) * math.sin(2*math.pi*frequency*u)
                + .12 * math.exp(-u*95) * high)
    if .17 <= t < .58:
        u = (t-.17)/.41
        envelope = math.sin(math.pi*u) ** .7
        value += .008 * envelope * high
        value += .06 * envelope * math.exp(-((u-.5)*8)**2) * math.sin(2*math.pi*230*t)
    data.append(struct.pack('<h', round(max(-1,min(1,value))*32767)))
out = Path(__file__).resolve().parent.parent / 'web/assets/effects/vending-can-collect.wav'
with wave.open(str(out),'wb') as stream:
    stream.setparams((1,2,rate,0,'NONE','not compressed'))
    stream.writeframes(b''.join(data))
print(out)
