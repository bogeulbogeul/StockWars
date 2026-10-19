"""Publish two local edits and prove lower-root and other frames preserved."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
import build

root=Path(__file__).parent
old=root.parent/'rabbit-portrait-design-v4/rabbit/run'
m=json.loads((old/'manifest.json').read_text(encoding='utf-8'))
layer=Image.open(root/'baked/upper-tail.png').convert('RGBA')
metrics=[]
for i in [0,2]:
    rel=f'frames/up_walk/frame-{i}.png'
    a=np.array(Image.open(old/rel).convert('RGBA'))
    p=np.array(layer.crop((320*i,2000,320*(i+1),2400)))
    mask=p[:,:,3]>0;b=a.copy();b[mask,:3]=p[mask,:3]
    assert np.array_equal(a[:,:,3],b[:,:,3])
    assert np.array_equal(a[256:,:,:],b[256:,:,:])
    assert np.array_equal(a[~mask],b[~mask])
    Image.fromarray(b).save(build.RUN/rel)
build.compose()
current=json.loads((build.RUN/'manifest.json').read_text(encoding='utf-8'))
assert current['animation']==m['animation'] and current['frame_layout']==m['frame_layout']
current['shared_rgb_palette']='../../palette.json'
build.write(build.RUN/'manifest.json',current)
assert (root/'palette.json').read_bytes()==(old.parents[1]/'palette.json').read_bytes()
sheet=Image.open(build.RUN/'sprite-sheet-alpha.png').convert('RGBA')
unchanged=0
pal={tuple(c) for c in json.loads((root/'palette.json').read_text(encoding='utf-8'))['rgb']}
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        rel=f'frames/{state}/frame-{i}.png'
        path=build.RUN/rel
        if (state,i) not in [('up_walk',0),('up_walk',2)]:
            assert path.read_bytes()==(old/rel).read_bytes(),(state,i)
            unchanged+=1
        a=np.array(Image.open(path).convert('RGBA'))
        assert sheet.crop((r['x'],r['y'],r['x']+320,r['y']+400)).tobytes()==a.tobytes(),(state,i,'atlas mismatch')
        assert {tuple(int(v) for v in c) for c in np.unique(a[a[:,:,3]>0,:3],axis=0)}<=pal
assert unchanged==17
for i,top in [(0,220),(1,225),(2,220)]:
    a=np.array(Image.open(build.RUN/f'frames/up_walk/frame-{i}.png').convert('RGBA'))
    region=a[top:top+17,132:188]
    yy,xx=np.where((region[:,:,0]>220)&(region[:,:,1]>190)&(region[:,:,2]>165))
    metrics.append(float(xx.mean()+132))
assert metrics[0]<metrics[1]<metrics[2],metrics
build.write(root/'verification.json',{'changed_frames':['up_walk/0','up_walk/2'],'other_17_PNGs_byte_identical':True,
    'all_alpha_unchanged':True,'lower_root_y256_and_below_exact':True,'palette_file_unchanged':True,
    'upper_white_tuft_centroid_x_A_neutral_B':metrics,'layout_and_playback_unchanged':True,
    'game_installed':False,'live_continuity':'experimental; not observed'})
print(json.dumps({'unchanged_PNGs':unchanged,'upper_centroid_x':metrics}))
