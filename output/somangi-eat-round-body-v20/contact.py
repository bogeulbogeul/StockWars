import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def head_tree(coords,faces):
    return BVHTree.FromPolygons([Vector(p) for p in coords],faces,all_triangles=True)

def prop_samples(root):
    result=[]
    for ob in root.children:
        if ob.type!='MESH':continue
        matrix=root.matrix_world.inverted()@ob.matrix_world
        vertices=[matrix@v.co for v in ob.data.vertices]
        result.extend(vertices)
        for face in ob.data.polygons:
            ids=list(face.vertices)
            result.append(sum((vertices[i] for i in ids),Vector())/len(ids))
            result.extend((vertices[a]+vertices[b])*.5 for a,b in zip(ids,ids[1:]+ids[:1]))
    return np.array(result)

def safe_shift(tree,world_samples,clearance=.012):
    shift=0
    for x,y,z in world_samples:
        hit,_,_,_=tree.ray_cast(Vector((x,-2,z)),Vector((0,1,0)),4)
        if hit is not None:shift=max(shift,y-hit.y+clearance)
    return shift

def transform(samples,matrix):
    m=np.array(matrix);return samples@m[:3,:3].T+m[:3,3]
