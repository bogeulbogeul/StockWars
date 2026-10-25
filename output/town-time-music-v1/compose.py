"""Original town underscore, 4 time-of-day pieces. Python + numpy.
All release and reverb tails wrap into the beginning of the exact loop.
No third-party recordings, melodies, or soundfonts are used.
"""
from pathlib import Path
import json, math, struct, wave
import numpy as np

ROOT = Path(__file__).resolve().parent
SR = 44100
CONFIGS = [
 dict(id='dawn',title='이슬이 깨우는 마을',bpm=72,key='D major',sf=2,
      mood='여린 오르골과 공기감 있는 플루트, 느린 발현 반주',
      roots=[50,47,43,45,54,47,40,45],
      chords=[[62,66,69,73],[62,66,69,71],[62,66,67,71],[61,64,69,71],[61,64,66,69],[62,66,69,71],[62,64,67,71],[61,64,67,69]],
      lead='flute',arp='harp',pattern=[0,2,1,3],density=4,
      phrases=[[(66,1),(69,1),(73,1),(71,1)],[(69,1.5),(66,.5),(62,1),(None,1)],[(67,1),(71,1),(69,2)],[(64,1),(61,1),(None,2)],[(66,1),(69,.5),(73,.5),(76,2)],[(74,1),(71,1),(69,1),(66,1)],[(64,1.5),(67,.5),(71,1),(69,1)],[(66,1),(64,1),(None,2)]]),
 dict(id='day',title='햇살 따라 한 걸음',bpm=100,key='G major',sf=1,
      mood='짧은 기타와 목재 타악기, 밝고 가벼운 베이스',
      roots=[43,50,40,47,48,43,45,50],
      chords=[[59,62,67,69],[57,62,66,69],[59,62,64,67],[59,62,66,69],[60,64,67,71],[59,62,67,71],[57,60,64,67],[57,60,62,66]],
      lead='wood',arp='guitar',pattern=[0,2,1,2,3,2,1,2],density=8,
      phrases=[[(67,.5),(71,.5),(74,1),(71,.5),(69,.5),(None,1)],[(69,.5),(66,.5),(62,1),(66,1),(None,1)],[(67,.5),(71,.5),(76,1),(74,1),(71,1)],[(69,1),(66,.5),(62,.5),(None,2)],[(72,.5),(71,.5),(67,1),(64,1),(67,1)],[(71,1),(74,.5),(71,.5),(69,1),(67,1)],[(69,.5),(72,.5),(76,1),(72,1),(69,1)],[(66,1),(69,1),(62,1),(None,1)]]),
 dict(id='sunset',title='노을빛 귀갓길',bpm=80,key='D major',sf=2,
      mood='따뜻한 전기피아노와 부드러운 기타, 넓은 화음',
      roots=[43,45,54,47,40,45,50,50],
      chords=[[59,62,66,69],[57,61,64,69],[57,61,64,68],[59,62,66,69],[55,59,62,66],[57,61,64,67],[57,61,62,66],[57,59,62,66]],
      lead='piano',arp='guitar',pattern=[0,2,1,3],density=4,
      phrases=[[(71,1.5),(69,.5),(66,1),(62,1)],[(64,1),(69,1),(73,1),(None,1)],[(73,1.5),(68,.5),(66,2)],[(69,1),(66,1),(62,1),(None,1)],[(67,1),(66,.5),(64,.5),(62,2)],[(64,1),(61,1),(69,1),(None,1)],[(66,1),(69,1),(74,1.5),(73,.5)],[(69,1.5),(66,.5),(None,2)]]),
 dict(id='night',title='별이 머무는 창가',bpm=64,key='D major / B minor',sf=2,
      mood='낮은 펠트피아노와 드문 유리종, 긴 패드',
      roots=[47,43,50,45,40,43,47,45],
      chords=[[54,57,61,62],[55,59,62,66],[54,57,61,64],[52,57,59,61],[52,55,59,62],[55,57,62,66],[54,57,61,62],[52,55,57,61]],
      lead='felt',arp='glass',pattern=[0,2],density=2,
      phrases=[[(66,2),(62,1),(None,1)],[(62,1.5),(59,.5),(None,2)],[(61,2),(64,1),(None,1)],[(61,1),(59,1),(None,2)],[(59,1.5),(62,.5),(66,1),(None,1)],[(67,2),(66,1),(62,1)],[(61,1.5),(62,.5),(66,1),(None,1)],[(64,1),(61,1),(None,2)]])
]

def sound(freq, seconds, voice):
    tail = {'pad':1.8,'flute':.22,'bass':.18,'wood':.2}.get(voice,1.2)
    t=np.arange(round((seconds+tail)*SR))/SR
    ph=2*np.pi*freq*t
    release=np.clip((seconds+tail-t)/tail,0,1)**2
    if voice=='pad':
        attack=1-np.exp(-t/0.45)
        # Per-note detuned partials; complete sample tail is folded into loop.
        s=(np.sin(ph)+.25*np.sin(ph*1.0015)+.10*np.sin(ph*2))*.5
        return s*attack*release*np.exp(-t*.12)
    if voice=='flute':
        s=np.sin(ph+.012*np.sin(2*np.pi*4.7*t))+.13*np.sin(ph*2)+.035*np.sin(ph*3)
        env=(1-np.exp(-t/.07))*np.exp(-t*.55)*release
    elif voice=='bass':
        s=np.sin(ph)+.16*np.sin(ph*2)
        env=(1-np.exp(-t/.018))*np.exp(-t*1.8)*release
    else:
        decay={'guitar':3.5,'harp':2.4,'glass':1.9,'piano':1.6,'felt':1.5,'wood':6.5}[voice]
        if voice=='wood': s=np.sin(ph)+.28*np.sin(ph*3)*np.exp(-t*12)
        elif voice=='glass': s=np.sin(ph)+.13*np.sin(ph*2.003)*np.exp(-t*3)
        elif voice=='felt': s=np.sin(ph)+.18*np.sin(ph*2)*np.exp(-t*2)+.035*np.sin(ph*3)
        else: s=np.sin(ph)+.24*np.sin(ph*2)*np.exp(-t*2)+.09*np.sin(ph*3)*np.exp(-t*4)
        env=(1-np.exp(-t/.006))*np.exp(-t*decay)*release
    return s*env

def vlq(n):
    data=[n&127]; n>>=7
    while n: data.insert(0,(n&127)|128); n>>=7
    return bytes(data)

def midi(path,events,cfg):
    tempo=round(60_000_000/cfg['bpm'])
    tracks=[b'\x00\xff\x51\x03'+tempo.to_bytes(3,'big')+b'\x00\xff\x58\x04\x04\x02\x18\x08'+b'\x00\xff\x59\x02'+bytes([cfg['sf'],0])+b'\x00\xff\x2f\x00']
    voices=list(dict.fromkeys(e[3] for e in events))
    programs={'flute':73,'harp':46,'guitar':24,'bass':32,'pad':89,'wood':12,'piano':4,'felt':0,'glass':8}
    for ch,voice in enumerate(voices):
        seq=[]
        for b,p,d,v,g,pan in events:
            if v!=voice: continue
            seq.append((round(b*480),bytes([0x90+ch,p,max(28,min(100,round(g*350)))])))
            seq.append((min(96*480,round((b+d)*480)),bytes([0x80+ch,p,0])))
        seq.sort(key=lambda x:x[0]);name=voice.encode()
        data=bytearray(b'\x00\xff\x03'+vlq(len(name))+name+bytes([0,0xc0+ch,programs[voice]]));last=0
        for tick,msg in seq: data.extend(vlq(tick-last)+msg);last=tick
        data.extend(vlq(96*480-last)+b'\xff\x2f\x00');tracks.append(data)
    with path.open('wb') as f:
        f.write(b'MThd'+struct.pack('>IHHH',6,1,len(tracks),480))
        for tr in tracks: f.write(b'MTrk'+struct.pack('>I',len(tr))+tr)

manifest=[]
for cfg in CONFIGS:
    events=[]
    def add(b,p,d,v,g,pan=0): events.append((b,p,d,v,g,pan))
    for bar in range(24):
        k=bar%8;b=bar*4; chord=cfg['chords'][k];bass=cfg['roots'][k]
        add(b,bass,2.7 if cfg['id']=='night' else 1.7,'bass',.13,0)
        if cfg['id']!='night': add(b+2,bass+7,1.3,'bass',.09,0)
        for p in chord: add(b,p,3.6,'pad',.032,.25)
        for step in range(cfg['density']):
            offset=step*4/cfg['density']
            p=chord[cfg['pattern'][step%len(cfg['pattern'])]]
            if cfg['id']=='night': p+=12
            add(b+offset+.04,p,.7,cfg['arp'],.075 if cfg['id']!='night' else .045,-.32)
        # A, contrasting B, A with small answering phrases; deliberate rests.
        phrase=cfg['phrases'][k]
        if 8<=bar<16:
            phrase=cfg['phrases'][(k+4)%8]
            # Revoice to current harmony so the middle section stays consonant.
            phrase=[(None if p is None else min([q+12 for q in chord],key=lambda q:abs(q-p)),d) for p,d in phrase]
        pos=b+.25
        for p,d in phrase:
            if p is not None: add(pos,p,min(d*.78,96-pos),cfg['lead'],.14 if cfg['id']!='night' else .105,.08)
            pos+=d
        if bar>=16 and k in (1,3,5):
            add(b+3.25,chord[2]+12,.32,cfg['arp'],.048,.45)
    beat=60/cfg['bpm'];n=round(96*beat*SR)
    mix=np.zeros((n,2),dtype=np.float64)
    for b,p,d,v,g,pan in events:
        s=sound(440*2**((p-69)/12),d*beat,v)*g
        start=round(b*beat*SR)%n
        stereo=s[:,None]*np.array([math.sqrt((1-pan)/2),math.sqrt((1+pan)/2)])
        end=min(len(s),n-start)
        mix[start:start+end]+=stereo[:end]
        if end<len(s): mix[:len(s)-end]+=stereo[end:]
    dry=mix.copy()
    for delay,gain in ((.089,.11),(.173,.075),(.293,.045)):
        mix+=np.roll(dry[:,::-1],round(delay*SR),axis=0)*gain
    mix-=mix.mean(axis=0)
    # Match RMS across time periods while retaining generous peaks/headroom.
    raw_rms=float(np.sqrt(np.mean(mix**2)))
    scale=min(.082/raw_rms,.70/float(np.max(np.abs(mix))))
    mix*=scale
    pcm=np.round(mix*32767).astype('<i2')
    name=cfg['id']+'-loop'
    with wave.open(str(ROOT/(name+'.wav')),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
    midi(ROOT/(name+'.mid'),events,cfg)
    step=np.abs(np.diff(mix,axis=0))
    seam=float(np.max(np.abs(mix[0]-mix[-1])))
    info={k:cfg[k] for k in ('id','title','bpm','key','mood')}
    info.update(wav=name+'.wav',midi=name+'.mid',bars=24,durationSeconds=n/SR,sampleRate=SR,channels=2,loopStartSample=0,loopEndSampleExclusive=n,peakDbfs=round(20*np.log10(np.max(np.abs(mix))),2),rmsDbfs=round(20*np.log10(np.sqrt(np.mean(mix**2))),2),clippedSamples=int(np.sum(np.abs(pcm.astype(np.int32))>=32767)),boundaryStep=seam,maxAdjacentStep=float(step.max()),notes=len(events))
    assert np.isfinite(mix).all() and info['clippedSamples']==0
    assert seam<float(step.max()),'Unexpected loop discontinuity'
    manifest.append(info)
    print(json.dumps(info,ensure_ascii=False),flush=True)
(ROOT/'manifest.json').write_text(json.dumps({'version':1,'tracks':manifest,'transitionSuggestionSeconds':6,'status':'audio assets only; not connected to game','loopMethod':'periodic tail wrapping, exact full-file sample loop','loudnessMethod':'RMS matched; not measured LUFS'},ensure_ascii=False,indent=2),encoding='utf-8')
