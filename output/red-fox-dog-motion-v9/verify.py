"""Export integrity and shared timing checks, not a live motion pass."""
import json
import hashlib
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).parent
run=root/'red-fox/run'
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
dog=json.loads((root.parent/'dog-hidden-hand-v9/dog/run/manifest.json').read_text(encoding='utf-8'))
assert m['frame_layout']==dog['frame_layout'],'Layout differs from adopted dog'
assert m['animation']==dog['animation'],'Playback differs from adopted dog'
sheet=Image.open(run/'sprite-sheet-alpha.png').convert('RGBA')
palette={tuple(c) for c in json.loads((root/'palette.json').read_text(encoding='utf-8'))['rgb']}
unique=set();count=0
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        fr=Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA')
        assert fr.size==(320,400)
        bb=fr.getbbox();assert bb and bb[0]>0 and bb[1]>0 and bb[2]<320 and bb[3]<400,(state,i,bb)
        cut=sheet.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
        assert cut.tobytes()==fr.tobytes(),(state,i,'atlas mismatch')
        a=np.asarray(fr)
        assert {tuple(c) for c in np.unique(a[a[:,:,3]>0,:3],axis=0)}<=palette
        unique.add(hashlib.sha256(fr.tobytes()).hexdigest());count+=1
    if state.endswith('_idle'):
        direction=state.split('_')[0]
        assert Image.open(run/f'frames/{state}/frame-0.png').tobytes()==Image.open(run/f'frames/{direction}_walk/frame-1.png').tobytes()
assert count==19 and len(unique)==16
report={'states':10,'logical_frames':count,'unique_drawings':len(unique),
        'layout_and_playback_equal_dog_v9':True,'palette_size':len(palette),'outside_palette_pixels':0,
        'atlas_exact':True,'neutral_exact':True,'clipping':False,
        'live_motion_continuity':'experimental; not observed','game_installed':False}
(root/'export-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
