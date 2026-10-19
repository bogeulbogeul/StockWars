"""Prepare local RGB corrections for the canonical sprite-gen recolor utility.

This is a deterministic color-only patch, not a new pose generation or repaint.
All masks derive from known frame rectangles and existing source colors.
"""
from pathlib import Path
import copy
import json
import subprocess
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent/'cat-dog-motion-2026-10-18-v1'
CLI = 'C:/Users/bogeu/.codex/skills/sprite-gen/.venv/Scripts/sprite-gen.exe'
ROOT.mkdir(exist_ok=True)
manifest = json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
layout = manifest['frame_layout']['rows']
source = np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
native = np.array(Image.open(SOURCE/'sprite-sheet-unbaked.png').convert('RGBA'))
edited = source.copy()
allowed_mask = np.zeros(source.shape[:2], dtype=bool)
records = []
BASE = [65, 59, 62]
BROW = [92, 81, 85]

def frame_view(array, rect):
    x,y,w,h = (rect[k] for k in ('x','y','w','h'))
    return array[y:y+h,x:x+w]

def repair(state, index, roi, mode):
    rect = layout[state][index]
    frame = frame_view(source, rect)
    raw = frame_view(native, rect)
    x0,y0,x1,y1 = roi
    rgb = frame[:,:,:3].astype(int)
    gray = rgb.max(axis=2)-rgb.min(axis=2)<24
    region = np.zeros((512,512),dtype=bool)
    region[y0:y1,x0:x1] = True
    if mode == 'body':
        mask = region & gray & (rgb[:,:,0]>=58) & (rgb[:,:,0]<=92) & (frame[:,:,3]>0)
        targets = BASE
    elif mode == 'chest':
        mask = region & gray & (rgb[:,:,0]>=58) & (rgb[:,:,0]<=92) & (frame[:,:,3]>0)
        targets = BASE
    else:
        # Existing native brow highlight, before nearest-palette banding.
        nrgb=raw[:,:,:3].astype(int)
        native_brow = (nrgb[:,:,0]>=73) & (nrgb[:,:,0]<=112)
        native_brow &= nrgb.max(axis=2)-nrgb.min(axis=2)<28
        mask = region & native_brow & (frame[:,:,3]>0)
        targets = BROW
    patch = np.zeros_like(frame)
    patch[mask]=frame[mask]
    name=f'{state}-{index}-{mode}'
    input_path=ROOT/f'{name}-source.png'
    Image.fromarray(patch).save(input_path)
    unique=np.unique(patch[mask,:3],axis=0)
    rgbhex=lambda c:'#%02X%02X%02X'%tuple(c)
    spec=dict(version=1,kind='sprite-gen-recolor',match='exact',tolerance=0,
        variants=[dict(name=name,map={rgbhex(c):rgbhex(targets) for c in unique})])
    spec_path=ROOT/f'{name}.spec.json'
    spec_path.write_text(json.dumps(spec,indent=2),encoding='utf-8')
    subprocess.run([CLI,'recolor','--base',str(input_path),'--spec',str(spec_path),
                    '--out-dir',str(ROOT/'baked'),'--alpha-threshold','0',
                    '--report',str(ROOT/'baked'/f'{name}.report.json')],
                    check=True,capture_output=True)
    baked=np.array(Image.open(ROOT/'baked'/f'{name}.png').convert('RGBA'))
    target=frame_view(edited,rect)
    target[mask,:3]=baked[mask,:3]
    frame_view(allowed_mask,rect)[mask]=True
    records.append(dict(state=state,index=index,roi=roi,mode=mode,
                        pixels=int(mask.sum()),target_rgb=targets))

for i in range(3):
    repair('down_walk',i,[0,239,512,512],'body')
    repair('right_walk',i,[266,235,340,303],'chest')
for i in range(4):
    repair('right_carry',i,[310,110,346,135],'brow')
# The existing idle/neutral identity contract remains byte-exact.
for direction in ['down','right']:
    idle=layout[direction+'_idle'][0]
    walk=layout[direction+'_walk'][1]
    frame_view(edited,idle)[:]=frame_view(edited,walk)
    frame_view(allowed_mask,idle)[:]=frame_view(allowed_mask,walk)
assert np.array_equal(edited[:,:,3],source[:,:,3])
assert np.array_equal(edited[~allowed_mask],source[~allowed_mask])
palette=json.loads((SOURCE/'palette-source.json').read_text(encoding='utf-8'))
allowed={tuple(c['rgb']) for c in palette['colors']}
used=set(map(tuple,np.unique(edited[edited[:,:,3]>0,:3],axis=0)))
assert used<=allowed
for state in ['up_idle','up_walk','down_sit','right_sit','face_portrait']:
    for rect in layout[state]:
        assert np.array_equal(frame_view(edited,rect),frame_view(source,rect))
for state,rects in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(parents=True,exist_ok=True)
    for i,rect in enumerate(rects):
        Image.fromarray(frame_view(edited,rect)).save(folder/f'frame-{i}.png')
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
manifest.update(characterId='cat-color-cleanup-v2',
    base_image='../cat-design-2026-10-18-v1/design-sheet.png',
    color_source='../cat-design-2026-10-18-v1/colors-detailed.json',
    production='Localized exact-RGB utility corrections; source alpha, geometry, pose order and timing unchanged.',
    sprite_sheet_alpha_report='validation.json')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
fronts=np.stack([frame_view(edited,r) for r in layout['down_walk'][:3]])
original_fronts=np.stack([frame_view(source,r) for r in layout['down_walk'][:3]])
common=np.ones((512,512),dtype=bool)
common[:285]=False
common[346:]=False
common[:,:230]=False
common[:,278:]=False
for r in layout['down_walk'][:3]:
    common &= frame_view(allowed_mask,r)
assert common.sum()>100
assert np.all(fronts[:,:,:,:3][:,common]==BASE)
source_manifest=json.loads((SOURCE/'manifest.json').read_text())
report=dict(passed=True,alpha_identical=True,layout_identical=manifest['frame_layout']==source_manifest['frame_layout'],
    animation_identical=manifest['animation']==json.loads((SOURCE/'manifest.json').read_text())['animation'],
    rgb_outside_allowed=0,palette_used=len(used),
    outside_masks_unchanged=True,unrelated_states_identical=True,
    changed_pixels=int(np.any(edited!=source,axis=2).sum()),regions=records,
    front_common_torso_pixels=int(common.sum()),front_common_torso_rgb_max_delta=0,
    note='Body base RGB fixed; existing dark contour/shadow pixels retained. Palette compliance alone is not temporal appearance approval.',
    game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
preview=(SOURCE/'preview.html').read_text(encoding='utf-8').replace('<h1>고양이·강아지 모션 비교</h1>',
    '<h1>고양이 색 보정 v2 · 강아지 모션 비교</h1>')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
# Before/after crops are inspection evidence, not altered sprite sources.
board=Image.new('RGB',(4*256,6*256),'#c5c9ce')
for row,state in enumerate(['down_walk','right_walk','right_carry']):
    for i,rect in enumerate(layout[state][:3 if state.endswith('_walk') else 4]):
        for arr,dy in [(source,0),(edited,256)]:
            frame=Image.fromarray(frame_view(arr,rect)).resize((256,256))
            board.paste(frame,(i*256,row*512+dy),frame)
board.save(ROOT/'before-after.png')
print(json.dumps({k:v for k,v in report.items() if k!='regions'}))
