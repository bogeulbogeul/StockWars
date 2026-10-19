"""Explicit chocolate-material masks for a canonical fixed-RGB bake."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).parent
run=root/'red-fox/run'
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
a=np.array(Image.open(root/'baked/shared-rgb.png').convert('RGBA'))
pal=np.array(json.loads((root/'palette.json').read_text(encoding='utf-8'))['rgb'],dtype=int)
base=pal[((pal-[77,46,29])**2).sum(axis=1).argmin()].tolist()
mask=np.zeros(a.shape[:2],dtype=bool)
orange_mask=np.zeros_like(mask)
for state,rects in m['frame_layout']['rows'].items():
    for r in rects:
        x,y=r['x'],r['y'];part=a[y:y+400,x:x+320]
        yy=np.indices((400,320))[0]
        area=np.ones((400,320),dtype=bool) if state.startswith('up_') else yy<210 if state=='face_portrait' else (yy<120)|(yy>195)
        # Deep outline remains untouched. Eyes/nose/mouth are excluded by area.
        material=area&(part[:,:,3]>0)&(part[:,:,0]>35)&(part[:,:,0]<165)&(part[:,:,1]<150)&(part[:,:,2]<140)
        mask[y:y+400,x:x+320]|=material
        orange=(part[:,:,3]>0)&(part[:,:,0]>200)&(part[:,:,0].astype(int)-part[:,:,1]>65)&(part[:,:,0].astype(int)-part[:,:,2]>120)
        if not state.startswith('up_'):
            if state=='face_portrait':
                orange[240:335,55:135]=False;orange[240:335,185:265]=False
            else:
                orange[125:185,105:145]=False;orange[125:185,170:220]=False
        orange_mask[y:y+400,x:x+320]|=orange
patch=a.copy();patch[:,:,3]=np.where(mask,a[:,:,3],0)
Image.fromarray(patch).save(root/'chocolate-patches.png')
hx=lambda c:'#'+''.join(f'{int(v):02x}' for v in c)
spec={'version':1,'kind':'sprite-gen-recolor','match':'tolerance','tolerance':255,
      'variants':[{'name':'chocolate','map':{hx(base):hx(base)}}]}
(root/'chocolate-spec.json').write_text(json.dumps(spec,indent=2)+'\n',encoding='utf-8')
orange_base=pal[((pal-[255,137,43])**2).sum(axis=1).argmin()].tolist()
patch=a.copy();patch[:,:,3]=np.where(orange_mask,a[:,:,3],0)
Image.fromarray(patch).save(root/'orange-patches.png')
orange_spec={'version':1,'kind':'sprite-gen-recolor','match':'tolerance','tolerance':255,
      'variants':[{'name':'orange','map':{hx(orange_base):hx(orange_base)}}]}
(root/'orange-spec.json').write_text(json.dumps(orange_spec,indent=2)+'\n',encoding='utf-8')
(root/'material-verification.json').write_text(json.dumps({'chocolate_base_RGB':base,'orange_base_RGB':orange_base,'selected_pixels':int(mask.sum()),'face_eye_regions_excluded':True},indent=2)+'\n',encoding='utf-8')
print('Shared chocolate RGB:',base)
