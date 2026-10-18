"""Reuse completed diagonal-walk head drawings without resampling or recolor."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
import build

root=Path(__file__).parent
source=root.parent/'red-fox-dog-baseline-v1/red-fox/run/frames'
previous=root.parent/'red-fox-carry-consistency-v2/red-fox/run/frames'
phases=[0,1,2,1]
checks=[]
for i,phase in enumerate(phases):
    carry=np.array(Image.open(previous/f'right_carry/frame-{i}.png').convert('RGBA'))
    walk=np.array(Image.open(source/f'right_walk/frame-{phase}.png').convert('RGBA'))
    # Complete existing head drawing, down to its jaw/neck boundary.
    carry[:181]=walk[:181]
    Image.fromarray(carry).save(build.RUN/f'frames/right_carry/frame-{i}.png')
    assert np.array_equal(carry[:181],walk[:181])
    assert np.array_equal(carry[181:],np.array(Image.open(previous/f'right_carry/frame-{i}.png'))[181:])
    checks.append({'carry_frame':i,'walk_head_frame':phase,'head_RGBA_exact':True,'body_RGBA_exact_v2':True})
build.compose()
m=json.loads((build.RUN/'manifest.json').read_text())
m.update(characterId='red-fox-carry-walk-face-v3',shared_rgb_palette='../../palette.json')
build.write(build.RUN/'manifest.json',m)
p=root/'preview.html'
html=p.read_text(encoding='utf-8').replace("state.value='down_walk'","state.value='right_carry'")
p.write_text(html,encoding='utf-8')
build.write(root/'face-match-verification.json',{'frames':checks,'palette_unchanged':True,'live_visual_qa':'pending'})
