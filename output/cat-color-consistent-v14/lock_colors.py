"""Common material color ramps, exact-RGB canonical bake, no geometry edits."""
from pathlib import Path
import json
import shutil
import subprocess
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-front-sit-fix-v13'
CLI='C:/Users/bogeu/.codex/skills/sprite-gen/.venv/Scripts/sprite-gen.exe'
manifest=json.loads((SOURCE/'manifest.json').read_text())
layout=manifest['frame_layout']['rows']
source=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
edited=source.copy()
records=[]
done=set()

def cell(a,r):
    return a[r['y']:r['y']+512,r['x']:r['x']+512]

def common_rgb(colors,mode):
    c=colors.astype(float)
    out=c.copy()
    r,g,b=c.T
    neutral=np.ptp(c,axis=1)<35
    fur=neutral&(r>=30)&(r<80)
    # A single smooth ramp retains tuft details and prevents threshold speckles.
    value=np.clip(np.rint(r+65-mode),30,81)
    out[fur]=np.stack([value,value-6,value-3],axis=1)[fur]
    brow=neutral&(r>=80)&(r<125)
    v=np.rint(r+2)
    out[brow]=np.stack([v,v-11,v-7],axis=1)[brow]
    ink=neutral&(r<30)
    v=np.maximum(2,np.rint(r))
    out[ink]=np.stack([v,np.maximum(1,v-1),v],axis=1)[ink]
    pink=(r>150)&(g>65)&(b>60)&(r>g*1.2)
    t=np.clip((g-137)/20,0,1)
    out[pink]=np.stack([238+16*t,137+20*t,104+16*t],axis=1)[pink]
    white=neutral&(r>=125)
    v=np.clip(np.rint(c.mean(axis=1)),125,249)
    out[white]=np.stack([v,v,v],axis=1)[white]
    gold=(r>55)&(g>b+20)&(r>b+55)&(b<90)&~pink
    t=np.clip((g-20)/146,0,1)
    out[gold]=np.stack([37+212*t,20+146*t,7+t],axis=1)[gold]
    return np.clip(np.rint(out),0,255).astype('uint8')

for state,rows in layout.items():
    for i,r in enumerate(rows):
        key=(r['x'],r['y'])
        if key in done:
            continue
        done.add(key)
        a=cell(source,r)
        rgb=a[:,:,:3]
        anchor=(a[:,:,3]>200)&(np.ptp(rgb.astype('int16'),axis=2)<25)&(rgb[:,:,0]>=57)&(rgb[:,:,0]<=73)
        mode=int(np.bincount(rgb[:,:,0][anchor]).argmax())
        unique=np.unique(rgb[a[:,:,3]>0],axis=0)
        target=common_rgb(unique,mode)
        hx=lambda c:'#%02X%02X%02X'%tuple(c)
        mapping={hx(c):hx(t) for c,t in zip(unique,target)}
        name=f'{state}-{i}'
        folder=ROOT/'bake-input'
        folder.mkdir(exist_ok=True,parents=True)
        Image.fromarray(a).save(folder/f'{name}.png')
        spec=dict(version=1,kind='sprite-gen-recolor',match='exact',tolerance=0,
                  variants=[dict(name=name,map=mapping)])
        (folder/f'{name}.json').write_text(json.dumps(spec),encoding='utf-8')
        subprocess.run([CLI,'recolor','--base',str(folder/f'{name}.png'),
            '--spec',str(folder/f'{name}.json'),'--out-dir',str(ROOT/'baked'),
            '--report',str(ROOT/'baked'/f'{name}.report.json'),'--alpha-threshold','0'],
            check=True,capture_output=True)
        baked=np.array(Image.open(ROOT/'baked'/f'{name}.png').convert('RGBA'))
        cell(edited,r)[:]=baked
        expected=common_rgb(np.array([[mode,mode-6,mode-3]],dtype='uint8'),mode)[0]
        assert np.array_equal(expected,[65,59,62])
        records.append(dict(state=state,frame=i,source_base_red=mode,
                            locked_base_rgb=expected.tolist()))
for d in ['down','right','up']:
    cell(edited,layout[d+'_idle'][0])[:]=cell(edited,layout[d+'_walk'][1])
assert np.array_equal(source[:,:,3],edited[:,:,3])
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        Image.fromarray(cell(edited,r)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-color-consistent-v14',production='Exact-RGB material-ramp normalization baked with sprite-gen recolor. Shared fur base65,59,62, smooth common shade/brow/ear/eye ramps, alpha and every pose unchanged.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,alpha_identical=True,layout_identical=True,animation_identical=True,
    fur_base_rgb=[65,59,62],base_rgb_difference=0,frames=records,game_installed=False,
    note='Shadow coverage follows each drawing; identical material ramps do not mean identical per-frame whole-body average brightness.')
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(ROOT/'preview.html').write_text((SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 정면 앉기 자세 수정 v13','고양이 전체 PNG 공통 RGB v14'),encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
