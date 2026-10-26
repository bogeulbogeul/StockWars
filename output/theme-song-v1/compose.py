"""Original StockWars theme demo; deterministic synthesis, no external samples."""
from pathlib import Path
from array import array
import math, random, struct, wave, json

ROOT = Path(__file__).resolve().parent
SR, BPM = 32000, 96
BEAT = 60 / BPM
events = []
def note(beat, pitch, length, voice, gain=.3, pan=0):
    events.append((beat, pitch, length, voice, gain, pan))

# D major, 32 bars. A / A' / B / final A; an original eight-bar motif.
chords = [(50, [62,66,69]), (45,[61,64,69]), (47,[62,66,71]), (42,[61,66,69]),
          (43,[62,67,71]), (50,[62,66,69]), (40,[64,67,71]), (45,[61,64,69])]
melody = [
 [(66, .5),(69,.5),(71,1),(69,1),(66,1)],
 [(64,1),(66,.5),(64,.5),(61,1),(64,1)],
 [(62,.5),(66,.5),(69,1),(71,1.5),(69,.5)],
 [(66,1.5),(64,.5),(61,1),(None,1)],
 [(67,.5),(69,.5),(71,1),(74,1),(71,1)],
 [(69,1),(66,1),(64,.5),(66,.5),(62,1)],
 [(64,.5),(67,.5),(71,1),(69,1),(67,1)],
 [(66,1),(64,1),(62,1.5),(None,.5)],
]
bridge = [
 [(71,1),(74,1),(76,1),(74,1)], [(73,1.5),(69,.5),(66,1),(69,1)],
 [(71,.5),(69,.5),(66,1),(62,1),(66,1)], [(69,2),(None,1),(66,1)],
 [(67,1),(71,1),(74,1.5),(71,.5)], [(69,1),(66,1),(74,2)],
 [(76,1),(74,.5),(71,.5),(69,1),(67,1)], [(69,2),(73,1),(None,1)],
]
for bar in range(32):
    base = bar*4
    bass, triad = chords[bar % 8]
    note(base,bass,1.6,'bass',.24,-.1)
    note(base+2,bass+7,1.3,'bass',.18,-.1)
    for step in range(8):
        note(base+step*.5,triad[[0,1,2,1,0,1,2,1][step]],.42,'pluck',.13,-.38)
    if bar >= 8:
        for p in triad:
            note(base,p,3.8,'pad',.055,.32)
        for tick in (1,3):
            note(base+tick,0,.13,'brush',.055,.25)
    phrase = bridge[bar%8] if 16 <= bar <24 else melody[bar%8]
    pos = base
    for p,d in phrase:
        if p is not None:
            note(pos,p,d*.88,'bell',.23,.08)
            if bar >=24:
                note(pos,p+12,d*.7,'bell',.052,-.22)
        pos += d
    if bar in (0,8,16,24):
        note(base,86,2,'bell',.09,.6)
# Resolve and let the last chord ring.
for p in (50,62,66,69,74):
    note(128,p,3.8,'pluck' if p<70 else 'bell',.15,(p-62)/45)

N = int((132*BEAT+2)*SR)
left, right = array('f',[0])*N, array('f',[0])*N
rng = random.Random(20261025)
for beat,pitch,duration,voice,gain,pan in events:
    start = int(beat*BEAT*SR)
    dur = duration*BEAT
    tail = .8 if voice in ('pluck','bell') else .06
    count = min(int((dur+tail)*SR),N-start)
    freq = 440*2**((pitch-69)/12)
    gl,gr = gain*math.sqrt((1-pan)/2),gain*math.sqrt((1+pan)/2)
    for i in range(count):
        t = i/SR
        phase = 2*math.pi*freq*t
        release = min(1,max(0,(dur+tail-t)/max(tail,.02)))
        if voice=='pluck':
            s=(math.sin(phase)+.3*math.sin(2*phase)+.12*math.sin(3*phase))*math.exp(-4*t)*min(1,t/.006)*release
        elif voice=='bell':
            s=(math.sin(phase)+.24*math.sin(2*phase)*math.exp(-3*t)+.10*math.sin(3*phase))*math.exp(-2.5*t)*min(1,t/.008)*release
        elif voice=='bass':
            s=(math.sin(phase)+.18*math.sin(2*phase))*math.exp(-2*t)*min(1,t/.012)*release
        elif voice=='pad':
            s=(math.sin(phase)+.18*math.sin(phase*1.002))*min(1,t/.35)*min(1,max(0,(dur-t)/.4))*.65
        else:
            s=(rng.random()*2-1)*math.exp(-48*t)*min(1,t/.003)
        left[start+i] += s*gl
        right[start+i] += s*gr

# Quiet stereo room taps, peak normalize with headroom, and end fade.
for delay,amount in ((.113,.10),(.197,.075),(.307,.045)):
    shift=int(delay*SR)
    for i in range(N-1,shift-1,-1):
        left[i] += right[i-shift]*amount
        right[i] += left[i-shift]*amount
peak=max(max(abs(x) for x in left),max(abs(x) for x in right))
scale=.88/peak
pcm=array('h')
for i in range(N):
    fade=min(1,i/(SR*.025),(N-1-i)/(SR*1.5))
    pcm.append(round(left[i]*scale*fade*32767))
    pcm.append(round(right[i]*scale*fade*32767))
with wave.open(str(ROOT/'small-leaf-tomorrow.wav'),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())

def vlq(n):
    out=[n&127];n>>=7
    while n: out.insert(0,(n&127)|128);n>>=7
    return bytes(out)
tracks=[]
meta=b'\x00\xff\x51\x03'+int(60_000_000/BPM).to_bytes(3,'big')+b'\x00\xff\x58\x04\x04\x02\x18\x08\x00\xff\x59\x02\x02\x00\x00\xff\x2f\x00'
tracks.append(meta)
for channel,(voice,program) in enumerate([('bell',10),('pluck',24),('bass',32),('pad',89)]):
    seq=[]
    for b,p,d,v,g,pan in events:
        if v==voice:
            seq.extend([(round(b*480),bytes([0x90+channel,p,min(110,max(30,int(g*260)))])),(round((b+d)*480),bytes([0x80+channel,p,0]))])
    seq.sort(key=lambda x:x[0]);data=bytearray([0,0xc0+channel,program]);last=0
    for tick,msg in seq:
        data.extend(vlq(tick-last));data.extend(msg);last=tick
    data.extend(b'\x00\xff\x2f\x00');tracks.append(bytes(data))
with open(ROOT/'small-leaf-tomorrow.mid','wb') as f:
    f.write(b'MThd'+struct.pack('>IHHH',6,1,len(tracks),480))
    for tr in tracks:f.write(b'MTrk'+struct.pack('>I',len(tr))+tr)
stats={'title':'작은 잎의 내일','bpm':BPM,'key':'D major','duration_seconds':N/SR,'sample_rate':SR,'channels':2,'peak_dbfs':20*math.log10(.88),'notes':len(events),'status':'instrumental synthesis demo; not installed in game'}
(ROOT/'validation.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(stats,ensure_ascii=False))
