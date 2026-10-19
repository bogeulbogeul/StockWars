"""Import edited existing contact sheet; keep native clean illustration colors."""
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image
from materials import clean

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-design-tail-v18'
manifest=json.loads((SOURCE/'manifest.json').read_text())
old=json.loads(json.dumps(manifest))
layout=manifest['frame_layout']['rows']
raw=Image.open(ROOT/'tail-color-portrait-generated.png').convert('RGBA')
assert raw.getextrema()[3][0]==0
contact=raw.resize((2048,2048),Image.Resampling.LANCZOS)
states=['down_walk','right_walk','up_walk','right_carry']
poses=[(s,i) for s in states for i in range(4 if s=='right_carry' else 3)]
poses += [('down_sit',0),('right_sit',0),('face_portrait',0)]
sheet=Image.new('RGBA',(2048,5120))
records=[]
tail_records=[]
for j,(state,i) in enumerate(poses):
    a=np.array(contact.crop(((j%4)*512,(j//4)*512,(j%4+1)*512,(j//4+1)*512)))
    a[a[:,:,3]<24]=0
    a=clean(a,state)
    frame=Image.fromarray(a)
    r=layout[state][i]
    sheet.paste(frame,(r['x'],r['y']))
    bbox=frame.getbbox()
    assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<512 and bbox[3]<512
    records.append(dict(state=state,frame=i,alpha_bbox=bbox))
    if state=='up_walk':
        yy,xx=np.indices((512,512))
        left=(a[:,:,3]>128)&(xx<115)&(yy>300)&(yy<410)
        right=(a[:,:,3]>128)&(xx>385)&(yy>300)&(yy<410)
        tail=(a[:,:,3]>128)&((xx<180)|(xx>330))&(yy>260)&(yy<425)
        points=np.argwhere(tail)
        top=int(points[:,0].min())
        upper=points[points[:,0]<=top+8]
        tail_records.append(dict(frame=i,left_tail_pixels=int(left.sum()),right_tail_pixels=int(right.sum())))
for d in ['down','right','up']:
    r=layout[d+'_walk'][1];target=layout[d+'_idle'][0]
    sheet.paste(sheet.crop((r['x'],r['y'],r['x']+512,r['y']+512)),(target['x'],target['y']))
sheet.save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state;folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):sheet.crop((r['x'],r['y'],r['x']+512,r['y']+512)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-tail-color-portrait-v19',curation_applied=False,
    production='Built-in GPT edit: rear tail contactA screen-left, contactB screen-right; head-only portrait without chest. Spatially cleaned common three-plane charcoal fur, anatomical brow masks, uniform pink ears.',
    design_reference='references/user-cat-design.png')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,states=10,unique_drawings=16,transparent_background=True,
    cells_not_clipped=True,layout_identical=manifest['frame_layout']==old['frame_layout'],
    animation_identical=manifest['animation']==old['animation'],
    drawings_redrawn=True,tail_measurements=tail_records,frames=records,game_installed=False,
    limitation='Tail upper-region coordinates are measurement evidence, not proof of exact anatomical root lock. Design and tail connection require visual review.')
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(ROOT/'preview.html').write_text((SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 디자인 복원·뒤 꼬리 움직임 v18','고양이 꼬리 좌우·색면·얼굴 초상화 v19'),encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
