import bpy,numpy as np,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform
from fuse_torso import fuse

def rebuild(body,base):
    old=body.data;group=body.vertex_groups['Part.Root'].index
    root={v.index for v in old.vertices if any(g.group==group for g in v.groups)}
    root_faces=[f for f in old.polygons if all(v in root for v in f.vertices)]
    triangles=np.array([list(f.vertices) for f in root_faces]);xyz=base[triangles]
    bounds=base[list(root)][:,2];levels=np.linspace(bounds.min()+.00001,bounds.max()-.00001,100)
    profile=[]
    for z in levels:
        hits=[]
        for a,b in [(0,1),(1,2),(2,0)]:
            u=xyz[:,a];v=xyz[:,b];cross=(u[:,2]-z)*(v[:,2]-z)<0
            t=(z-u[cross,2])/(v[cross,2]-u[cross,2])
            hits.extend(u[cross,:2]+t[:,None]*(v[cross,:2]-u[cross,:2]))
        hits=np.array(hits);lo=hits.min(0);hi=hits.max(0)
        center=(lo+hi)*.5;radius=(hi-lo)*.5
        normalized=np.abs((hits-center)/np.maximum(radius,.00001))
        options=np.linspace(1.8,2.6,17)
        errors=[np.median(np.abs((normalized**p).sum(1)-1)) for p in options]
        profile.append([*center,*radius,options[np.argmin(errors)]])
    profile=np.array(profile);reference=profile.copy()
    for _ in range(3):profile[1:-1]=.25*profile[:-2]+.5*profile[1:-1]+.25*profile[2:]
    profile[:,4]=2.2
    middle=(levels>-.55)&(levels<-.025)
    for c in range(4):
        fit=np.polynomial.Polynomial.fit(levels[middle],reference[middle,c],5)
        profile[middle,c]=fit(levels[middle])
    verts=[tuple(v.co) for v in old.vertices];faces=[];uv=[];mats=[]
    for f in old.polygons:
        faces.append(list(f.vertices));mats.append(f.material_index)
        uv.extend(tuple(old.uv_layers.active.data[i].uv) for i in f.loop_indices)
    tree=BVHTree.FromPolygons([Vector(p) for p in base],[list(f.vertices) for f in root_faces],all_triangles=True)
    texcoords=[];start=len(verts);segments=96
    for z,(cx,cy,rx,ry,p) in zip(levels,profile):
        for j in range(segments):
            angle=2*math.pi*j/segments;c=math.cos(angle);s=math.sin(angle)
            point=Vector((cx+rx*math.copysign(abs(c)**(2/p),c),
                          cy+ry*math.copysign(abs(s)**(2/p),s),z))
            verts.append(tuple(point));hit,_,face,_=tree.find_nearest(point)
            old_face=root_faces[face];ids=list(old_face.vertices)
            old_uv=[Vector((*old.uv_layers.active.data[i].uv,0)) for i in old_face.loop_indices]
            texcoords.append(tuple(barycentric_transform(hit,*[Vector(base[i]) for i in ids],*old_uv))[:2])
    for ring in range(len(levels)-1):
        for j in range(segments):
            ids=[ring*segments+j,ring*segments+(j+1)%segments,
                 (ring+1)*segments+(j+1)%segments,(ring+1)*segments+j]
            center=np.array([verts[start+i] for i in ids]).mean(0)
            if -.51<center[2]<-.04 and abs(math.cos((j+.5)*2*math.pi/segments))>.58:
                faces.append([start+i for i in ids]);mats.append(len(old.materials));uv.extend(texcoords[i] for i in ids)
    # Closures stay below the head and above the legs.
    for ring,reverse in []:
        ids=list(range(ring*segments,(ring+1)*segments))
        if reverse:ids.reverse()
        faces.append([start+i for i in ids]);mats.append(len(old.materials));uv.extend(texcoords[i] for i in ids)
    patch_faces=[[i-start for i in f] for f in faces if all(i>=start for i in f)]
    leg_groups={body.vertex_groups['Part.Leg.'+s].index for s in ['L','R']}
    lower=root|{v.index for v in old.vertices if any(g.group in leg_groups for g in v.groups)}
    lower_faces=[f for f in old.polygons if all(v in lower for v in f.vertices)]
    fused,fused_faces=fuse(base,lower,lower_faces,verts[start:],patch_faces)
    root=lower
    kept=[(f,m) for f,m in zip(old.polygons,[f.material_index for f in old.polygons]) if not all(v in root for v in f.vertices)]
    verts=[tuple(v.co) for v in old.vertices]+fused.tolist()
    faces=[list(f.vertices) for f,m in kept]+[[start+i for i in f] for f in fused_faces]
    mats=[m for f,m in kept]+[len(old.materials)]*len(fused_faces)
    uv=[tuple(old.uv_layers.active.data[i].uv) for f,m in kept for i in f.loop_indices]
    uv.extend([(0,0)]*sum(len(f) for f in fused_faces))
    data=bpy.data.meshes.new('Original torso contours continuous surface');data.from_pydata(verts,[],faces);data.update()
    for mat in old.materials:data.materials.append(mat)
    skin=old.materials[0].copy();skin.name='Torso original white without UV seams'
    shader=skin.node_tree.nodes.get('Principled BSDF')
    image=shader.inputs['Base Color'].links[0].from_node.image
    f=next(f for f in root_faces if f.center.y<-.15 and -.5<f.center.z<-.4)
    sample=sum((old.uv_layers.active.data[i].uv for i in f.loop_indices),Vector((0,0)))/len(f.loop_indices)
    w,h=image.size;offset=(min(h-1,int(sample.y*h))*w+min(w-1,int(sample.x*w)))*4
    color=list(image.pixels[offset:offset+3]);linear=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in color]
    for socket in shader.inputs:
        for link in list(socket.links):skin.node_tree.links.remove(link)
    shader.inputs['Base Color'].default_value=(*linear,1)
    shader.inputs['Metallic'].default_value=0;shader.inputs['Roughness'].default_value=1
    shader.inputs['Specular IOR Level'].default_value=0;data.materials.append(skin)
    layer=data.uv_layers.new(name='UVMap')
    for i,v in enumerate(uv):layer.data[i].uv=v
    for f,material in zip(data.polygons,mats):f.material_index=material;f.use_smooth=True
    body.shape_key_clear();body.data=data
    report={'rings':len(levels),'segments':segments,'maximumProfileSmoothingChange':float(np.max(np.abs(profile[:,:4]-reference[:,:4]))),
            'torsoVertexStart':start,'torsoVertexCount':len(verts)-start,
            'referenceZ':levels.tolist(),'referenceProfile':reference.tolist(),'finalProfile':profile.tolist()}
    report['rootIds']=list(root)
    return np.array(verts),report
