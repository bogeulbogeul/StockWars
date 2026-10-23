import numpy as np
from mathutils import Vector
from motion_utils import ease

def remaining(t):
    if t>=1.9:return 0.
    bites=sum(float(ease((t-start)/duration)) for start,duration in [(1.07,.1),(1.47,.1),(1.77,.13)])
    return float(np.clip(1-bites/3,0,1))

def grip_remaining(t,original_ratio):
    size=max(remaining(t),1/3)
    if t>1.9:size=(1/3)*(1-ease((t-1.9)/.4))+original_ratio*ease((t-1.9)/.4)
    return float(size)

def move_arm(coords,ids,anchor_id,palm_ids,target):
    pivot=coords[anchor_id];source=coords[palm_ids].mean(0)
    q=Vector(source-pivot).rotation_difference(Vector(target-pivot));matrix=np.array(q.to_matrix())
    achieved=pivot+matrix@(source-pivot);translation=target-achieved
    coords[ids]=(coords[ids]-pivot)@matrix.T+pivot+translation
    return coords[anchor_id].copy()
