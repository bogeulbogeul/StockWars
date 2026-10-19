"""Compose a local native tail/occluded-pelvis repair onto preserved v4 frames."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
import build

root=Path(__file__).parent
prior=root.parent/'red-fox-carry-lines-v4/red-fox/run/frames'
palette=np.array(json.loads((root/'palette.json').read_text())['rgb'],dtype=np.int32)
parts=build.getparts('up_walk',3)
scale=340/parts[1].height
for i in [0,2]:
    native=np.array(build.saveframe('up_walk',i,parts[i],scale))
    old=np.array(Image.open(prior/f'up_walk/frame-{i}.png').convert('RGBA'))
    visible=native[:,:,3]>0
    colors,inv=np.unique(native[visible,:3],axis=0,return_inverse=True)
    mapped=[]
    for start in range(0,len(colors),512):
        chunk=colors[start:start+512].astype(np.int32)
        mapped.append(palette[((chunk[:,None]-palette[None])**2).sum(2).argmin(1)])
    native[visible,:3]=np.concatenate(mapped)[inv]
    r,g,b=native[:,:,:3].astype(int).transpose(2,0,1)
    orange=visible&(r>175)&(r-g>45)&(g-b>35)
    native[orange,:3]=[253,138,44]
    brown=visible&(r>35)&(r<160)&(g<120)&(b<110)
    native[brown,:3]=[78,46,30]
    # Keep the coherent native neck/arm/hip contours rather than rectangular
    # tail patches that cut through outlines. Original head and feet stay exact.
    out=native.copy()
    out[:175]=old[:175]
    out[302:]=old[302:]
    Image.fromarray(out).save(build.RUN/f'frames/up_walk/frame-{i}.png')
    assert np.array_equal(out[:175],old[:175])
    assert np.array_equal(out[302:],old[302:])
build.compose()
m=json.loads((build.RUN/'manifest.json').read_text())
m.update(characterId='red-fox-tail-root-v6',shared_rgb_palette='../../palette.json',game_integrated=False)
build.write(build.RUN/'manifest.json',m)
p=root/'preview.html'
p.write_text(p.read_text(encoding='utf-8').replace("state.value='down_walk'","state.value='up_walk'"),encoding='utf-8')
unchanged=0
for path in (build.RUN/'frames').glob('*/*.png'):
    rel=path.relative_to(build.RUN/'frames')
    if str(rel).replace('\\','/') not in ['up_walk/frame-0.png','up_walk/frame-2.png']:
        assert path.read_bytes()==(prior/rel).read_bytes()
        unchanged+=1
build.write(root/'preservation.json',{'other_frames_byte_identical':unchanged,'above_y175_and_below_y302_RGBA_exact':True,'palette_unchanged':True,'game_installed':False,'live_motion_qa':'pending'})
