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
        normals=bm.loops.layers.float_vector.get('OriginalOuterNormal')
        ns=np.array([np.mean([l[normals][:] for l in v.link_loops],axis=0) for v in loop])
        levels=sorted(set(p[:,2].tolist()+np.linspace(p[:,2].min(),p[:,2].max(),50).tolist()))
        rings=[]
        for z in levels:
            hits=[]
            for i,(a,b) in enumerate(zip(p,np.roll(p,-1,axis=0))):
                na,nb=ns[i],ns[(i+1)%len(ns)]
                if abs(a[2]-z)<1e-8:hits.append((a,na))
                if min(a[2],b[2])<z<max(a[2],b[2]):
                    t=(z-a[2])/(b[2]-a[2]);hits.append((a+(b-a)*t,na+(nb-na)*t))
            if not hits:continue
            (left,nl)=min(hits,key=lambda v:v[0][1]);(right,nr)=max(hits,key=lambda v:v[0][1]);ring=[]
            height=(z-p[:,2].min())/max(1e-6,np.ptp(p[:,2]))
            for u in np.linspace(0,1,17):
                point=left*(1-u)+right*u
                span=right[1]-left[1]
                slope=lambda n:np.clip(-n[1]/n[0],-3,3) if abs(n[0])>.1 else 0
                x=(2*u**3-3*u**2+1)*left[0]+(u**3-2*u**2+u)*slope(nl)*span+(-2*u**3+3*u**2)*right[0]+(u**3-u**2)*slope(nr)*span
                point[0]+=np.clip(x-point[0],-.065,.065)
                v=bm.verts.new(point);v[layer][group]=1;ring.append(v)
            rings.append(ring)
        for a,b in zip(rings,rings[1:]):
            for j in range(16):
                vertices=[a[j],a[j+1],b[j+1],b[j]]
                if sign<0:vertices.reverse()
                face=bm.faces.new(vertices);face.material_index=material;face.smooth=True
