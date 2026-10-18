import bpy
from mathutils import Matrix

def add_correctives(mesh,rig,scene):
    # Weld UV seam duplicates for smoothing adjacency without altering topology.
    verts=mesh.data.vertices; bins={}; keys=[]
    for v in verts:
        k=tuple(round(c,5) for c in v.co);keys.append(k);bins.setdefault(k,[]).append(v.index)
    ids={k:i for i,k in enumerate(bins)};groups=list(bins.values());neighbors=[set() for _ in groups]
    for e in mesh.data.edges:
        a,b=(ids[keys[i]] for i in e.vertices)
        if a!=b:neighbors[a].add(b);neighbors[b].add(a)
    def fade(x,a,b):
        u=max(0,min(1,(x-a)/(b-a)));return u*u*(3-2*u)
    strengths=[]
    for g in groups:
        co=verts[g[0]].co
        strengths.append(fade(abs(co.x),.20,.27)*(1-fade(abs(co.x),.52,.62))*fade(co.z,-.64,-.50)*(1-fade(co.z,-.03,.07)))
    mesh.shape_key_add(name='Basis')
    for frame in range(1,74,9):
        scene.frame_set(frame);bpy.context.view_layer.update()
        obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh()
        initial=[temp.vertices[g[0]].co.copy() for g in groups];coords=[p.copy() for p in initial];obj.to_mesh_clear()
        for _ in range(240):
            nxt=[]
            for i,p in enumerate(coords):
                ns=neighbors[i];w=strengths[i]*.65
                avg=sum((coords[j] for j in ns),p*0)/len(ns) if ns else p
                nxt.append(p.lerp(avg,w))
            coords=nxt
        matrices={b.name:rig.pose.bones[b.name].matrix@b.matrix_local.inverted() for b in rig.data.bones}
        key=mesh.shape_key_add(name=f'Shoulder_{frame:02}')
        for i,g in enumerate(groups):
            delta=coords[i]-initial[i]
            if strengths[i]<.0001:continue
            for idx in g:
                v=verts[idx];mat=Matrix(((0,0,0,0),)*4)
                for w in v.groups:
                    name=mesh.vertex_groups[w.group].name
                    if name in matrices:mat+=matrices[name]*w.weight
                key.data[idx].co=v.co+mat.to_3x3().inverted_safe()@delta
        for f,value in [(max(1,frame-9),0),(frame,1),(min(73,frame+9),0)]:
            if f==frame and value==0:continue
            key.value=value;key.keyframe_insert('value',frame=f)
        key.value=0
    for action in bpy.data.actions:
        if action.name!='Eat':
            for layer in action.layers:
                for strip in layer.strips:
                    for bag in strip.channelbags:
                        for fc in bag.fcurves:
                            for kp in fc.keyframe_points:kp.interpolation='LINEAR'
    scene.frame_set(34)
