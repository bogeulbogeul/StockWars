import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from motion_utils import ease

def restore_back(base,start,end,rest,faces,current_faces):
    tree=BVHTree.FromPolygons([Vector(p) for p in rest],faces)
    delta=np.zeros_like(base);allowed=np.zeros(end-start,dtype=bool)
    for i in range(start,end):
        x,y,z=base[i];radius=np.hypot(x,y)
        if radius<1e-6 or y/radius<=-.25 or not -.65<z<-.07:continue
        weight=float(ease((y/radius+.25)/.20)*ease((z+.65)/.06)*(1-ease((z+.12)/.05)))
        if weight<1e-6:continue
        allowed[i-start]=True
        direction=Vector((x/radius,y/radius,0));hit=tree.ray_cast(Vector((0,0,z)),direction,1)[0]
        if hit is not None:delta[i]=(np.array(hit)-base[i])*weight
    edges={tuple(sorted((a-start,b-start))) for f in current_faces if all(start<=i<end for i in f)
        for a,b in zip(f,f[1:]+f[:1])}
    directed=np.array([(a,b) for a,b in edges]+[(b,a) for a,b in edges]);a,b=directed.T
    degree=np.maximum(np.bincount(a,minlength=end-start),1)[:,None];local=delta[start:end].copy()
    for _ in range(90):
        average=np.stack([np.bincount(a,weights=local[b,j],minlength=len(local)) for j in range(3)],axis=1)/degree
        local[allowed]=local[allowed]*.5+average[allowed]*.5
    delta[start:end]=local
    return delta

class Shoulder:
    def __init__(self,body,base,rest,arm_ids,torso_end,arm_end):
        allowed=set(arm_ids)|set(range(torso_end,arm_end))
        faces=[list(f.vertices) for f in body.data.polygons if all(i in allowed for i in f.vertices)]
        self.ids=np.array(sorted({i for f in faces for i in f}));lookup={i:j for j,i in enumerate(self.ids)}
        edges={tuple(sorted((lookup[a],lookup[b]))) for f in faces for a,b in zip(f,f[1:]+f[:1])}
        directed=np.array([(a,b) for a,b in edges]+[(b,a) for a,b in edges]);self.a,self.b=directed.T
        self.degree=np.maximum(np.bincount(self.a,minlength=len(self.ids)),1)[:,None]
        self.triangles=np.array([[lookup[f[0]],lookup[f[j]],lookup[f[j+1]]] for f in faces for j in range(1,len(f)-1)])
        self.mask=np.zeros(len(self.ids))
        for j,i in enumerate(self.ids):
            if i>=len(rest):continue
            sign=1 if rest[i,0]>0 else -1;direction=np.array([sign*.195,0,-.33]);direction/=np.linalg.norm(direction)
            t=(rest[i]-np.array([sign*.285,0,-.11]))@direction
            self.mask[j]=float(ease((t-.155)/.045)*(1-ease((t-.33)/.07)))

    def average(self,p):
        return np.stack([np.bincount(self.a,weights=p[self.b,j],minlength=len(p)) for j in range(3)],axis=1)/self.degree

    def volume(self,p):
        a,b,c=p[self.triangles[:,0]],p[self.triangles[:,1]],p[self.triangles[:,2]]
        return abs(float(np.sum(a*np.cross(b,c))/6))

    def solve(self,coords):
        original=coords[self.ids].copy();p=original.copy();mask=self.mask[:,None]
        for _ in range(90):p+=.5*mask*(self.average(p)-p)
        triangle=p[self.triangles];normal=np.cross(triangle[:,1]-triangle[:,0],triangle[:,2]-triangle[:,0])
        normals=np.stack([np.bincount(self.triangles.ravel(),weights=np.repeat(normal[:,j],3),minlength=len(p)) for j in range(3)],axis=1)
        normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-9);direction=normals*mask
        target=self.volume(original);lo,hi=0,.04
        for _ in range(24):
            mid=(lo+hi)*.5
            if self.volume(p+direction*mid)<target:lo=mid
            else:hi=mid
        p+=direction*((lo+hi)*.5)
        coords[self.ids]=p
        return float(np.linalg.norm(p-original,axis=1).max())
