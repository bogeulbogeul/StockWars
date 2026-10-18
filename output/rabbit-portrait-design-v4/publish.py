"""Publish a design-faithful portrait without changing other motion PNGs."""
import json
import hashlib
from pathlib import Path
import numpy as np
from PIL import Image
import build

root=Path(__file__).parent
old=root.parent/'rabbit-face-rear-cleanup-v3'
native=np.array(Image.open(root/'portrait-native-aligned.png').convert('RGBA'))
final=np.array(Image.open(root/'baked/portrait-fur.png').convert('RGBA'))
mask=np.asarray(Image.open(root/'iris-preserve-mask.png'))>0
assert np.array_equal(native[:,:,3],final[:,:,3])
final[mask,:3]=native[mask,:3]
image=Image.fromarray(final)
image.save(build.RUN/'frames/face_portrait/frame-0.png')
image.crop(image.getbbox()).save(root/'face-icon.png')
previous=json.loads((old/'palette.json').read_text(encoding='utf-8'))
original_colors={tuple(c) for c in previous['rgb']}
iris_colors={tuple(int(v) for v in c) for c in native[mask,:3]}
palette=sorted(original_colors|iris_colors)
build.write(root/'palette.json',{'rgb':palette,'body_palette_source':'../rabbit-face-rear-cleanup-v3/palette.json',
    'body_palette_preserved':True,'portrait_iris_native_RGB_preserved':True,
    'note':'A shared RGB registry, not a cap on new portrait iris shades. Existing motion PNGs are unchanged.'})
build.compose()
m=json.loads((build.RUN/'manifest.json').read_text(encoding='utf-8'))
m['shared_rgb_palette']='../../palette.json'
m['appearance_reference']='output/rabbit-design-2026-10-17-v1/design-sheet.png'
build.write(build.RUN/'manifest.json',m)
oldm=json.loads((old/'rabbit/run/manifest.json').read_text(encoding='utf-8'))
assert m['frame_layout']==oldm['frame_layout'] and m['animation']==oldm['animation']
unchanged=[]
sheet=Image.open(build.RUN/'sprite-sheet-alpha.png').convert('RGBA')
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        rel=f'frames/{state}/frame-{i}.png'
        path=build.RUN/rel
        frame=Image.open(path).convert('RGBA')
        a=np.asarray(frame)
        assert {tuple(int(v) for v in c) for c in np.unique(a[a[:,:,3]>0,:3],axis=0)}<=set(palette)
        assert sheet.crop((r['x'],r['y'],r['x']+320,r['y']+400)).tobytes()==frame.tobytes()
        if state!='face_portrait':
            assert path.read_bytes()==(old/'rabbit/run'/rel).read_bytes(),(state,i,'motion changed')
            unchanged.append({'state':state,'frame':i})
assert len(unchanged)==18
assert np.array_equal(final[mask,:3],native[mask,:3])
bb=image.getbbox();assert bb[0]>0 and bb[1]>0 and bb[2]<320 and bb[3]<400
build.write(root/'verification.json',{'changed_logical_frames':1,'other_18_frame_PNGs_byte_identical':True,
    'layout_and_playback_unchanged':True,'portrait_iris_RGB_native_exact':True,'original_body_RGB_registry_preserved':True,
    'shared_RGB_count':len(palette),'original_RGB_count':len(original_colors),'added_iris_RGB_count':len(iris_colors-original_colors),
    'atlas_exact':True,'clipping':False,'face_only_no_neck':True,'game_installed':False,
    'live_motion_review':'not needed for this unchanged motion export; not performed', 'unchanged':unchanged})
print(json.dumps({'unchanged_motion_PNGs':18,'shared_RGB_count':len(palette),'added_iris_RGB_count':len(iris_colors-original_colors),'portrait_bbox':bb}))
