import heapq
import bpy,bmesh
from mathutils import Vector

def refine_shoulders(mesh):
    keys={};points=[];mapping=[]
    for v in mesh.data.vertices:
        key=tuple(round(c,5) for c in v.co)
        if key not in keys:keys[key]=len(points);points.append(v.co.copy())
        mapping.append(keys[key])
    adj=[{} for _ in points]
    for edge in mesh.data.edges:
        a,b=[mapping[i] for i in edge.vertices]
        if a==b:continue
        length=(points[a]-points[b]).length
        adj[a][b]=length;adj[b][a]=length
    def distances(seeds):
        result=[float('inf')]*len(points);queue=[]
        for i in seeds:result[i]=0;queue.append((0,i))
        heapq.heapify(queue)
        while queue:
            dist,i=heapq.heappop(queue)
            if dist!=result[i]:continue
            for j,length in adj[i].items():
                new=dist+length
                if new<result[j]:result[j]=new;heapq.heappush(queue,(new,j))
        return result
    arm=distances([i for i,p in enumerate(points) if abs(p.x)>.49 and -.43<p.z<-.12])
    body=distances([i for i,p in enumerate(points) if abs(p.x)<.24 or p.z>.015 or p.z<-.49])
    names={g.index:g.name for g in mesh.vertex_groups};groups={g.name:g for g in mesh.vertex_groups}
    def smooth(a,b,x):
        t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
    for v in mesh.data.vertices:
        if not -.49<v.co.z<.015:continue
        k=mapping[v.index]
        if not arm[k]<float('inf') or not body[k]<float('inf'):continue
        w=smooth(-.045,.065,body[k]-arm[k])
        old={names[g.group]:g.weight for g in v.groups};head=old.get('Head',0)
        weights={'Head':head,'Arm.'+('L' if v.co.x>0 else 'R'):(1-head)*w,'Body':(1-head)*(1-w)}
        for group in mesh.vertex_groups:group.remove([v.index])
        for name,value in weights.items():
            if value>1e-8:groups[name].add([v.index],value,'REPLACE')

def separate_rigid_arms(mesh,rig):
    original=mesh.data
    uv=original.uv_layers.active
    white_uv=next((sum((uv.data[j].uv for j in p.loop_indices),Vector((0,0)))/len(p.loop_indices) for p in original.polygons if -.4<p.center.z<-.2),Vector((.5,.5)))
    weights=[{mesh.vertex_groups[g.group].name:g.weight for g in v.groups} for v in original.vertices]
    faces={'Body':[],'L':[],'R':[]}
    for poly in original.polygons:
        arm={side:sum(weights[i].get('Arm.'+side,0) for i in poly.vertices)/len(poly.vertices) for side in ['L','R']}
        side=max(arm,key=arm.get)
        faces[side if arm[side]>.55 else 'Body'].append(poly)
    out={};centers={}
    capmat=bpy.data.materials.new('Smooth white shoulder');capmat.use_nodes=True
    shader=capmat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(.82,.82,.82,1);shader.inputs['Roughness'].default_value=1;shader.inputs['Specular IOR Level'].default_value=0
    for side,polys in faces.items():
        ids=sorted({i for p in polys for i in p.vertices});remap={i:j for j,i in enumerate(ids)}
        data=bpy.data.meshes.new('Rigid_'+side)
        data.from_pydata([original.vertices[i].co for i in ids],[],[[remap[i] for i in p.vertices] for p in polys])
        for mat in original.materials:data.materials.append(mat)
        data.materials.append(capmat)
        layer=data.uv_layers.new(name='UVMap')
        for p,source in zip(data.polygons,polys):
            p.material_index=source.material_index
            for a,b in zip(p.loop_indices,source.loop_indices):layer.data[a].uv=uv.data[b].uv
        if side=='Body':
            obj=mesh;obj.data=data;obj.vertex_groups.clear()
            names=set(n for i in ids for n in weights[i] if not n.startswith('Arm.'))|{'Body'}
            groups={n:obj.vertex_groups.new(name=n) for n in names}
            for i in ids:
                w=dict(weights[i]);w['Body']=w.get('Body',0)+w.pop('Arm.L',0)+w.pop('Arm.R',0)
                for n,val in w.items():
                    if val>1e-8:groups[n].add([remap[i]],val,'REPLACE')
        else:
            obj=bpy.data.objects.new('Rigid_Arm.'+side,data);bpy.context.collection.objects.link(obj);obj.parent=rig
            group=obj.vertex_groups.new(name='Arm.'+side);group.add(list(range(len(ids))),1,'REPLACE')
            mod=obj.modifiers.new('Rigid arm rotation','ARMATURE');mod.object=rig
        bm=bmesh.new();bm.from_mesh(data)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00002)
        boundary=[e for e in bm.edges if e.is_boundary]
        if side!='Body':
            verts={v for e in boundary for v in e.verts}
            centers[side]=sum((v.co for v in verts),Vector())/len(verts)
        if boundary:
            boundary_verts=list({v for e in boundary for v in e.verts})
            for _ in range(8):bmesh.ops.smooth_vert(bm,verts=boundary_verts,factor=.35,use_axis_x=True,use_axis_y=True,use_axis_z=True)
            result=bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
            uv_layer=bm.loops.layers.uv.active
            for face in result['faces']:
                face.material_index=0
                if uv_layer:
                    for loop in face.loops:loop[uv_layer].uv=white_uv
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
        for p in data.polygons:p.use_smooth=True
        out[side]=obj
    # Eating-only smooth torso shell, keeping the original textured head and feet.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=32)
    torso=bpy.context.object;torso.name='Eating_Torso';torso.parent=rig
    for v in torso.data.vertices:
        t=(v.co.z+1)/2
        v.co.x*=.46*(1-.20*t);v.co.y*=.35*(1-.20*t);v.co.z=v.co.z*.44-.32
    torso.data.materials.append(capmat)
    for p in torso.data.polygons:p.use_smooth=True
    group=torso.vertex_groups.new(name='Body');group.add(list(range(len(torso.data.vertices))),1,'REPLACE')
    mod=torso.modifiers.new('Stable torso','ARMATURE');mod.object=rig
    out['Torso']=torso
    for side in ['L','R']:
        obj=out[side];bm=bmesh.new();bm.from_mesh(obj.data)
        bmesh.ops.delete(bm,geom=list(bm.faces),context='FACES_ONLY')
        bmesh.ops.convex_hull(bm,input=list(bm.verts),use_existing_faces=False)
        unused=[v for v in bm.verts if not v.link_faces]
        if unused:bmesh.ops.delete(bm,geom=unused,context='VERTS')
        bm.to_mesh(obj.data);bm.free()
        obj.data.materials.clear();obj.data.materials.append(capmat)
        for p in obj.data.polygons:p.use_smooth=True;p.material_index=0
    for obj,levels in [(out['L'],1),(out['R'],1)]:
        bpy.context.view_layer.objects.active=obj
        sub=obj.modifiers.new('Round repaired surface','SUBSURF');sub.levels=levels;sub.render_levels=levels
        bpy.ops.object.modifier_apply(modifier=sub.name)
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
    return out
