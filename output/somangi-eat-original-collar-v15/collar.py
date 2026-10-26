"""Restore original upper-torso section dimensions with a continuous surface."""
import json,numpy as np
from pathlib import Path
from motion_utils import ease

def restore(base,start,rest,faces):
    reference=json.loads((Path(__file__).resolve().parent.parent/'somangi-eat-belly-contour-v13/validation.json').read_text())['torso']
    levels=np.array(reference['referenceZ']);profile=np.array(reference['referenceProfile'])
    result=base.copy()
    for i in range(start,len(base)):
        x,y,z=base[i]
        if z<=-.26:continue
        weight=float(ease((z+.26)/.12));target_z=z
        if z>-.06:
            lo,hi=-.06,.02
            for _ in range(22):
                mid=(lo+hi)*.5;lifted=mid+.035*max(0,min(1,(mid+.06)/.07))**2
                if lifted<z:lo=mid
                else:hi=mid
            target_z=min((lo+hi)*.5,.010)
        cx,cy,rx,ry=[np.interp(target_z,levels,profile[:,j]) for j in range(4)]
        r=(abs((x-cx)/rx)**2+abs((y-cy)/ry)**2)**.5
        if r<.01:continue
        target=np.array([cx+(x-cx)/r,cy+(y-cy)/r,z])
        result[i]=base[i]*(1-weight)+target*weight
    return result-base

