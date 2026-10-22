from pathlib import Path
from PIL import Image
import numpy as np,json
P=Path(__file__).resolve().parent
checks=[]
for kind in ['bread','drink']:
    for view in ['front','angle']:
        for i in range(36):
            pixels=np.array(Image.open(P/f'{kind}-{view}'/f'{i:03}.png').convert('RGB'))
            mask=pixels.max(axis=2)<65
            mask[:145]=False;mask[215:]=False;mask[:,:130]=False;mask[:,335:]=False
            pending=set(map(tuple,np.argwhere(mask)));components=[]
            while pending:
                seed=pending.pop();stack=[seed];region={seed}
                while stack:
                    y,x=stack.pop()
                    for q in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
                        if q in pending:pending.remove(q);stack.append(q);region.add(q)
                if len(region)>30:components.append(region)
            eyes=sorted(components,key=len,reverse=True)[:2]
            assert len(eyes)==2,(kind,view,i)
            for region in eyes:
                core=[(y,x) for y,x in region if all((y+dy,x+dx) in region for dy in range(-2,3) for dx in range(-2,3))]
                assert len(core)>8,(kind,view,i)
                med=np.median([pixels[y,x] for y,x in core],axis=0)
                assert max(med)<10 and max(med)-min(med)<5,(kind,view,i,med)
                checks.append({'kind':kind,'view':view,'frame':i,'medianRGB':med.tolist()})
report={'frames':144,'eyeRegions':len(checks),'eyeInteriorsRemainBlack':True,'maxMedianChannel':max(max(c['medianRGB']) for c in checks),'scope':'neutral studio renders, eye interior medians, excluding edges','checks':checks}
(P/'eye-validation.json').write_text(json.dumps(report,indent=2));print({k:v for k,v in report.items() if k!='checks'})
