"""Package the imagegen hand edit into existing complete sprite frames.

Only the declared wrist/hand window is installed; all other pixels are copied
from v2. No new locomotion, rigging, or procedural hand drawing is performed.
"""
from pathlib import Path
import json
import subprocess
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-color-cleanup-v2'
CLI='C:/Users/bogeu/.codex/skills/sprite-gen/.venv/Scripts/sprite-gen.exe'
manifest=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
layout=manifest['frame_layout']['rows']
original=Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA')
result=original.copy()
palette=json.loads((ROOT.parent/'cat-design-2026-10-18-v1/colors-detailed.json').read_text(encoding='utf-8'))
colors={r['hex']:r['hex'] for r in palette['colors']}
spec=dict(version=1,kind='sprite-gen-recolor',match='tolerance',tolerance=255,
          variants=[dict(name='hand-template-rgb',map=colors)])
(ROOT/'hand-palette.spec.json').write_text(json.dumps(spec,indent=2),encoding='utf-8')
subprocess.run([CLI,'recolor','--base',str(ROOT/'hand-edit-512.png'),
    '--spec',str(ROOT/'hand-palette.spec.json'),'--out-dir',str(ROOT/'baked'),
    '--alpha-threshold','0'],check=True,capture_output=True)
template=Image.open(ROOT/'baked/hand-template-rgb.png').convert('RGBA')
# Known square-canvas edit coordinates, not segmentation of a generated row.
window=(321,272,416,335)
patch=template.crop(window)
rects=layout['right_carry']
def cut(im,r):
    return im.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
def anchor(im):
    a=np.array(im)[:,:,3]
    ys,xs=np.where(a[260:335,338:430]>128)
    right=int(xs.max()+338)
    band=ys[xs>=xs.max()-3]+260
    return right,round(float(np.median(band)))
reference_anchor=anchor(cut(original,rects[0]))
proof=[]
allowed_mask=np.zeros((5120,2048),bool)
for i,r in enumerate(rects):
    frame=cut(original,r)
    current=anchor(frame)
    dx=current[0]-reference_anchor[0]
    dy=current[1]-reference_anchor[1]
    x,y=window[0]+dx,window[1]+dy
    # Blend only the wrist entry/top seam; the actual paw silhouettes remain
    # the generated edit. Palette-bake the small composite back to source RGB.
    xx,yy=np.meshgrid(np.arange(patch.width),np.arange(patch.height))
    weight=np.minimum(np.clip(xx/9,0,1),np.clip(yy/6,0,1))
    transition=Image.fromarray((weight*255).astype('uint8'))
    under=frame.crop((x,y,x+patch.width,y+patch.height))
    mixed=Image.composite(patch,under,transition)
    mix_path=ROOT/f'hand-mix-{i}.png'
    mixed.save(mix_path)
    subprocess.run([CLI,'recolor','--base',str(mix_path),
        '--spec',str(ROOT/'hand-palette.spec.json'),'--out-dir',str(ROOT/f'baked/mix-{i}'),
        '--alpha-threshold','0'],check=True,capture_output=True)
    mixed=Image.open(ROOT/f'baked/mix-{i}/hand-template-rgb.png').convert('RGBA')
    frame.paste(mixed,(x,y))
    result.paste(frame,(r['x'],r['y']))
    allowed_mask[r['y']+y:r['y']+y+patch.height,r['x']+x:r['x']+x+patch.width]=True
    proof.append(dict(frame=i,offset=[dx,dy],window=[x,y,x+patch.width,y+patch.height]))
result.save(ROOT/'sprite-sheet-alpha.png')
manifest.update(characterId='cat-carry-hands-v3',
    production='Built-in imagegen local hand-shape edit using dog hand references; canonical RGB palette bake and local frame assembly.',
    sprite_sheet_alpha_report='validation.json')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
before=np.array(original)
after=np.array(result)
assert np.array_equal(before[~allowed_mask],after[~allowed_mask])
allowed={tuple(r['rgb']) for r in palette['colors']}
used=set(map(tuple,np.unique(after[after[:,:,3]>0,:3],axis=0)))
assert used<=allowed
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        cut(result,r).save(folder/f'frame-{i}.png')
        if state!='right_carry':
            assert cut(original,r).tobytes()==cut(result,r).tobytes()
report=dict(passed=True,hand_windows=proof,
    outside_hand_windows_rgba_identical=True,other_states_identical=True,
    frame_layout_identical=True,animation_identical=True,
    palette_used=len(used),colors_outside_palette=0,
    changed_pixels=int(np.any(before!=after,axis=2).sum()),
    alpha_changed_only_inside_hand_windows=True,game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
preview=(SOURCE/'preview.html').read_text(encoding='utf-8').replace(
    '고양이 색 보정 v2 · 강아지 모션 비교','고양이 손 표현 v3 · 강아지 모션 비교')
(ROOT/'preview.html').write_text(preview,encoding='utf-8')
board=Image.new('RGB',(4*412,3*300),'#c5c9ce')
dog=Image.open(ROOT.parent/'dog-rgb-motion-v1/sprite-sheet-alpha.png').convert('RGBA')
for i,r in enumerate(rects):
    for row,im in enumerate([dog,original,result]):
        local=cut(im,r)
        crop=local.crop((290,235,430,340)).resize((392,294))
        board.paste(crop,(i*412,row*300),crop)
board.save(ROOT/'hand-comparison.png')
print(json.dumps(report))
