import numpy as np

class Fair:
    def __init__(self,faces,mask):
        self.ids=np.array(sorted({i for f in faces for i in f}));lookup={i:j for j,i in enumerate(self.ids)}
        edges={tuple(sorted((lookup[a],lookup[b]))) for f in faces for a,b in zip(f,f[1:]+f[:1])}
        directed=np.array([(a,b) for a,b in edges]+[(b,a) for a,b in edges]);self.a,self.b=directed.T
        self.degree=np.maximum(np.bincount(self.a,minlength=len(self.ids)),1)[:,None]
        self.tri=np.array([[lookup[f[0]],lookup[f[j]],lookup[f[j+1]]] for f in faces for j in range(1,len(f)-1)])
        self.mask=mask[self.ids,None]

    def average(self,p):
        return np.stack([np.bincount(self.a,weights=p[self.b,j],minlength=len(p)) for j in range(3)],axis=1)/self.degree

    def volume(self,p):
        a,b,c=p[self.tri[:,0]],p[self.tri[:,1]],p[self.tri[:,2]]
        return abs(float(np.sum(a*np.cross(b,c))/6))

    def solve(self,coords,iterations):
        original=coords[self.ids].copy();p=original.copy()
        for _ in range(iterations):p+=.5*self.mask*(self.average(p)-p)
        triangle=p[self.tri];normal=np.cross(triangle[:,1]-triangle[:,0],triangle[:,2]-triangle[:,0])
        normals=np.stack([np.bincount(self.tri.ravel(),weights=np.repeat(normal[:,j],3),minlength=len(p)) for j in range(3)],axis=1)
        normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-9)
        direction=normals*self.mask;target=self.volume(original);lo,hi=0,.04
        for _ in range(24):
            mid=(lo+hi)*.5
            if self.volume(p+direction*mid)<target:lo=mid
            else:hi=mid
        p+=direction*((lo+hi)*.5);coords[self.ids]=p
