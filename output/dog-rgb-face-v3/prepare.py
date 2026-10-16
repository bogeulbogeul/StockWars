import json
import shutil
from pathlib import Path
from PIL import Image
from sprite_gen.frames.extract import extract_component_images, resize_cell
import build

root=Path(__file__).parent
record=json.loads((root/'generation.json').read_text(encoding='utf-8'))
shutil.copy2(record['source'],root/'face-native.png')
im=Image.open(root/'face-native.png').convert('RGBA')
assert im.getextrema()[3][0]==0,'Expected native transparent background'
parts=extract_component_images(im,1)
assert parts and len(parts)==1
p=parts[0].crop(parts[0].getbbox())
p=resize_cell(p,(304,round(p.height*304/p.width)))
out=Image.new('RGBA',(320,400))
out.alpha_composite(p,((320-p.width)//2,(400-p.height)//2))
out.save(build.RUN/'frames/face_portrait/frame-0.png')
build.compose()
print('Face-only portrait prepared at width 304px.')
