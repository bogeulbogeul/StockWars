import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree
from motion_utils import ease

def preservation_mask(body,base):
    arm_groups={body.vertex_groups['Part.Arm.'+s].index for s in ['L','R']}
    head_group=body.vertex_groups['Part.Head'].index
    eligible=np.array([not any(g.group in arm_groups or g.group==head_group for g in v.groups)
                       for v in body.data.vertices])
    normals=np.array([tuple(v.normal) for v in body.data.vertices])
    radius=np.linalg.norm(base[:,:2],axis=1)
    radial=np.sum(normals[:,:2]*base[:,:2],axis=1)/np.maximum(radius,.001)
    # Do not restore the folded underside of the shoulder while arms are raised.
    outward=ease((radial+.05)/.45)
    lower=ease((-base[:,2]-.39)/.10)
    mask=ease((-base[:,2]-.22)/.16)*np.maximum(outward,lower)*eligible
    shared={}
    for i,p in enumerate(base):shared.setdefault(tuple(np.round(p,6)),[]).append(i)
    borders=[indices[0] for indices in shared.values()
             if len(indices)>1 and any(eligible[indices]) and not all(eligible[indices])]
    tree=KDTree(len(borders))
    for j,i in enumerate(borders):tree.insert(Vector(base[i]),j)
    tree.balance()
    for i in np.flatnonzero(mask):
        distance=tree.find(Vector(base[i]))[2]
        mask[i]*=0 if distance<1e-5 else ease(distance/.06)
    folds=np.flatnonzero(eligible & (radial<-.05) & (np.abs(base[:,0])>.19)
                         & (base[:,2]>-.46) & (base[:,2]<-.15))
    fold_tree=KDTree(len(folds))
    for j,i in enumerate(folds):fold_tree.insert(Vector(base[i]),j)
    fold_tree.balance()
    for i in np.flatnonzero(mask):
        distance=fold_tree.find(Vector(base[i]))[2]
        mask[i]*=ease(max(0,distance-.02)/.08)
    for indices in shared.values():
        if len(indices)>1:mask[indices]=min(mask[indices])
    return mask
