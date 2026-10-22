import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree
from motion_utils import ease

def prepare(body,base):
    arm_groups={body.vertex_groups['Part.Arm.'+s].index for s in ['L','R']}
    arms=np.array([any(g.group in arm_groups for g in v.groups) for v in body.data.vertices])
    mask=ease((-base[:,2]-.16)/.12)*(~arms)
    shared={}
    for i,p in enumerate(base):shared.setdefault(tuple(np.round(p,6)),[]).append(i)
    joint=[]
    for ids in shared.values():
        arm=[i for i in ids if arms[i]];root=[i for i in ids if not arms[i]]
        if arm and root:joint.append((arm[0],root[0]))
    tree=KDTree(len(joint))
    for j,(i,_) in enumerate(joint):tree.insert(Vector(base[i]),j)
    tree.balance();near=[]
    for i in np.flatnonzero(arms):
        _,j,d=tree.find(Vector(base[i]));near.append((i,j,1-ease(d/.17)))
    return mask,joint,near

def restore(coords,base,prepared):
    mask,joint,near=prepared
    result=coords+(base-coords)*mask[:,None]
    delta=[result[j]-coords[i] for i,j in joint]
    for i,j,w in near:result[i]+=delta[j]*w
    return result
