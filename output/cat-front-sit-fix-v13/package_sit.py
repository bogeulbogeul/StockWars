"""Replace only front-sit lower body; retain the original head and other states."""
from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-design-match-v12'
manifest=json.loads((SOURCE/'manifest.json').read_text())
oldmanifest=json.loads(json.dumps(manifest))
layout=manifest['frame_layout']['rows']
original=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png').convert('RGBA'))
edited=original.copy()
r=layout['down_sit'][0]
old=original[r['y']:r['y']+512,r['x']:r['x']+512]
new=np.array(Image.open(ROOT/'sit-generated.png').convert('RGBA').resize((512,512),Image.Resampling.LANCZOS))
new[new[:,:,3]<24]=0
# Face, brows, ears, expression and their exact original colors remain intact.
new[:286]=old[:286]
edited[r['y']:r['y']+512,r['x']:r['x']+512]=new
outside=np.ones(original.shape[:2],bool)
outside[r['y']+286:r['y']+512,r['x']:r['x']+512]=False
assert np.array_equal(original[outside],edited[outside])
Image.fromarray(edited).save(ROOT/'sprite-sheet-alpha.png')
for state,rows in layout.items():
    folder=ROOT/'frames'/state
    folder.mkdir(exist_ok=True,parents=True)
    for i,q in enumerate(rows):
        Image.fromarray(edited[q['y']:q['y']+512,q['x']:q['x']+512]).save(folder/f'frame-{i}.png')
manifest.update(characterId='cat-front-sit-fix-v13',production='GPT front-sit body correction to dog biped seated pose, hands on raised knees, short shins and feet grounded. Original cat head above y286 preserved pixel-identically; all other states unchanged.')
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
report=dict(passed=True,changed_state='down_sit',outside_body_rgba_identical=True,
    head_rgba_identical=True,other_states_rgba_identical=True,
    layout_identical=manifest['frame_layout']==oldmanifest['frame_layout'],
    animation_identical=manifest['animation']==oldmanifest['animation'],
    changed_pixels=int(np.any(original!=edited,axis=2).sum()),game_installed=False)
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(ROOT/'preview.html').write_text((SOURCE/'preview.html').read_text(encoding='utf-8').replace('고양이 디자인 시트 외형 맞춤 v12','고양이 정면 앉기 자세 수정 v13'),encoding='utf-8')
shutil.copy2(SOURCE/'package_preview.py',ROOT/'package_preview.py')
board=Image.new('RGBA',(1024,512),'#c5c9ce')
board.alpha_composite(Image.fromarray(old),(0,0))
board.alpha_composite(Image.fromarray(new),(512,0))
board.convert('RGB').save(ROOT/'sit-before-after.png')
print(json.dumps(report))
