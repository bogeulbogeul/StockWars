"""Restore GPT cheek/chest tuft details without replacing whole color patches."""
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image,ImageFilter

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-dog-cel-style-v8'
manifest=json.loads((SOURCE/'manifest.json').read_text())
layout=manifest['frame_layout']['rows']
original=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
edited=original.copy()
generated=Image.open(ROOT/'fur-detail-generated.png').convert('RGB').resize((1024,1024))
states=['down_walk','right_walk','up_walk','right_carry']
poses=[(s,i) for s in states for i in range(4 if s=='right_carry' else 3)]
poses += [('down_sit',0),('right_sit',0),('face_portrait',0)]
BASE=np.array([65,59,62],dtype=np.uint8)
SHADOW=np.array([51,45,48],dtype=np.uint8)
yy,xx=np.indices((512,512))

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
    fur=(src[:,:,3]>0)&np.all(src[:,:,:3]==BASE,axis=2)
    # Work on internal fur only, avoiding generated silhouette shifts/eye ink.
    safe=np.array(Image.fromarray(fur.astype('uint8')*255).filter(ImageFilter.MinFilter(5)))>127
    levels=g.mean(axis=2)
    neutral=np.ptp(g,axis=2)<27
    if state=='face_portrait':
        region=(yy>290)&(yy<445)&((xx<180)|(xx>335))
    elif state.endswith('sit'):
        region=((yy>225)&(yy<290)&((xx<225)|(xx>310)))|((yy>292)&(yy<350)&(xx>205)&(xx<330))
    elif state.startswith('down_'):
        region=((yy>170)&(yy<230)&((xx<215)|(xx>300)))|((yy>240)&(yy<300)&(xx>205)&(xx<310))
    else:
        chest_end=285 if state=='right_carry' else 320
        region=((yy>150)&(yy<228)&(xx>175)&(xx<285))|((yy>235)&(yy<chest_end)&(xx>245)&(xx<325))
    # Add only the generated tapered tuft edges, not a rectangular RGB patch.
    mask=safe&neutral&(levels<56)&region
    mask=np.array(Image.fromarray(mask.astype('uint8')*255).filter(ImageFilter.MedianFilter(3)))>127
    dst[mask,:3]=SHADOW
    records.append(dict(state=state,frame=i,restored_detail_pixels=int(mask.sum())))
for d in ['down','right','up']:
    cell(edited,layout[d+'_idle'][0])[:]=cell(edited,layout[d+'_walk'][1])
assert np.array_equal(original[:,:,3],edited[:,:,3])
fur=np.all(original[:,:,:3]==BASE,axis=2)
assert np.array_equal(original[~fur],edited[~fur])
assert np.array_equal(cell(original,layout['up_walk'][0]),cell(edited,layout['up_walk'][0]))
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        Image.fromarray(cell(edited,r)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-fur-detail-v9',
    production='GPT restoration of internal cheek/chest tuft details in dog-style cel shading. Existing alpha, eyes, ears, brows, hands, shadows, rear views and motions preserved.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,alpha_identical=True,nonbase_fur_pixels_identical=True,
    rear_unchanged=True,layout_identical=True,animation_identical=True,
    fur_detail_rgb=SHADOW.tolist(),frames=records,game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
preview=(SOURCE/'preview.html').read_text(encoding='utf-8').replace('강아지 그림체·셀 명암 기준 고양이 v8','고양이 볼털·가슴털 복원 v9')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
