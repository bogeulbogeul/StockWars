import math, random, struct, wave
from pathlib import Path

random.seed(81)
rate = 44100
strikes = [(0.02,.55),(.16,.35),(.33,.65),(.49,.3),(.61,.17)]
frames = []
for i in range(int(rate * .85)):
    t = i / rate
    value = 0.0
    for start, strength in strikes:
        u = t - start
        if 0 <= u < .22:
            value += strength * (.16 * random.uniform(-1,1) * math.exp(-u*100) +
                .22 * math.exp(-u*29) * (math.sin(2*math.pi*640*u) + .45*math.sin(2*math.pi*1573*u) + .2*math.sin(2*math.pi*2861*u)) +
                .2 * math.exp(-u*42) * math.sin(2*math.pi*145*u))
    frames.append(struct.pack('<h', round(max(-1,min(1,value))*32767)))
out = Path(__file__).resolve().parent.parent / 'web/assets/effects/vending-can-rattle.wav'
out.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(out),'wb') as stream:
    stream.setparams((1,2,rate,0,'NONE','not compressed'))
    stream.writeframes(b''.join(frames))
print(out)
