"""Publish canonical shared-color bake and preserve extracted pose geometry."""
import json
import numpy as np
from PIL import Image
import build

root=build.HERE;run=build.RUN
sheet=Image.open(root/'baked/shared-rgb.png').convert('RGBA')
for material_path in [root/'baked-material/chocolate.png',root/'baked-orange/orange.png']:
    if material_path.exists():
        a=np.array(sheet);p=np.array(Image.open(material_path).convert('RGBA'))
        selected=p[:,:,3]>0;a[selected,:3]=p[selected,:3]
        sheet=Image.fromarray(a)
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        path=run/f'frames/{state}/frame-{i}.png'
        new=sheet.crop((r['x'],r['y'],r['x']+320,r['y']+400))
        assert np.array_equal(np.asarray(new)[:,:,3],np.asarray(Image.open(path))[:,:,3])
        new.save(path)
build.compose()
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
m['shared_rgb_palette']='../../palette.json'
m['appearance_reference']='output/red-fox-design-2026-10-17-v1/design-sheet.png'
build.write(run/'manifest.json',m)
p=Image.open(run/'frames/face_portrait/frame-0.png').convert('RGBA')
p.crop(p.getbbox()).save(root/'face-icon.png')
print('Published red fox native poses with one shared body/eye RGB palette.')
