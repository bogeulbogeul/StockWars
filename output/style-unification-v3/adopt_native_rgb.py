"""Adopt native corrected continuous RGB, rejecting both palette bake trials.

Hard reduction damaged rare eye colors; dominant-only exact replacement could
make subtle native gradients grainy. Neither is included in final sprite PNGs.
The actual image_gen redraw already unifies colors/lines using the same identity
reference in every pose. Do not mislabel rejected recolor reports as adopted.
"""
import json,shutil
from PIL import Image
from prepare import HERE,IDS
from process import write
for cid in IDS:
 run=HERE/cid/'run';shutil.copy2(run/'native-before-palette.png',run/'sprite-sheet-alpha.png')
 atlas=Image.open(run/'sprite-sheet-alpha.png').convert('RGBA')
 m=json.loads((run/'manifest.json').read_text())
 for state,rects in m['frame_layout']['rows'].items():
  for i,r in enumerate(rects):atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])).save(run/f'frames/{state}/frame-{i}.png')
 write(run/'rejected-processing.json',{'adopted':False,'files':['variants/','recolor.spec.json','recolor.log'],'reason':'Reduced palette lost rare eye whites; dominant-color exact replacement introduced grain in soft native gradients. Final PNGs use corrected native RGB and canonical alpha; no palette reduction/remap is adopted.'})
print('Adopted continuous native RGB for all eight final sheets. Palette trials excluded.')
