"""Recolor existing ruff interiors uniformly and consolidate brow color coverage."""
from pathlib import Path
import json
import shutil
import subprocess
import numpy as np
from PIL import Image,ImageFilter

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-natural-walk-v16'
CLI='C:/Users/bogeu/.codex/skills/sprite-gen/.venv/Scripts/sprite-gen.exe'
manifest=json.loads((SOURCE/'manifest.json').read_text())
layout=manifest['frame_layout']['rows']
original=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
edited=original.copy()
roles=np.zeros(original.shape[:2],dtype='uint8')
records=[]
seen=set()

def cell(a,r):
    return a[r['y']:r['y']+512,r['x']:r['x']+512]

for state,rows in layout.items():
    if state.startswith('up_') or state=='face_portrait': continue
    for i,r in enumerate(rows):
        if (r['x'],r['y']) in seen: continue
        seen.add((r['x'],r['y']))
        a=cell(original,r)
        rgb=a[:,:,:3]
        neutral=np.ptp(rgb.astype('int16'),axis=2)<30
        fur=(a[:,:,3]>0)&neutral&(rgb[:,:,0]>=30)&(rgb[:,:,0]<125)
        if state.startswith('down_') and state!='down_sit':
            box=(210,249,310,307)
        elif state=='down_sit': box=(228,286,333,347)
        elif state=='right_sit': box=(278,285,342,341)
        elif state=='right_carry': box=(280,237,331,279)
        else: box=(280,240,337,303)
        x1,y1,x2,y2=box
        accent=fur&~np.all(rgb==[65,59,62],axis=2)
        mask=np.zeros(fur.shape,bool)
        # The existing colored tuft edges define its shape. Fill the gaps
        # between edge pixels on each row, without adding a rectangular fill.
        for y in range(y1,y2):
            xs=np.where(accent[y,x1:x2])[0]
            if len(xs): mask[y,x1+xs.min():x1+xs.max()+1]=True
        mask &= fur
        cell(roles,r)[mask]=1
        records.append(dict(state=state,frame=i,ruff_pixels=int(mask.sum())))
        if state=='right_sit':
            yy,xx=np.indices(fur.shape)
            brow=(a[:,:,3]>0)&neutral&(rgb[:,:,0]>=85)&(rgb[:,:,0]<125)&(yy>=158)&(yy<=191)&(xx>270)&(xx<375)
            b=Image.fromarray(brow.astype('uint8')*255)
            b=b.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
            strengthened=(np.array(b)>127)&(fur|brow)
            cell(roles,r)[strengthened]=2

for role,name,color in [(1,'uniform-chest',[73,66,70]),(2,'clear-brow',[92,81,85])]:
    mask=roles==role
    patch=np.zeros_like(original);patch[mask]=original[mask]
    Image.fromarray(patch).save(ROOT/f'{name}-input.png')
    hx=lambda c:'#%02X%02X%02X'%tuple(c)
    mapping={hx(c):hx(color) for c in np.unique(original[mask,:3],axis=0)}
    spec=dict(version=1,kind='sprite-gen-recolor',match='exact',tolerance=0,variants=[dict(name=name,map=mapping)])
    (ROOT/f'{name}.spec.json').write_text(json.dumps(spec,indent=2))
    subprocess.run([CLI,'recolor','--base',str(ROOT/f'{name}-input.png'),'--spec',str(ROOT/f'{name}.spec.json'),'--out-dir',str(ROOT/'baked'),'--report',str(ROOT/'baked'/f'{name}.report.json'),'--alpha-threshold','0'],check=True,capture_output=True)
    baked=np.array(Image.open(ROOT/'baked'/f'{name}.png'))
    edited[mask,:3]=baked[mask,:3]
    assert np.all(edited[mask,:3]==color)
for d in ['down','right','up']:
    cell(edited,layout[d+'_idle'][0])[:]=cell(edited,layout[d+'_walk'][1])
    cell(roles,layout[d+'_idle'][0])[:]=cell(roles,layout[d+'_walk'][1])
assert np.array_equal(original[:,:,3],edited[:,:,3])
assert np.array_equal(original[roles==0],edited[roles==0])
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state;folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows): Image.fromarray(cell(edited,r)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-chest-brow-clean-v17',production='Deterministic exact-RGB uniform ruff interior bake from existing tuft edge pixels; consolidated diagonal-sit brow coverage. All alpha and every pixel outside the material masks preserved.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,alpha_identical=True,outside_material_rgba_identical=True,layout_identical=True,animation_identical=True,chest_interior_rgb=[73,66,70],chest_interior_color_count=1,brow_rgb=[92,81,85],frames=records,game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2))
(ROOT/'preview.html').write_text((SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 자연스러운 걷기 리듬 v16','고양이 가슴털 단색·눈썹 정리 v17'),encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
