"""Extract native short-stride row, retaining approved neutral exactly."""
import json
import shutil
from pathlib import Path
from PIL import Image
import build

root=Path(__file__).parent
record=json.loads((root/'generation.json').read_text(encoding='utf-8'))
(root/'raw').mkdir(exist_ok=True)
shutil.copy2(record['source'],root/'raw/right_walk.png')
parts=build.getparts('right_walk',3)
scale=340/parts[1].height
for i in [0,2]:
    build.saveframe('right_walk',i,parts[i],scale)
row=Image.new('RGBA',(960,400))
for i in range(3):
    row.paste(Image.open(build.RUN/f'frames/right_walk/frame-{i}.png'),(i*320,0))
row.save(root/'row-before-palette.png')
build.write(root/'placement.json',{'common_scale':scale,'native_heights':[p.height for p in parts],
    'neutral_retained_from_v3':True,'no_limb_warp_no_head_paste':True})
