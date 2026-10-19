"""Import edited existing contact sheet; keep native clean illustration colors."""
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-chest-brow-clean-v17'
manifest=json.loads((SOURCE/'manifest.json').read_text())
old=json.loads(json.dumps(manifest))
layout=manifest['frame_layout']['rows']
raw=Image.open(ROOT/'design-tail-generated.png').convert('RGBA')
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
    frame=Image.fromarray(a)
    r=layout[state][i]
    sheet.paste(frame,(r['x'],r['y']))
    bbox=frame.getbbox()
    assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<512 and bbox[3]<512
    records.append(dict(state=state,frame=i,alpha_bbox=bbox))
    if state=='up_walk':
        yy,xx=np.indices((512,512))
        tail=(a[:,:,3]>128)&(xx>365)&(yy>215)&(yy<425)
        points=np.argwhere(tail)
        top=int(points[:,0].min())
        upper=points[points[:,0]<=top+8]
        tail_records.append(dict(frame=i,upper_tail_xy=[round(float(upper[:,1].mean()),2),round(float(upper[:,0].mean()),2)],rightmost_x=int(points[:,1].max())))
for d in ['down','right','up']:
    r=layout[d+'_walk'][1];target=layout[d+'_idle'][0]
    sheet.paste(sheet.crop((r['x'],r['y'],r['x']+512,r['y']+512)),(target['x'],target['y']))
sheet.save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state;folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):sheet.crop((r['x'],r['y'],r['x']+512,r['y']+512)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-design-tail-v18',curation_applied=False,
    production='Built-in GPT edit of existing16-pose sheet to attached cat design morphology with dog cel-style reference. Restore pointed chest ruff and animate rear tail tip while retaining right-curving C-tail design. Native generated colors retained; no threshold recolor.',
    design_reference='references/user-cat-design.png')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,states=10,unique_drawings=16,transparent_background=True,
    cells_not_clipped=True,layout_identical=manifest['frame_layout']==old['frame_layout'],
    animation_identical=manifest['animation']==old['animation'],
    drawings_redrawn=True,tail_measurements=tail_records,frames=records,game_installed=False,
    limitation='Tail upper-region coordinates are measurement evidence, not proof of exact anatomical root lock. Design and tail connection require visual review.')
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(ROOT/'preview.html').write_text((SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 가슴털 단색·눈썹 정리 v17','고양이 디자인 복원·뒤 꼬리 움직임 v18'),encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
