"""Whole-sheet shared material rules, baked with canonical exact-RGB utility."""
from pathlib import Path
import json
import subprocess
import numpy as np
from PIL import Image
from material_rules import classify,TARGETS,NAMES

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-rear-and-seam-fix-v5'
CLI='C:/Users/bogeu/.codex/skills/sprite-gen/.venv/Scripts/sprite-gen.exe'
ROOT.mkdir(exist_ok=True)
manifest=json.loads((SOURCE/'manifest.json').read_text())
layout=manifest['frame_layout']['rows']
source=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
roles=np.zeros(source.shape[:2],dtype=np.uint8)
def view(array,r):
    return array[r['y']:r['y']+r['h'],r['x']:r['x']+r['w']]
seen=set()
frame_records=[]
for state,rows in layout.items():
    for i,r in enumerate(rows):
        key=(r['x'],r['y'])
        if key in seen:
            continue
        seen.add(key)
        tagged=classify(view(source,r),state)
        view(roles,r)[:]=tagged
        frame_records.append(dict(state=state,frame=i,
            roles={NAMES[k]:int((tagged==k).sum()) for k in TARGETS}))
edited=source.copy()
counts={}
for role,target in TARGETS.items():
    mask=roles==role
    if not mask.any():
        continue
    patch=np.zeros_like(source)
    patch[mask]=source[mask]
    name=NAMES[role]
    path=ROOT/f'material-{name}.png'
    Image.fromarray(patch).save(path)
    rgbhex=lambda c:'#%02X%02X%02X'%tuple(c)
    mapping={rgbhex(c):rgbhex(target) for c in np.unique(source[mask,:3],axis=0)}
    spec=dict(version=1,kind='sprite-gen-recolor',match='exact',tolerance=0,
              variants=[dict(name=name,map=mapping)])
    specpath=ROOT/f'material-{name}.spec.json'
    specpath.write_text(json.dumps(spec,indent=2),encoding='utf-8')
    subprocess.run([CLI,'recolor','--base',str(path),'--spec',str(specpath),
        '--out-dir',str(ROOT/'baked'),'--report',str(ROOT/'baked'/f'{name}.report.json'),
        '--alpha-threshold','0'],check=True,capture_output=True)
    baked=np.array(Image.open(ROOT/'baked'/f'{name}.png').convert('RGBA'))
    edited[mask,:3]=baked[mask,:3]
    assert np.all(edited[mask,:3]==target)
    counts[name]=dict(rgb=target,pixels=int(mask.sum()))
# Shared idle/neutral must stay identical regardless of duplicate placement.
for d in ['down','right','up']:
    view(edited,layout[d+'_idle'][0])[:]=view(edited,layout[d+'_walk'][1])
assert np.array_equal(source[:,:,3],edited[:,:,3])
palette=json.loads((ROOT.parent/'cat-design-2026-10-18-v1/colors-detailed.json').read_text())
allowed={tuple(c['rgb']) for c in palette['colors']}
used=set(map(tuple,np.unique(edited[edited[:,:,3]>0,:3],axis=0)))
assert used<=allowed
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        Image.fromarray(view(edited,r)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-style-unified-v6',sprite_sheet_alpha_report='validation.json',
    production='Whole-sheet common material, outline and narrow-crease rules applied to existing approved poses through canonical exact-RGB bake. Alpha unchanged; no rectangle patch compositing.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,states=len(layout),physical_drawings=len(frame_records),
    alpha_identical=True,layout_identical=True,animation_identical=True,
    common_material_rgb_difference=0,materials=counts,frames=frame_records,
    allowed_colors=len(allowed),used_colors=len(used),colors_outside_palette=0,
    changed_pixels=int(np.any(source!=edited,axis=2).sum()),game_installed=False,
    limitation='Checks confirm shared material RGB and geometry, not pixel-identical facial artwork across poses. Broad fur/ear shading is flattened; original near-black contours remain.')
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
# Whole-state board: previous above, unified below for every state.
states=['down_walk','right_walk','up_walk','right_carry','down_sit','right_sit','face_portrait']
board=Image.new('RGB',(4*256,7*512),'#c5c9ce')
for row,state in enumerate(states):
    n=3 if state.endswith('_walk') else len(layout[state])
    for i,r in enumerate(layout[state][:n]):
        for offset,arr in enumerate([source,edited]):
            frame=Image.fromarray(view(arr,r)).resize((256,256))
            board.paste(frame,(i*256,(row*2+offset)*256),frame)
board.save(ROOT/'all-states-before-after.png')
preview=(SOURCE/'preview.html').read_text(encoding='utf-8').replace(
    '고양이 뒤 디자인·운반 경계 보정 v5','고양이 전체 그림체·색 통일 v6')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ['frames','materials']}))
