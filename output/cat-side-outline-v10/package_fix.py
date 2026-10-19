"""Apply only GPT-smoothed side-neutral waist contour to the existing atlas."""
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-fur-detail-v9'
manifest=json.loads((SOURCE/'manifest.json').read_text())
layout=manifest['frame_layout']['rows']
original=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
edited=original.copy()
generated=np.array(Image.open(ROOT/'outline-generated.png').convert('RGBA').resize((512,512)))
box=(198,265,242,390)
x1,y1,x2,y2=box
g=generated[y1:y2,x1:x2].copy()
mean=g[:,:,:3].mean(axis=2)
g[:,:,:3]=[65,59,62]
g[mean<57,:3]=[51,45,48]
g[mean<28,:3]=[2,1,2]
g[g[:,:,3]==0,:3]=0

def cell(array,r):
    return array[r['y']:r['y']+512,r['x']:r['x']+512]

changed=np.zeros(original.shape[:2],bool)
for state,index in [('right_idle',0),('right_walk',1)]:
    r=layout[state][index]
    cell(edited,r)[y1:y2,x1:x2]=g
    cell(changed,r)[y1:y2,x1:x2]=True
assert np.array_equal(original[~changed],edited[~changed])
assert np.array_equal(cell(edited,layout['right_idle'][0]),cell(edited,layout['right_walk'][1]))
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        Image.fromarray(cell(edited,r)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-side-outline-v10',production='Built-in GPT local side-neutral waist contour smoothing. Only local contour window baked in original cat palette; all pixels outside window unchanged. Idle and walk neutral shared.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,changed_states=['right_idle','right_walk neutral'],
    local_window=box,outside_window_rgba_identical=True,idle_neutral_identical=True,
    layout_identical=True,animation_identical=True,
    changed_pixels=int(np.any(original!=edited,axis=2).sum()),game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
preview=(SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 볼털·가슴털 복원 v9','고양이 옆 정지 윤곽 보정 v10')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
board=Image.new('RGBA',(512,256),'#c5c9ce')
for i,a in enumerate([original,edited]):
    im=Image.fromarray(cell(a,layout['right_idle'][0])).crop((170,275,280,400)).resize((224,256))
    board.alpha_composite(im,(i*256,0))
board.convert('RGB').save(ROOT/'before-after.png')
print(json.dumps(report))
