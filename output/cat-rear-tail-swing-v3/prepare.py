import json
import shutil
from pathlib import Path
from PIL import Image
import build

root=Path(__file__).parent
record=json.loads((root/'generation.json').read_text(encoding='utf-8'))
(root/'raw').mkdir(exist_ok=True)
shutil.copy2(record['source'],root/'raw/up_walk.png')
parts=build.getparts('up_walk',3)
scale=340/parts[1].height
row=Image.new('RGBA',(960,400))
for i,p in enumerate(parts):
    fr=build.saveframe('up_walk',i,p,scale) if i==2 else Image.open(build.RUN/f'frames/up_walk/frame-{i}.png').convert('RGBA')
    row.paste(fr,(i*320,0))
row.save(root/'before-palette.png')
build.write(root/'placement.json',{'scale':scale,'heights':[p.height for p in parts]})
