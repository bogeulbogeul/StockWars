"""Composite only explicit local retouches over the original frame export."""
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
import build

ROOT=Path(__file__).parent
OLD=ROOT.parent/'rabbit-tail-occlusion-v2/rabbit/run'
m=json.loads((OLD/'manifest.json').read_text(encoding='utf-8'))
layers=[Image.open(ROOT/f'baked-{name}/{name}.png').convert('RGBA') for name in ['rear','tail','eyes','nose']]
records=[]
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        path=f'frames/{state}/frame-{i}.png'
        original=Image.open(OLD/path).convert('RGBA');a=np.array(original)
        mask=np.zeros(a.shape[:2],dtype=bool)
        if state.endswith('_idle'):continue
        for layer in layers:
            p=np.array(layer.crop((r['x'],r['y'],r['x']+320,r['y']+400)))
            selected=p[:,:,3]>0
            a[selected,:3]=p[selected,:3];mask|=selected
        # Local edits must never change the original silhouette or pose.
        assert np.array_equal(a[:,:,3],np.asarray(original)[:,:,3])
        Image.fromarray(a).save(build.RUN/path)
        if mask.any():
            dest=ROOT/'edit-masks'/state;dest.mkdir(parents=True,exist_ok=True)
            Image.fromarray(np.where(mask,255,0).astype(np.uint8)).save(dest/f'frame-{i}.png')
        records.append({'state':state,'frame':i,'mask_pixels':int(mask.sum())})
for direction in ['down','right','up']:
    shutil.copy2(build.RUN/f'frames/{direction}_walk/frame-1.png',build.RUN/f'frames/{direction}_idle/frame-0.png')
build.compose()
build.write(ROOT/'edit-records.json',records)
p=Image.open(build.RUN/'frames/face_portrait/frame-0.png').convert('RGBA')
p.crop(p.getbbox()).save(ROOT/'face-icon.png')
