import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];scene=bpy.context.scene;mesh=body.data
meta=json.loads((P.parent/'somangi-whole-root-base-v35/metadata.json').read_text());connections=json.loads((P.parent/'somangi-soft-connections-v36/connections.json').read_text())
armids={name:set(connections[name]['ids'])|{v.index for v in mesh.vertices if any(g.group==body.vertex_groups[name].index and g.weight>1e-6 for g in v.groups)} for name in ['Arm.L','Arm.R']}
mesh.calc_loop_triangles();rest=np.array([v.co[:] for v in mesh.vertices]);tri=np.array([t.vertices[:] for t in mesh.loop_triangles if mesh.polygons[t.polygon_index].material_index==0 and any(-.35<rest[i,2]<.04 for i in t.vertices)])
normal=np.cross(rest[tri[:,1]]-rest[tri[:,0]],rest[tri[:,2]]-rest[tri[:,0]]);valid=np.linalg.norm(normal,axis=1)>2e-7;tri=tri[valid];normal=normal[valid]
results=[]
for start,end in [(.01,.18),(0,.20),(-.03,.22),(-.06,.24),(-.08,.27),(-.1,.30),(.03,.25),(0,.3)]:
    for name,key in [('Arm.L','1'),('Arm.R','2')]:
        anchor=Vector(meta['centers'][key]);axis=(Vector(meta['palms'][key])-anchor).normalized()
        for i in armids[name]:
            t=np.clip(((mesh.vertices[i].co-anchor).dot(axis)-start)/(end-start),0,1);w=float(t*t*t*(10-15*t+6*t*t))
            for group_name in ['Body','Head',name]:body.vertex_groups[group_name].remove([i])
            if w>1e-6:body.vertex_groups[name].add([i],w,'REPLACE')
            if w<1-1e-6:body.vertex_groups['Head'].add([i],1-w,'REPLACE')
    weights={name:np.zeros(len(rest)) for name in ['Body','Arm.L','Arm.R','Head']}
    for v in mesh.vertices:
        for g in v.groups:weights[body.vertex_groups[g.group].name][v.index]=g.weight
    avg={name:w[tri].mean(axis=1) for name,w in weights.items()};counts=[]
    for frame in [1,46,50,68,82,112]:
        scene.frame_set(frame);ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();co=np.array([v.co[:] for v in m.vertices]);ev.to_mesh_clear();cross=np.cross(co[tri[:,1]]-co[tri[:,0]],co[tri[:,2]]-co[tri[:,0]]);expected=np.zeros_like(normal)
        for name,w in avg.items():expected+=(normal@np.array((rig.pose.bones[name].matrix@rig.data.bones[name].matrix_local.inverted()).to_3x3()).T)*w[:,None]
        counts.append(int(np.sum(np.sum(cross*expected,axis=1)<0)))
    results.append(dict(start=start,end=end,counts=counts));print(results[-1])
(P/'weight-tuning.json').write_text(json.dumps(results,indent=2))
