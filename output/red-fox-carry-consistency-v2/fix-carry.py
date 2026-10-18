"""Assemble native edited heads; preserve existing body poses and shared RGB."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
import build

root=Path(__file__).parent
prior=root.parent/'red-fox-dog-baseline-v1'
pal=np.array(json.loads((root/'palette.json').read_text())['rgb'],dtype=np.int32)
parts=build.getparts('right_carry',4)
scale=340/np.median([p.height for p in parts])
report=[]
for i,part in enumerate(parts):
    generated=build.saveframe('right_carry',i,part,scale)
    edited=np.array(generated)
    old=np.array(Image.open(prior/f'red-fox/run/frames/right_carry/frame-{i}.png').convert('RGBA'))
    # Only the native edited head is retained; body and gait remain original.
    result=old.copy()
    result[:178]=edited[:178]
    region=result[:178]
    visible=region[:,:,3]>0
    colors,inverse=np.unique(region[visible,:3],axis=0,return_inverse=True)
    targets=[]
    for start in range(0,len(colors),512):
        chunk=colors[start:start+512].astype(np.int32)
        targets.append(pal[((chunk[:,None]-pal[None])**2).sum(2).argmin(1)])
    region[visible,:3]=np.concatenate(targets)[inverse]
    # Keep the same flat fur materials as the unchanged walking drawings.
    rr,gg,bb=region[:,:,:3].astype(int).transpose(2,0,1)
    orange=visible&(rr>200)&(rr-gg>65)&(rr-bb>120)
    orange[125:178,105:145]=False
    orange[125:178,170:220]=False
    region[orange,:3]=[253,138,44]
    yy,xx=np.indices(region.shape[:2])
    ear=(yy<120)&visible&(rr>35)&(rr<165)&(gg<150)&(bb<140)
    region[ear,:3]=[78,46,30]
    # Erroneous chocolate classification at the back/upper-arm junction.
    yy,xx=np.indices(old.shape[:2])
    spot=(xx>=115)&(xx<142)&(yy>=195)&(yy<238)&(old[:,:,3]>0)&np.all(old[:,:,:3]==[78,46,30],axis=2)
    result[spot,:3]=[253,138,44]
    Image.fromarray(result).save(build.RUN/f'frames/right_carry/frame-{i}.png')
    assert np.array_equal(result[238:],old[238:])
    report.append({'frame':i,'corrected_spot_pixels':int(spot.sum()),'below_y238_exact':True})
build.compose()
m=json.loads((build.RUN/'manifest.json').read_text())
m.update(characterId='red-fox-carry-consistency-v2',shared_rgb_palette='../../palette.json',game_integrated=False)
build.write(build.RUN/'manifest.json',m)
unchanged=[]
for path in (build.RUN/'frames').glob('*/*.png'):
    if path.parent.name!='right_carry':
        assert path.read_bytes()==(prior/'red-fox/run/frames'/path.relative_to(build.RUN/'frames')).read_bytes()
        unchanged.append(str(path.relative_to(build.RUN/'frames')))
build.write(root/'carry-fix-verification.json',{'carry':report,'other_frames_byte_identical':len(unchanged),'palette_unchanged':True,'live_visual_qa':'pending'})
