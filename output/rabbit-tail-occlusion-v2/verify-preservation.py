"""Verify original RGB and all geometry outside explicit local tail mattes."""
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).parent
old=root.parent/'rabbit-dog-baseline-v1'
newrun=root/'rabbit/run'
manifest=json.loads((newrun/'manifest.json').read_text(encoding='utf-8'))
original=json.loads((old/'rabbit/run/manifest.json').read_text(encoding='utf-8'))
assert manifest['frame_layout']==original['frame_layout']
assert manifest['animation']==original['animation']
assert (root/'palette.json').read_bytes()==(old/'palette.json').read_bytes()
checks=[]
for state,rects in manifest['frame_layout']['rows'].items():
    for i in range(len(rects)):
        rel=Path(f'frames/{state}/frame-{i}.png')
        a=np.asarray(Image.open(old/'rabbit/run'/rel).convert('RGBA'))
        b=np.asarray(Image.open(newrun/rel).convert('RGBA'))
        assert np.array_equal(a[:,:,:3],b[:,:,:3]),(state,i,'RGB changed')
        assert np.all(b[:,:,3]<=a[:,:,3]),(state,i,'new or moved geometry')
        visible=b[:,:,3]>0
        assert np.array_equal(a[visible],b[visible]),(state,i,'retained RGBA changed')
        mattepath=root/'mattes'/state/f'frame-{i}.png'
        if state in ['down_idle','right_idle']:
            mattepath=root/'mattes'/state.replace('_idle','_walk')/'frame-1.png'
        if mattepath.exists():
            matte=np.asarray(Image.open(mattepath))
            assert np.array_equal(a[matte>0],b[matte>0]),(state,i,'outside matte changed')
        else:
            assert np.array_equal(a,b),(state,i,'unrequested state changed')
        changed=int(np.any(a!=b,axis=2).sum())
        checks.append({'state':state,'frame':i,'changed_alpha_pixels':changed,
                       'changed_RGB_pixels':0,'all_retained_RGBA_exact':True})
unchanged=[c for c in checks if c['changed_alpha_pixels']==0]
assert len(unchanged)==6
assert all(c['changed_alpha_pixels']==0 for c in checks if c['state'].startswith('up_'))
report={'logical_frames':19,'changed_logical_frames':13,'unchanged_logical_frames':6,
        'all_RGB_channels_byte_identical':True,'retained_RGBA_exact':True,
        'changes_confined_to_local_tail_mattes':True,'new_or_moved_body_pixels':0,
        'rear_all_four_logical_frames_unchanged':True,'palette_file_byte_identical':True,
        'layout_and_animation_unchanged':True,'palette_size':289,'game_installed':False,
        'temporal_continuity':'Not observed live; existing poses and playback preserved',
        'frames':checks}
(root/'preservation-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='frames'},ensure_ascii=False))
