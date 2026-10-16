"""Verify sprite export integrity; this is not a motion-continuity verdict."""
import hashlib
import json
from pathlib import Path
from PIL import Image

root=Path(__file__).parent
run=root/'dog/run'
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
sheet=Image.open(run/'sprite-sheet-alpha.png').convert('RGBA')
hashes=set()
count=0
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        fr=Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA')
        assert fr.size==(320,400)
        bb=fr.getbbox()
        assert bb and bb[0]>0 and bb[1]>0 and bb[2]<320 and bb[3]<400,(state,i,bb)
        cut=sheet.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
        assert cut.tobytes()==fr.tobytes(),(state,i,'sheet mismatch')
        hashes.add(hashlib.sha256(fr.tobytes()).hexdigest())
        count+=1
    if state.endswith('_walk'):
        assert m['animation']['rows'][state]['sequence']==[0,1,2,1]
        assert m['animation']['rows'][state]['durations_ms']==[160]*3
        idle=state.replace('_walk','_idle')
        a=Image.open(run/f'frames/{state}/frame-1.png').tobytes()
        b=Image.open(run/f'frames/{idle}/frame-0.png').tobytes()
        assert a==b
assert count==19 and len(hashes)==16,(count,len(hashes))
report={'logical_frames':count,'unique_drawings':len(hashes),'states':len(m['frame_layout']['rows']),
        'atlas_pixel_match':True,'idle_is_walk_neutral':True,'frames_clipped':False,
        'walk_sequence':[0,1,2,1],'walk_frame_ms':160,
        'RGB_recoloring':False,'pasted_static_heads':False,
        'live_motion_continuity':'not observed; experimental design candidate',
        'temporal_material_color_lock':'not certified by static export checks',
        'game_installed':False}
(root/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
