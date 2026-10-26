import numpy as np

class JointRelax:
    def __init__(self,body,base,weights,ease):
        _,indices,self.mapping=np.unique(np.round(base,6),axis=0,return_index=True,return_inverse=True)
        self.indices=indices;points=base[indices];w=np.array(weights)[indices]
        distance=np.minimum(np.linalg.norm(points-[.36,0,-.20],axis=1),np.linalg.norm(points-[-.36,0,-.20],axis=1))
        mask=ease(w/.15)*ease((.27-distance)/.10)
        self.active=np.flatnonzero(mask>1e-5);self.weight=mask[self.active,None]*.65
        edges=set()
        for edge in body.data.edges:
            a,b=self.mapping[list(edge.vertices)]
            if a!=b:edges.add((min(a,b),max(a,b)))
        neighbors=[[] for _ in points]
        for a,b in edges:neighbors[a].append(b);neighbors[b].append(a)
        self.rows=[];self.columns=[]
        for row,i in enumerate(self.active):
            for j in neighbors[i]:self.rows.append(row);self.columns.append(j)
        self.rows=np.array(self.rows);self.columns=np.array(self.columns)
        self.degree=np.maximum(np.bincount(self.rows,minlength=len(self.active)),1)[:,None]
    def solve(self,coords,amount):
        if amount<1e-7:return coords
        p=coords[self.indices].copy()
        for _ in range(250):
            total=np.zeros((len(self.active),3));np.add.at(total,self.rows,p[self.columns])
            p[self.active]+=self.weight*(total/self.degree-p[self.active])
        return coords+(p[self.mapping]-coords)*amount
