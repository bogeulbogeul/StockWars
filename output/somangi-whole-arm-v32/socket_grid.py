import numpy as np

def fill_socket(bm,edges,layer,group,material):
    adjacency={}
    for edge in edges:
        a,b=edge.verts;adjacency.setdefault(a,[]).append(b);adjacency.setdefault(b,[]).append(a)
    pending=set(adjacency)
    while pending:
        seed=next(iter(pending));loop=[];previous=None;current=seed
        while current in pending:
            loop.append(current);pending.remove(current)
            options=[v for v in adjacency[current] if v!=previous]
            if not options:break
            following=next((v for v in options if v in pending),seed)
            previous,current=current,following
        if len(loop)<4:continue
        p=np.array([v.co[:] for v in loop]);sign=1 if p[:,0].mean()>0 else -1
        levels=sorted(set(p[:,2].tolist()+np.linspace(p[:,2].min(),p[:,2].max(),50).tolist()))
        rings=[]
        for z in levels:
            hits=[]
            for a,b in zip(p,np.roll(p,-1,axis=0)):
                if abs(a[2]-z)<1e-8:hits.append(a)
                if min(a[2],b[2])<z<max(a[2],b[2]):hits.append(a+(b-a)*(z-a[2])/(b[2]-a[2]))
            if not hits:continue
            left=min(hits,key=lambda v:v[1]);right=max(hits,key=lambda v:v[1]);ring=[]
            height=(z-p[:,2].min())/max(1e-6,np.ptp(p[:,2]))
            for u in np.linspace(0,1,17):
                point=left*(1-u)+right*u
                point[0]+=sign*.025*np.sin(np.pi*u)*np.sin(np.pi*height)
                v=bm.verts.new(point);v[layer][group]=1;ring.append(v)
            rings.append(ring)
        for a,b in zip(rings,rings[1:]):
            for j in range(16):
                vertices=[a[j],a[j+1],b[j+1],b[j]]
                if sign<0:vertices.reverse()
                face=bm.faces.new(vertices);face.material_index=material;face.smooth=True
