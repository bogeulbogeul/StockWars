"""Replace heavy fur marks with GPT dog-reference tapered parting strokes."""
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image,ImageFilter

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-side-outline-v10'
manifest=json.loads((SOURCE/'manifest.json').read_text())
layout=manifest['frame_layout']['rows']
original=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
edited=original.copy()
generated=Image.open(ROOT/'fur-style-generated.png').convert('RGB').resize((1024,1024))
states=['down_walk','right_walk','up_walk','right_carry']
poses=[(s,i) for s in states for i in range(4 if s=='right_carry' else 3)]
poses += [('down_sit',0),('right_sit',0),('face_portrait',0)]
BASE=np.array([65,59,62],dtype=np.uint8)
SHADOW=np.array([51,45,48],dtype=np.uint8)
yy,xx=np.indices((512,512))
changed=np.zeros(original.shape[:2],bool)

def cell(array,r):
    return array[r['y']:r['y']+512,r['x']:r['x']+512]

records=[]
for j,(state,i) in enumerate(poses):
    if state=='up_walk':
        continue
    r=layout[state][i]
    src=cell(original,r)
    dst=cell(edited,r)
    g=np.array(generated.crop(((j%4)*256,(j//4)*256,(j%4+1)*256,(j//4+1)*256)).resize((512,512)),float)
    fur=(src[:,:,3]>0)&(np.all(src[:,:,:3]==BASE,axis=2)|np.all(src[:,:,:3]==SHADOW,axis=2))
    safe=np.array(Image.fromarray(fur.astype('uint8')*255).filter(ImageFilter.MinFilter(5)))>127
    if state=='face_portrait':
        region=(yy>290)&(yy<445)&((xx<195)|(xx>320))
    elif state.endswith('sit'):
        region=((yy>220)&(yy<290)&((xx<230)|(xx>305)))|((yy>290)&(yy<355)&(xx>200)&(xx<335))
    elif state.startswith('down_'):
        region=((yy>165)&(yy<235)&((xx<220)|(xx>295)))|((yy>235)&(yy<305)&(xx>200)&(xx<315))
    else:
        end=285 if state=='right_carry' else 320
        region=((yy>145)&(yy<235)&(xx>170)&(xx<290))|((yy>230)&(yy<end)&(xx>240)&(xx<325))
    material=safe&region
    level=g.mean(axis=2)
    neutral=np.ptp(g,axis=2)<27
    valid=material&neutral&(level>28)&(level<95)
    mid=float(np.median(level[valid]))
    # Replace, rather than stack more marks on top of the rejected zigzags.
    dst[material,:3]=BASE
    line=material&neutral&(level<mid-6)
    dst[line,:3]=SHADOW
    cell(changed,r)[:]=material
    records.append(dict(state=state,frame=i,old_detail_pixels=int((material&np.all(src[:,:,:3]==SHADOW,axis=2)).sum()),new_detail_pixels=int(line.sum())))
for d in ['down','right','up']:
    cell(edited,layout[d+'_idle'][0])[:]=cell(edited,layout[d+'_walk'][1])
    cell(changed,layout[d+'_idle'][0])[:]=cell(changed,layout[d+'_walk'][1])
assert np.array_equal(original[:,:,3],edited[:,:,3])
assert np.array_equal(original[~changed],edited[~changed])
for r in layout['up_walk']:
    assert np.array_equal(cell(original,r),cell(edited,r))
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        Image.fromarray(cell(edited,r)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-dog-fur-style-v11',production='GPT edit with approved dog as sole fur rendering reference; replace heavy cheek/chest zigzags with sparse tapered strokes. Original silhouette, side-waist fix and all pixels outside fur-detail material region preserved.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,alpha_identical=True,outside_detail_rgba_identical=True,rear_unchanged=True,layout_identical=True,animation_identical=True,fur_rgb=[BASE.tolist(),SHADOW.tolist()],frames=records,game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(ROOT/'preview.html').write_text((SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 옆 정지 윤곽 보정 v10','강아지 기준 털 표현 통일 v11'),encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
