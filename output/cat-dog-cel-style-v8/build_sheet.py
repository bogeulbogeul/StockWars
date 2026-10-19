"""Bake GPT dog-style cel shadow shapes on the preserved cat sprite material."""
from collections import deque
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image,ImageFilter

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-style-unified-v6'
manifest=json.loads((SOURCE/'manifest.json').read_text())
layout=manifest['frame_layout']['rows']
original=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
edited=original.copy()
generated=Image.open(ROOT/'cel-generated.png').convert('RGB').resize((1024,1024))
states=['down_walk','right_walk','up_walk','right_carry']
poses=[(s,i) for s in states for i in range(4 if s=='right_carry' else 3)]
poses += [('down_sit',0),('right_sit',0),('face_portrait',0)]
BASE=np.array([65,59,62],dtype=np.uint8)
SHADOW=np.array([51,45,48],dtype=np.uint8)

def cell(array,r):
    return array[r['y']:r['y']+512,r['x']:r['x']+512]

def remove_specks(mask,minimum=45):
    seen=np.zeros(mask.shape,bool)
    cleaned=mask.copy()
    for sy,sx in np.argwhere(mask):
        if seen[sy,sx]:
            continue
        seen[sy,sx]=True
        queue=deque([(sy,sx)])
        component=[]
        while queue:
            y,x=queue.popleft()
            component.append((y,x))
            for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0<=yy<512 and 0<=xx<512 and mask[yy,xx] and not seen[yy,xx]:
                    seen[yy,xx]=True
                    queue.append((yy,xx))
        if len(component)<minimum:
            ys,xs=zip(*component)
            cleaned[ys,xs]=False
    return cleaned

records=[]
for j,(state,i) in enumerate(poses):
    r=layout[state][i]
    src=cell(original,r)
    dst=cell(edited,r)
    g=np.array(generated.crop(((j%4)*256,(j//4)*256,(j%4+1)*256,(j//4+1)*256)).resize((512,512)),float)
    fur=(src[:,:,3]>0)&np.all(src[:,:,:3]==BASE,axis=2)
    valid=fur&(np.ptp(g,axis=2)<27)&(g.mean(axis=2)>30)&(g.mean(axis=2)<95)
    levels=g.mean(axis=2)
    mid=float(np.median(levels[valid]))
    # Classify the GPT-drawn shadow shapes into exactly one common cel tone.
    # Median filtering removes isolated resampling pixels, without gradients.
    mask=valid&(levels<mid-6)
    mask=np.array(Image.fromarray(mask.astype('uint8')*255).filter(ImageFilter.MedianFilter(5)))>127
    mask=remove_specks(mask&fur)
    dst[mask,:3]=SHADOW
    assert set(map(tuple,np.unique(dst[fur,:3],axis=0)))<={tuple(BASE),tuple(SHADOW)}
    records.append(dict(state=state,frame=i,generated_midtone=mid,
                        fur_pixels=int(fur.sum()),shadow_pixels=int(mask.sum()),
                        shadow_fraction=round(float(mask.sum()/fur.sum()),4)))
for d in ['down','right','up']:
    cell(edited,layout[d+'_idle'][0])[:]=cell(edited,layout[d+'_walk'][1])
assert np.array_equal(edited[:,:,3],original[:,:,3])
nonfur=~np.all(original[:,:,:3]==BASE,axis=2)
assert np.array_equal(edited[nonfur],original[nonfur])
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        Image.fromarray(cell(edited,r)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-dog-cel-style-v8',
    production='GPT style-reference edit using approved dog sheet as sole style master. Discrete two-tone charcoal cel shading baked on preserved cat fur. Cat alpha, linework, eyes, ears, brows, pose and layout preserved.',
    style_reference='../dog-rgb-motion-v1/sprite-sheet-alpha.png')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,alpha_identical=True,nonfur_identical=True,
    layout_identical=manifest['frame_layout']==json.loads((SOURCE/'manifest.json').read_text())['frame_layout'],
    animation_identical=manifest['animation']==json.loads((SOURCE/'manifest.json').read_text())['animation'],
    fur_palette=[BASE.tolist(),SHADOW.tolist()],fur_gradient_colors=0,
    generated_source='cel-generated.png',frames=records,game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
preview=(SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 전체 그림체·색 통일 v6','강아지 그림체·셀 명암 기준 고양이 v8')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
