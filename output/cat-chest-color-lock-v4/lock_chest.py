"""Use the exact-RGB utility to lock visible chest fur across motion states."""
from pathlib import Path
import json
import subprocess
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-carry-hands-v3'
CLI='C:/Users/bogeu/.codex/skills/sprite-gen/.venv/Scripts/sprite-gen.exe'
ROOT.mkdir(exist_ok=True)
manifest=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
layout=manifest['frame_layout']['rows']
original=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
edited=original.copy()
allowed_mask=np.zeros(original.shape[:2],dtype=bool)
hand_windows=json.loads((SOURCE/'validation.json').read_text())['hand_windows']
target=[65,59,62]
regions={
    'down_walk':(197,238,314,304),
    'right_walk':(266,235,340,303),
    'right_carry':(260,222,329,284),
    'down_sit':(216,290,325,353),
    'right_sit':(265,285,340,351),
}
def view(array,r):
    return array[r['y']:r['y']+r['h'],r['x']:r['x']+r['w']]
records=[]
rgbhex=lambda c:'#%02X%02X%02X'%tuple(c)
for state,roi in regions.items():
    rows=layout[state][:3] if state.endswith('_walk') else layout[state]
    for i,r in enumerate(rows):
        src=view(original,r)
        rgb=src[:,:,:3].astype(int)
        mask=np.zeros((512,512),bool)
        x0,y0,x1,y1=roi
        mask[y0:y1,x0:x1]=True
        mask &= (src[:,:,3]>0) & (rgb[:,:,0]>=58) & (rgb[:,:,0]<=92)
        mask &= rgb.max(axis=2)-rgb.min(axis=2)<24
        if state=='right_carry':
            hx0,hy0,hx1,hy1=hand_windows[i]['window']
            mask[hy0:hy1,hx0:hx1]=False
        patch=np.zeros_like(src)
        patch[mask]=src[mask]
        name=f'{state}-{i}'
        patchpath=ROOT/f'{name}-source.png'
        Image.fromarray(patch).save(patchpath)
        spec=dict(version=1,kind='sprite-gen-recolor',match='exact',tolerance=0,
            variants=[dict(name=name,map={rgbhex(c):rgbhex(target)
                for c in np.unique(src[mask,:3],axis=0)})])
        specpath=ROOT/f'{name}.spec.json'
        specpath.write_text(json.dumps(spec,indent=2),encoding='utf-8')
        subprocess.run([CLI,'recolor','--base',str(patchpath),'--spec',str(specpath),
            '--out-dir',str(ROOT/'baked'),'--report',str(ROOT/'baked'/f'{name}.report.json'),
            '--alpha-threshold','0'],check=True,capture_output=True)
        baked=np.array(Image.open(ROOT/'baked'/f'{name}.png').convert('RGBA'))
        dst=view(edited,r)
        dst[mask,:3]=baked[mask,:3]
        view(allowed_mask,r)[mask]=True
        assert np.all(dst[mask,:3]==target)
        records.append(dict(state=state,frame=i,roi=roi,pixels=int(mask.sum()),
            previous_rgb_count=len(np.unique(src[mask,:3],axis=0)),after_rgb=[target]))
# Keep idle and repeated-neutral cells shared and identical.
for direction in ['down','right']:
    view(edited,layout[direction+'_idle'][0])[:]=view(edited,layout[direction+'_walk'][1])
    view(allowed_mask,layout[direction+'_idle'][0])[:]=view(allowed_mask,layout[direction+'_walk'][1])
assert np.array_equal(original[:,:,3],edited[:,:,3])
assert np.array_equal(original[~allowed_mask],edited[~allowed_mask])
for i,r in enumerate(layout['right_carry']):
    x0,y0,x1,y1=hand_windows[i]['window']
    assert np.array_equal(view(original,r)[y0:y1,x0:x1],view(edited,r)[y0:y1,x0:x1])
for state in ['up_idle','up_walk','face_portrait']:
    for r in layout[state]:
        assert np.array_equal(view(original,r),view(edited,r))
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
manifest.update(characterId='cat-chest-color-lock-v4',
    production='Chest base RGB locked across front/side walk, carry and both sitting holds using exact-RGB utility. v3 hand edit preserved.',
    sprite_sheet_alpha_report='validation.json')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,chest_base_rgb=target,per_region_base_rgb_max_difference=0,
    alpha_identical=True,outside_masks_rgba_identical=True,
    hand_windows_rgba_identical=True,layout_identical=True,animation_identical=True,
    colors_outside_palette=0,changed_pixels=int(np.any(original!=edited,axis=2).sum()),
    regions=records,game_installed=False,
    scope='Visible chest base colors; existing dark fur boundary/occlusion lines are preserved. Rear has no visible chest.')
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
preview=(SOURCE/'preview.html').read_text(encoding='utf-8').replace(
    '고양이 손 표현 v3 · 강아지 모션 비교','고양이 가슴털 색 통일 v4 · 강아지 모션 비교')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
states=list(regions)
board=Image.new('RGB',(5*256,2*256),'#c5c9ce')
for col,state in enumerate(states):
    r=layout[state][1 if state.endswith('_walk') else 0]
    for row,arr in enumerate([original,edited]):
        frame=Image.fromarray(view(arr,r)).resize((256,256))
        board.paste(frame,(col*256,row*256),frame)
board.save(ROOT/'chest-before-after.png')
print(json.dumps({k:v for k,v in report.items() if k!='regions'}))
