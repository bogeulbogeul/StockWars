from collections import Counter,defaultdict
import numpy as np
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt

def closed_parts(body,parts):
    mesh=body.data;coords=[v.co[:] for v in mesh.vertices];faces=[list(p.vertices) for p in mesh.polygons]
    uvs=[tuple(mesh.uv_layers.active.data[i].uv) for p in mesh.polygons for i in p.loop_indices]
    materials=[p.material_index for p in mesh.polygons];normals=[n.vector[:] for n in mesh.corner_normals]
    initial=len(coords);added={s:[] for s in ['L','R']}
    excluded=set(parts['L']+parts['R']);root=np.array([p for i,p in enumerate(coords) if i not in excluded and -.65<p[2]<-.015])
    white=next(p for p in mesh.polygons if -.45<p.center.z<-.35 and abs(p.center.x)<.05 and p.center.y<-.15)
    white_uv=tuple(np.mean([mesh.uv_layers.active.data[i].uv[:] for i in white.loop_indices],axis=0))
    def profile(z):
        row=root[np.abs(root[:,2]-z)<.035]
        if len(row)<20:return .29,.18,0.
        x,y=row[:,0],row[:,1];a,b,c=np.linalg.lstsq(np.column_stack((x*x,y*y,y)),np.ones(len(row)),rcond=None)[0]
        if min(a,b)<1:return .29,.18,0.
        cy=-c/(2*b);k=1+c*c/(4*b)
        return float(np.clip(np.sqrt(k/a),.2,.4)),float(np.clip(np.sqrt(k/b),.12,.3)),float(np.clip(cy,-.1,.1))
    key=lambda i:tuple(round(x,6) for x in coords[i])
    for side,sign in [('L',1),('R',-1)]:
        ids=set(parts[side]);represent={key(i):i for i in ids};counts=Counter()
        for p in faces[:len(mesh.polygons)]:
            if all(i in ids for i in p):
                for a,b in zip(p,p[1:]+p[:1]):counts[tuple(sorted((key(a),key(b))))]+=1
        adjacency=defaultdict(list)
        for (a,b),n in counts.items():
            if n==1:adjacency[a].append(b);adjacency[b].append(a)
        pending=set(adjacency)
        while pending:
            first=next(iter(pending));loop=[first];previous=None;current=first
            while True:
                options=[x for x in adjacency[current] if x!=previous]
                nxt=next((x for x in options if x==first or x in pending),None)
                pending.discard(current)
                if nxt is None or nxt==first:break
                loop.append(nxt);previous,current=current,nxt
            if len(loop)<3:continue
            rim=[represent[k] for k in loop];center=np.mean([coords[i] for i in rim],axis=0)
            print('SEAM',side,len(rim),center.tolist())
            direction=np.array((sign*.8,0,-.6))
            # Both closures stay under the original arm at rest. Original outer vertices are untouched.
            rimkeys=set(loop);corner=0
            for face in faces[:len(mesh.polygons)]:
                for i in face:
                    if i not in ids and key(i) in rimkeys:
                        x,y,z=coords[i];n=np.array((x/.34**2,y/.17**2,(z+.32)/.4**2));n/=np.linalg.norm(n);normals[corner]=n.tolist()
                    corner+=1
            # A constrained planar triangulation avoids folds in a long concave shoulder opening.
            flat=[Vector((coords[i][1],coords[i][2])) for i in rim];n=len(flat)
            ymin,zmin=np.min(np.array(flat),axis=0);ymax,zmax=np.max(np.array(flat),axis=0)
            for y in np.arange(ymin+.012,ymax,.012):
                for z in np.arange(zmin+.012,zmax,.012):flat.append(Vector((y,z)))
            v2,_,tri,orig,_,_=delaunay_2d_cdt(flat,[(j,(j+1)%n) for j in range(n)],[list(range(n))],1,1e-7)
            patch=[];fixed=[]
            for k,p in enumerate(v2):
                source=next((i for i in orig[k] if i<n),None)
                fixed.append(source is not None)
                if source is not None:patch.append(np.array(coords[rim[source]]))
                else:patch.append(np.array((center[0],p.x,p.y)))
            patch=np.array(patch);fixed=np.array(fixed);neighbors=[set() for _ in patch]
            for face in tri:
                for a,b in zip(face,face[1:]+face[:1]):neighbors[a].add(b);neighbors[b].add(a)
            for _ in range(200):
                values=patch[:,0].copy()
                for j,nb in enumerate(neighbors):
                    if not fixed[j] and nb:patch[j,0]=np.mean(values[list(nb)])
            boundary=np.array([coords[i][1:] for i in rim])
            for j,p in enumerate(patch):
                if not fixed[j]:
                    distance=np.min(np.linalg.norm(boundary-p[1:],axis=1))
                    patch[j,0]+=sign*.055*np.sin(min(1,distance/.07)*np.pi/2)
            start=len(coords);coords.extend(patch.tolist())
            for face in tri:
                indices=[start+i for i in face]
                if sign<0:indices.reverse()
                faces.append(indices);uvs.extend([white_uv]*len(indices));materials.append(0)
                for i in indices:
                    x,y,z=coords[i];normal=np.array((x/.34**2,y/.17**2,(z+.32)/.4**2));normal/=np.linalg.norm(normal);normals.append(normal.tolist())
            for arm,offset in [(True,-.045)]:
                direction=np.array((sign*.8,0,-.6)) if arm else np.array((sign,0,0))
                if arm:last=rim
                else:
                    last=[]
                    for i in rim:last.append(len(coords));coords.append(coords[i])
                for scale,depth in [(.65,offset),(.25,offset*1.25),(.0,offset*1.3)]:
                    ring=[]
                    for i in rim:
                        point=center+(np.array(coords[i])-center)*scale+direction*depth
                        if not arm:
                            rx,ry,cy=profile(point[2]);point[0]=sign*rx*np.sqrt(max(.01,1-((point[1]-cy)/ry)**2))
                        ring.append(len(coords));coords.append(point.tolist())
                        if arm:added[side].append(ring[-1])
                    for j in range(len(rim)):
                        k=(j+1)%len(rim);quad=[last[j],last[k],ring[k],ring[j]]
                        if not arm:quad.reverse()
                        faces.append(quad);uvs.extend([white_uv]*4);materials.append(0)
                        for index in quad:
                            if arm:normals.append((0,0,0))
                            else:
                                x,y,z=coords[index];n=np.array((x/.34**2,y/.17**2,(z+.32)/.4**2));n/=np.linalg.norm(n);normals.append(n.tolist())
                    last=ring
    import bpy
    new=bpy.data.meshes.new('Original outer surface with concealed joint closures');new.from_pydata(coords,[],faces);new.update()
    for m in mesh.materials:new.materials.append(m)
    uv=new.uv_layers.new(name='UVMap')
    for i,value in enumerate(uvs):uv.data[i].uv=value
    for p,material in zip(new.polygons,materials):p.material_index=material;p.use_smooth=True
    new.normals_split_custom_set(normals);body.data=new
    return initial,{s:parts[s]+added[s] for s in parts}
