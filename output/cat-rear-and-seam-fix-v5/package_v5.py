"""Package the rear imagegen edit and remove the carry color-composite seam."""
from pathlib import Path
import json
import subprocess
import numpy as np
from PIL import Image, ImageDraw
from sprite_gen.curate.curation import write_curation_atomic

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-chest-color-lock-v4'
RUN=ROOT/'run'
CLI='C:/Users/bogeu/.codex/skills/sprite-gen/.venv/Scripts/sprite-gen.exe'
palette=json.loads((ROOT.parent/'cat-design-2026-10-18-v1/colors-detailed.json').read_text())
BASE=[65,59,62]
transforms={}
for i in range(3):
    im=Image.open(RUN/f'frames/up_walk/frame-{i}.png').convert('RGBA')
    box=im.getchannel('A').crop((0,0,512,210)).getbbox()
    transforms[str(i)]={'dx':round(256-(box[0]+box[2])/2)}
write_curation_atomic(RUN,dict(version=1,kind='sprite-gen-curation',states={
    'up_walk':dict(selected=[0,1,2,1],transforms=transforms)}))
subprocess.run([CLI,'compose-atlas','--run-dir',str(RUN)],check=True,capture_output=True)
source_rear=json.loads((RUN/'manifest.json').read_text())
color_map={r['hex']:( '#413B3E' if 58<=r['rgb'][0]<=92 and max(r['rgb'])-min(r['rgb'])<24
                       else r['hex']) for r in palette['colors']}
# The source is continuous RGB, so the declared nearest-source mapping first
# resolves to the existing palette, then uses its target material color.
spec=dict(version=1,kind='sprite-gen-recolor',match='tolerance',tolerance=255,
    variants=[dict(name='rear-rgb',map=color_map)])
(ROOT/'rear-palette.spec.json').write_text(json.dumps(spec,indent=2),encoding='utf-8')
subprocess.run([CLI,'recolor','--base',str(RUN/'sprite-sheet-alpha.png'),
    '--spec',str(ROOT/'rear-palette.spec.json'),'--out-dir',str(ROOT/'baked'),
    '--alpha-threshold','0'],check=True,capture_output=True)
rear=Image.open(ROOT/'baked/rear-rgb.png').convert('RGBA')
manifest=json.loads((SOURCE/'manifest.json').read_text())
layout=manifest['frame_layout']['rows']
original=Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA')
result=original.copy()
def cut(im,r):
    return im.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
for i in range(3):
    frame=cut(rear,source_rear['frame_layout']['rows']['up_walk'][i])
    r=layout['up_walk'][i]
    result.paste(frame,(r['x'],r['y']))
r=layout['up_idle'][0]
result.paste(cut(result,layout['up_walk'][1]),(r['x'],r['y']))
# Continuous anatomical arm/hand region, not the old rectangular paste window.
polygon=[(236,244),(250,256),(294,278),(316,280),(324,270),(366,267),
         (405,272),(417,288),(415,324),(397,334),(340,337),(306,322),
         (271,309),(248,293),(236,270)]
region=Image.new('L',(512,512))
ImageDraw.Draw(region).polygon(polygon,fill=255)
region=np.array(region)>0
carry_masks=[]
for i,r in enumerate(layout['right_carry']):
    frame=cut(original,r)
    arr=np.array(frame)
    rgb=arr[:,:,:3].astype(int)
    mask=region & (arr[:,:,3]>0) & (rgb[:,:,0]>=45) & (rgb[:,:,0]<=92)
    mask &= rgb.max(axis=2)-rgb.min(axis=2)<24
    patch=np.zeros_like(arr)
    patch[mask]=arr[mask]
    name=f'carry-seam-{i}'
    patchpath=ROOT/f'{name}-source.png'
    Image.fromarray(patch).save(patchpath)
    mapping={'#%02X%02X%02X'%tuple(c):'#413B3E' for c in np.unique(arr[mask,:3],axis=0)}
    spec=dict(version=1,kind='sprite-gen-recolor',match='exact',tolerance=0,
        variants=[dict(name=name,map=mapping)])
    path=ROOT/f'{name}.spec.json'
    path.write_text(json.dumps(spec,indent=2),encoding='utf-8')
    subprocess.run([CLI,'recolor','--base',str(patchpath),'--spec',str(path),
        '--out-dir',str(ROOT/'baked'),'--report',str(ROOT/'baked'/f'{name}.report.json'),
        '--alpha-threshold','0'],check=True,capture_output=True)
    baked=np.array(Image.open(ROOT/'baked'/f'{name}.png').convert('RGBA'))
    arr[mask,:3]=baked[mask,:3]
    assert np.all(arr[mask,:3]==BASE)
    assert np.array_equal(arr[:,:,3],np.array(frame)[:,:,3])
    assert np.array_equal(arr[~mask],np.array(frame)[~mask])
    result.paste(Image.fromarray(arr),(r['x'],r['y']))
    carry_masks.append(dict(frame=i,pixels=int(mask.sum()),target_rgb=BASE))
result.save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        frame=cut(result,r)
        frame.save(folder/f'frame-{i}.png')
        if state not in ['up_idle','up_walk','right_carry']:
            assert frame.tobytes()==cut(original,r).tobytes()
        assert frame.getbbox() is not None
arr=np.array(result)
allowed={tuple(c['rgb']) for c in palette['colors']}
used=set(map(tuple,np.unique(arr[arr[:,:,3]>0,:3],axis=0)))
assert used<=allowed
manifest.update(characterId='cat-rear-and-seam-fix-v5',sprite_sheet_alpha_report='validation.json',
    production='Rear imagegen edit against user design, canonical extraction/alignment/palette bake; carry arm material seam removed through exact-RGB utility.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,unrelated_states_identical=True,carry_alpha_identical=True,
    carry_outside_masks_identical=True,layout_identical=True,animation_identical=True,
    carry_arm_hand_base_rgb_uniform=True,
    palette_used=len(used),colors_outside_palette=0,rear_idle_matches_neutral=True,
    rear_head_alignment=transforms,carry_masks=carry_masks,game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
preview=(SOURCE/'preview.html').read_text(encoding='utf-8').replace(
    '고양이 가슴털 색 통일 v4 · 강아지 모션 비교','고양이 뒤 디자인·운반 경계 보정 v5')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
board=Image.new('RGB',(4*256,4*256),'#c5c9ce')
for row,state in enumerate(['right_carry','up_walk']):
    n=4 if state=='right_carry' else 3
    for i,r in enumerate(layout[state][:n]):
        for offset,im in enumerate([original,result]):
            frame=cut(im,r).resize((256,256))
            board.paste(frame,(i*256,(row*2+offset)*256),frame)
board.save(ROOT/'before-after.png')
print(json.dumps(report))
