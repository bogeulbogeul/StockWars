"""Transfer generated lighting only; preserve approved sprite geometry/materials."""
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
generated=Image.open(ROOT/'shading-generated.png').convert('RGB').resize((1024,1024))
states=['down_walk','right_walk','up_walk','right_carry']
poses=[(s,i) for s in states for i in range(4 if s=='right_carry' else 3)]
poses += [('down_sit',0),('right_sit',0),('face_portrait',0)]
BASE=np.array([65,59,62],float)
SHADOW=np.array([51,45,48],float)
LIGHT=np.array([73,66,70],float)

def cell(array,r):
    return array[r['y']:r['y']+512,r['x']:r['x']+512]

def blur(values,radius):
    scale=255/max(float(values.max()),1)
    image=Image.fromarray(np.rint(values*scale).astype('uint8'))
    return np.array(image.filter(ImageFilter.GaussianBlur(radius)),float)/scale

records=[]
for j,(state,i) in enumerate(poses):
    r=layout[state][i]
    src=cell(original,r)
    dst=cell(edited,r)
    g=np.array(generated.crop(((j%4)*256,(j//4)*256,(j%4+1)*256,(j//4+1)*256)).resize((512,512)),float)
    fur=(src[:,:,3]>0)&np.all(src[:,:,:3]==BASE,axis=2)
    # Exclude generated background, eyes, ink and pink ears from lighting data.
    valid=fur&(np.ptp(g,axis=2)<28)&(g.mean(axis=2)>29)&(g.mean(axis=2)<100)
    weights=blur(valid.astype(float),4)
    levels=blur(g.mean(axis=2)*valid,4)/np.maximum(weights,.0001)
    good=fur&(weights>.10)
    median=float(np.median(levels[good]))
    # Every drawing shares the same midtone and shadow/highlight endpoints.
    delta=np.clip(levels-median,-14,8)
    delta[~good]=0
    t=np.where(delta<0,-delta/14,delta/8)[:,:,None]
    target=np.where((delta<0)[:,:,None],SHADOW,LIGHT)
    rgb=np.rint(BASE*(1-t)+target*t).astype('uint8')
    dst[fur,:3]=rgb[fur]
    records.append(dict(state=state,frame=i,generated_median=median,
                        fur_mean=dst[fur,:3].mean(axis=0).round(3).tolist(),
                        shadow_fraction=float((delta[fur]<-5).mean()),
                        light_fraction=float((delta[fur]>3).mean())))
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
manifest.update(characterId='cat-natural-shading-v7',
    production='Built-in GPT lighting edit, soft lighting transfer on approved fur material only. Shared design-sheet charcoal endpoints and per-frame midtone normalization. Original alpha/linework/colors outside fur preserved.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,alpha_identical=True,nonfur_identical=True,
    layout_identical=manifest['frame_layout']==json.loads((SOURCE/'manifest.json').read_text())['frame_layout'],
    animation_identical=manifest['animation']==json.loads((SOURCE/'manifest.json').read_text())['animation'],
    shading_endpoints=dict(base=BASE.tolist(),shadow=SHADOW.tolist(),light=LIGHT.tolist()),
    generated_source='shading-generated.png',frames=records,game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
preview=(SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 전체 그림체·색 통일 v6','고양이 디자인 시트 명암 복원 v7')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps({k:v for k,v in report.items() if k!='frames'}))
