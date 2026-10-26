"""Trim the overlapping torso cap and stitch a single continuous transition."""
import numpy as np
from collections import Counter

def prepare(body,base,meta,plane=-.095):
    old=body.data;n=len(base);vertices=base.tolist();faces=[];materials=[];uv=[]
    start,end=meta['torsoVertexStart'],meta['torsoVertexEnd'];sleeve=meta['originalVertexCount']
    cuts={};interpolations=[];torso=[]
    for f in old.polygons:
        ids=list(f.vertices)
        if any(i>=sleeve for i in ids):continue
        if not all(start<=i<end for i in ids):
            faces.append(ids);materials.append(f.material_index)
            uv.extend(tuple(old.uv_layers.active.data[j].uv) for j in f.loop_indices);continue
        output=[]
        for a,b in zip(ids,ids[1:]+ids[:1]):
            ia=base[a,2]<=plane;ib=base[b,2]<=plane
            if ia:output.append(a)
            if ia!=ib:
                key=tuple(sorted((a,b)));t=(plane-base[a,2])/(base[b,2]-base[a,2])
                if key not in cuts:
                    cuts[key]=len(vertices);vertices.append((base[a]*(1-t)+base[b]*t).tolist())
                    interpolations.append((cuts[key],a,b,t))
                output.append(cuts[key])
        if len(set(output))<3:continue
        faces.append(output);torso.append(output);materials.append(2);uv.extend([(.5,.5)]*len(output))
    counts=Counter(tuple(sorted((a,b))) for f in torso for a,b in zip(f,f[1:]+f[:1]))
    boundary=[(a,b) for f in torso for a,b in zip(f,f[1:]+f[:1]) if counts[tuple(sorted((a,b)))]==1]
    following=dict(boundary);seed=boundary[0][0];lower=[seed];cursor=following[seed]
    while cursor!=seed:
        assert cursor not in lower
        lower.append(cursor);cursor=following[cursor]
    assert len(lower)==len(boundary),(len(lower),len(boundary))
    head_edges=meta['seamEdges'];head_follow=dict(head_edges);seed=head_edges[0][0];upper=[seed];cursor=head_follow[seed]
    while cursor!=seed:upper.append(cursor);cursor=head_follow[cursor]
    # The head traversal and torso traversal run in opposite directions.
    # Build downward rings in the head boundary order.
    lower_points=np.array(vertices)[lower];angles=np.unwrap(np.arctan2(lower_points[:,1],lower_points[:,0]))
    order=np.argsort(np.mod(angles,2*np.pi));lower_sorted=np.array(lower)[order]
    lower_angle=np.mod(angles[order],2*np.pi)
    target_angle=np.mod(np.arctan2(base[upper,1],base[upper,0]),2*np.pi)
    samples=[]
    for theta in target_angle:
        j=np.searchsorted(lower_angle,theta)%len(lower_sorted);k=(j-1)%len(lower_sorted)
        a=lower_angle[k];b=lower_angle[j]
        if b<a:b+=2*np.pi
        if theta<a:theta+=2*np.pi
        t=(theta-a)/max(b-a,1e-9);samples.append((int(lower_sorted[k]),int(lower_sorted[j]),float(t)))
    ring_ids=[];previous=upper
    for t in [.2,.4,.6,.8]:
        ring=[]
        for h,(a,b,w) in zip(upper,samples):
            ring.append(len(vertices));vertices.append((base[h]*(1-t)+(np.array(vertices[a])*(1-w)+np.array(vertices[b])*w)*t).tolist())
        for j,a in enumerate(upper):
            k=(j+1)%len(upper);faces.append([previous[k],previous[j],ring[j],ring[k]]);materials.append(2);uv.extend([(.5,.5)]*4)
        ring_ids.append(ring);previous=ring
    # Bridge equal-angle samples to the actual torso cut edges by a zipper.
    # Sort both rings counterclockwise and merge their angle events.
    def ordered(loop):
        loop=np.array(loop);xy=np.array(vertices)[loop,:2]
        area=np.sum(xy[:,0]*np.roll(xy[:,1],-1)-xy[:,1]*np.roll(xy[:,0],-1))
        if area<0:loop=loop[::-1];xy=xy[::-1]
        angle=np.arctan2(xy[:,1],xy[:,0]);first=np.argmin(np.abs(angle))
        loop=np.roll(loop,-first);xy=np.roll(xy,-first,axis=0)
        lengths=np.linalg.norm(np.roll(xy,-1,axis=0)-xy,axis=1)
        parameter=np.r_[0,np.cumsum(lengths[:-1])]/lengths.sum()
        return loop,parameter
    top,ta=ordered(previous);bottom,ba=ordered(lower);i=j=0
    while i<len(top) or j<len(bottom):
        a=top[i%len(top)];b=bottom[j%len(bottom)]
        next_t=ta[(i+1)%len(top)]+(1 if i+1>=len(top) else 0)
        next_b=ba[(j+1)%len(bottom)]+(1 if j+1>=len(bottom) else 0)
        if i>=len(top):next_t=float('inf')
        if j>=len(bottom):next_b=float('inf')
        if next_t<next_b:face=[a,top[(i+1)%len(top)],b];i+=1
        else:face=[a,bottom[(j+1)%len(bottom)],b];j+=1
        faces.append(face[::-1]);materials.append(2);uv.extend([(.5,.5)]*3)
    return np.array(vertices),faces,materials,uv,{'upper':upper,'samples':samples,'rings':ring_ids,
        'cuts':interpolations,'lower':lower,'originalCount':n,'plane':plane}

def pose(coords,base,layout):
    result=base.copy();result[:len(coords)]=coords
    for i,a,b,t in layout['cuts']:result[i]=result[a]*(1-t)+result[b]*t
    for t,ring in zip([.2,.4,.6,.8],layout['rings']):
        lower=np.array([result[a]*(1-w)+result[b]*w for a,b,w in layout['samples']])
        result[ring]=coords[layout['upper']]*(1-t)+lower*t
    return result.astype(np.float32)
