from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT.parent/'cat-front-sit-fix-v13'
m=json.loads((ROOT/'manifest.json').read_text())
layout=m['frame_layout']['rows']
sheet=np.array(Image.open(ROOT/'sprite-sheet-alpha.png'))
original=np.array(Image.open(SOURCE/'sprite-sheet-alpha.png'))
records=[]
for state,rows in layout.items():
    for i,r in enumerate(rows):
        a=np.array(Image.open(ROOT/'frames'/state/f'frame-{i}.png'))
        expected=sheet[r['y']:r['y']+512,r['x']:r['x']+512]
        src=original[r['y']:r['y']+512,r['x']:r['x']+512]
        rgb=src[:,:,:3]
        candidate=(src[:,:,3]>200)&(np.ptp(rgb.astype('int16'),axis=2)<25)&(rgb[:,:,0]>=57)&(rgb[:,:,0]<=73)
        mode=int(np.bincount(rgb[:,:,0][candidate]).argmax())
        anchor=candidate&(rgb[:,:,0]==mode)
        assert np.array_equal(a,expected)
        assert np.array_equal(a[:,:,3],src[:,:,3])
        assert np.all(a[anchor,:3]==[65,59,62])
        records.append(dict(png=f'frames/{state}/frame-{i}.png',
            matches_atlas=True,alpha_identical=True,
            base_rgb=[65,59,62],base_pixels_checked=int(anchor.sum())))
report=dict(passed=True,pngs_checked=len(records),base_rgb_difference=0,frames=records)
(ROOT/'png-color-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='frames'}))
