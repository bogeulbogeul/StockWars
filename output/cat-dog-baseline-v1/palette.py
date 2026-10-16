"""Create an explicit shared RGB map; sprite-gen performs the actual recolor."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).parent
source=root.parent/'style-unification-v3/cat/run/frames/down_idle/frame-0.png'
im=Image.open(source).convert('RGBA')
a=np.asarray(im)
pixels=a[a[:,:,3]>240,:3]
# Master face/body colours plus dedicated eye colours protect small brown irises.
full=Image.fromarray(pixels.reshape(1,-1,3)).quantize(colors=256,method=Image.Quantize.MEDIANCUT)
eye=np.asarray(im.crop((115,120,220,165)))
eye_pixels=eye[(eye[:,:,3]>240)&(eye[:,:,0]>eye[:,:,2]+10),:3]
eyeq=Image.fromarray(eye_pixels.reshape(1,-1,3)).quantize(colors=48,method=Image.Quantize.MEDIANCUT)
pal=[]
for q in [full,eyeq]:
    rgb=q.convert('RGB')
    for c in rgb.getcolors(rgb.width*rgb.height):
        if list(c[1]) not in pal:
            pal.append(list(c[1]))
# Low-value brown antialias colours from irises must not become black-fur spots.
# Keep coloured gold/coral highlights; dark fur/edges use neutral charcoal shades.
pal=[c for c in pal if max(c)>=160 or max(c)-min(c)<=12]
pal.sort(key=lambda c:(sum(c),c))
(root/'palette.json').write_text(json.dumps({'master':str(source),'rgb':pal,'dither':False},indent=2),encoding='utf-8')
atlas=Image.open(root/'cat/run/sprite-sheet-alpha.png').convert('RGBA')
data=np.asarray(atlas)
unique=np.unique(data[data[:,:,3]>0,:3],axis=0)
targets=np.asarray(pal,dtype=np.int32)
mapping={}
hexcolor=lambda c:'#'+''.join(f'{int(v):02x}' for v in c)
for start in range(0,len(unique),2048):
    block=unique[start:start+2048].astype(np.int32)
    delta=block[:,None,:]-targets[None,:,:]
    # Same deterministic nearest-colour rule for every pixel in every state.
    dist=(delta*delta).sum(axis=2)
    indexes=np.argmin(dist,axis=1)
    for old,i in zip(block,indexes):
        mapping[hexcolor(old)]=hexcolor(targets[i])
spec={'version':1,'kind':'sprite-gen-recolor','match':'exact','tolerance':0,
      'variants':[{'name':'shared-rgb','map':mapping}]}
(root/'recolor-spec.json').write_text(json.dumps(spec,separators=(',',':')),encoding='utf-8')
fast={'version':1,'kind':'sprite-gen-recolor','match':'tolerance','tolerance':255,
      'variants':[{'name':'shared-rgb','map':{hexcolor(c):hexcolor(c) for c in pal}}]}
(root/'recolor-nearest-spec.json').write_text(json.dumps(fast,indent=2),encoding='utf-8')
(root/'palette.csv').write_text('hex,R,G,B\n'+'\n'.join(f'{hexcolor(c)},{c[0]},{c[1]},{c[2]}' for c in pal)+'\n',encoding='utf-8')
print(f'Palette: {len(pal)} RGB colours, map: {len(mapping)} source RGB values.')
