import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];mesh=body.data;mesh.calc_loop_triangles()
deform_ids={body.vertex_groups[b.name].index for b in rig.data.bones}
rest=np.array([v.co[:] for v in mesh.vertices]);mixed={v.index for v in mesh.vertices if sum(g.weight>1e-6 and g.group in deform_ids for g in v.groups)>1}
all_triangles=[t.vertices[:] for t in mesh.loop_triangles]
tri=np.array([t.vertices[:] for t in mesh.loop_triangles if mesh.polygons[t.polygon_index].material_index==0 and any(i in mixed for i in t.vertices)])
normal=np.cross(rest[tri[:,1]]-rest[tri[:,0]],rest[tri[:,2]]-rest[tri[:,0]]);area=np.linalg.norm(normal,axis=1);valid=area>2e-7;tri=tri[valid];normal=normal[valid];area=area[valid]
weights={name:np.zeros(len(rest)) for name in ['Body','Arm.L','Arm.R','Head']}
for v in mesh.vertices:
    for g in v.groups:
        name=body.vertex_groups[g.group].name
        if name in weights:weights[name][v.index]=g.weight
average={name:w[tri].mean(axis=1) for name,w in weights.items()};report=[]
for frame in [1+k*.5 for k in range(271)]:
    scene.frame_set(int(frame),subframe=frame-int(frame));ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();coords=np.array([v.co[:] for v in m.vertices]);ev.to_mesh_clear()
    cross=np.cross(coords[tri[:,1]]-coords[tri[:,0]],coords[tri[:,2]]-coords[tri[:,0]]);expected=np.zeros_like(normal)
    for name,w in average.items():
        matrix=rig.pose.bones[name].matrix@rig.data.bones[name].matrix_local.inverted();rotation=np.array(matrix.to_3x3());expected+=(normal@rotation.T)*w[:,None]
    inverted=np.flatnonzero(np.sum(cross*expected,axis=1)<0);tree=BVHTree.FromPolygons([Vector(p) for p in coords],all_triangles) if len(inverted) else None;visible={name:0 for name in ['front','left','right','rear']}
    for i in inverted:
        target=Vector(coords[tri[i]].mean(axis=0))
        for name,origin in [('front',(0,-6,0)),('left',(-6,-.1,0)),('right',(6,-.1,0)),('rear',(0,6,0))]:
            start=Vector(origin);hit,_,_,_=tree.ray_cast(start,(target-start).normalized())
            if hit is not None and (hit-target).length<1e-4:visible[name]+=1
    report.append(dict(frame=frame,invertedCandidateTriangles=len(inverted),visibleInvertedTriangles=visible,minAreaRatio=float(np.min(np.linalg.norm(cross,axis=1)/area))))
result=dict(externalConnectionTriangles=len(tri),samples=report);(P/'connection-check.json').write_text(json.dumps(result,indent=2));print(result)
