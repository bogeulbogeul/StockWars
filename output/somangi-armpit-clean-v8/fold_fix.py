import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def hide_fold(body,base):
    group=body.vertex_groups['Part.Root'].index
    ids={v.index for v in body.data.vertices if any(g.group==group for g in v.groups)}
    faces=[list(f.vertices) for f in body.data.polygons if all(i in ids for i in f.vertices)]
    tree=BVHTree.FromPolygons([Vector(v) for v in base],faces,all_triangles=True)
    result=base.copy();changed=[]
    for i in ids:
        x,y,z=base[i]
        if abs(x)<.18 or abs(y)>.16 or not -.46<z<-.12:continue
        sign=1 if x>0 else -1
        hit,n,_,_=tree.ray_cast(Vector((0,y,z)),Vector((sign,0,0)))
        if hit is not None and abs(x)>abs(hit.x)+.003:
            result[i,0]=hit.x-sign*.002;changed.append(i)
    return result,changed
