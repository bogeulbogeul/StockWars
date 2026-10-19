"""Import GPT edit of an existing 16-cell contact sheet into the animation atlas."""
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-side-outline-v10'
old=json.loads((SOURCE/'manifest.json').read_text())
manifest=json.loads(json.dumps(old))
layout=manifest['frame_layout']['rows']
raw=Image.open(ROOT/'design-match-generated.png').convert('RGBA')
assert raw.getextrema()[3][0]==0,'Generated background must be transparent'
contact=raw.resize((2048,2048),Image.Resampling.LANCZOS)
states=['down_walk','right_walk','up_walk','right_carry']
poses=[(s,i) for s in states for i in range(4 if s=='right_carry' else 3)]
poses += [('down_sit',0),('right_sit',0),('face_portrait',0)]
sheet=Image.new('RGBA',(2048,5120))
records=[]
for j,(state,i) in enumerate(poses):
    frame=contact.crop(((j%4)*512,(j//4)*512,(j%4+1)*512,(j//4+1)*512))
    a=np.array(frame)
    # Preserve the GPT-rendered fur anatomy and color transitions. Hard RGB
    # quantization turns subtle tuft edges into noisy stripe fragments.
    a[a[:,:,3]<24]=0
    r=layout[state][i]
    sheet.paste(Image.fromarray(a),(r['x'],r['y']))
    records.append(dict(state=state,frame=i,alpha_bbox=Image.fromarray(a).getbbox()))
for d in ['down','right','up']:
    r=layout[d+'_walk'][1]
    target=layout[d+'_idle'][0]
    sheet.paste(sheet.crop((r['x'],r['y'],r['x']+512,r['y']+512)),(target['x'],target['y']))
sheet.save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        sheet.crop((r['x'],r['y'],r['x']+512,r['y']+512)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-design-match-v12',curation_applied=False,
    production='Built-in GPT design-reference edit of existing contact sheet. All sixteen pose drawings redrawn to user cat design morphology with dog line/cel reference. Native generated colors preserved, faint alpha noise removed. Existing timing and atlas coordinate contract preserved. Alpha/geometry intentionally redrawn; no claim of pixel-identical poses.',
    design_reference='references/user-cat-design.png')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,states=10,unique_drawings=16,transparent_background=True,
    layout_identical=manifest['frame_layout']==old['frame_layout'],
    animation_identical=manifest['animation']==old['animation'],
    alpha_preserved=False,geometry_redrawn=True,frames=records,game_installed=False,
    limitation='Timing/layout checks do not prove identical hand/foot contact or design fidelity; visual review is required.')
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(ROOT/'preview.html').write_text((SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 옆 정지 윤곽 보정 v10','고양이 디자인 시트 외형 맞춤 v12'),encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
