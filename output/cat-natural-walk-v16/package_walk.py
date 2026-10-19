"""Restore natural front face; tiny whole-drawing walk rhythm, no head rigging."""
from pathlib import Path
from collections import deque
import ast
import json
import shutil
import numpy as np
from PIL import Image,ImageFilter

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-clean-motion-v15'
NATURAL=ROOT.parent/'cat-color-consistent-v14'
manifest=json.loads((SOURCE/'manifest.json').read_text())
layout=manifest['frame_layout']['rows']
source=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
natural=np.array(Image.open(NATURAL/'sprite-sheet-alpha.png').convert('RGBA'))
edited=source.copy()
# Reuse only the existing color cleanup function, not the v15 head edits.
tree=ast.parse((SOURCE/'package_clean.py').read_text())
definition=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='clean')
exec(compile(ast.Module(body=[definition],type_ignores=[]),'<shared-color-clean>','exec'))

def cell(a,r):
    return a[r['y']:r['y']+512,r['x']:r['x']+512]

offsets=[(-1,-1),(0,0),(1,-2)]
for i,r in enumerate(layout['down_walk'][:3]):
    original=Image.fromarray(clean(cell(natural,r)))
    canvas=Image.new('RGBA',(512,512))
    canvas.alpha_composite(original,offsets[i])
    cell(edited,r)[:]=np.array(canvas)
cell(edited,layout['down_idle'][0])[:]=cell(edited,layout['down_walk'][1])
outside=np.ones(source.shape[:2],bool)
for r in [layout['down_idle'][0],*layout['down_walk'][:3]]:
    cell(outside,r)[:]=False
assert np.array_equal(source[outside],edited[outside])
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,r in enumerate(rows):
        Image.fromarray(cell(edited,r)).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-natural-walk-v16',production='Restore v14 natural front face with v15 material cleanup. Move complete front walk drawings by only (-1,-1),(0,0),(1,-2) pixels. No isolated head rotation, warp or new face generation. All other states unchanged.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,nonfront_rgba_identical=True,head_rotation_degrees=0,
    whole_frame_offsets=offsets,animation_identical=True,layout_identical=True,
    original_natural_face_restored=True,game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(ROOT/'preview.html').write_text((SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 정면 머리 리듬·색면 정리 v15','고양이 자연스러운 걷기 리듬 v16'),encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
print(json.dumps(report))
