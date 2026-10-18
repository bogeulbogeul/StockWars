import bpy,json,math,struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-bench-sit.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];mesh=bpy.data.objects['Somangi_Body'];bench=bpy.data.objects['Bench']
info=json.loads((P/'seat.json').read_text())
verts=[bench.matrix_world@v.co for v in bench.data.vertices]
bvh=BVHTree.FromPolygons(verts,[list(p.vertices) for p in bench.data.polygons])
lo=Vector([min(v[i] for v in verts) for i in range(3)]);hi=Vector([max(v[i] for v in verts) for i in range(3)])
edges=[(a,b,(mesh.data.vertices[a].co-mesh.data.vertices[b].co).length) for e in mesh.data.edges for a,b in [e.vertices] if mesh.data.vertices[a].co.z<-.73 and mesh.data.vertices[b].co.z<-.73]
core=[v.index for v in mesh.data.vertices if -.63<v.co.z<-.20 and abs(v.co.x)<.27]
ends={};edge_error=0;body_error=0;penetration=0;idle_gap=0
for f in range(1,74):
    s.frame_set(f);obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh()
    assert all(math.isfinite(c) for v in temp.vertices for c in v.co)
    for side in ['L','R']:
        assert rig.pose.bones['Leg.'+side].location.length<1e-7
    for a,b,length in edges:edge_error=max(edge_error,abs((temp.vertices[a].co-temp.vertices[b].co).length-length))
    transform=rig.pose.bones['Body'].matrix@rig.data.bones['Body'].matrix_local.inverted()
    body_error=max(body_error,max((temp.vertices[i].co-transform@mesh.data.vertices[i].co).length for i in core))
    if f in [1,73]:ends[f]=[v.co.copy() for v in temp.vertices]
    if f in [13,19,25,37,49,55,61]:
        for v in temp.vertices:
            co=mesh.matrix_world@v.co
            if not all(lo[i]<co[i]<hi[i] for i in range(3)):continue
            near,normal,_,dist=bvh.find_nearest(co)
            if near is not None and (co-near).dot(normal)<0:penetration=max(penetration,dist)
    if f==25:idle_gap=min(temp.vertices[i].co.z for i in info['butt_vertex_ids'])-info['seat_center'][2]
    obj.to_mesh_clear()
closure=max((a-b).length for a,b in zip(ends[1],ends[73]))
report={'frames_checked':73,'lower_leg_edge_error':edge_error,'body_core_deformation':body_error,
 'sit_contact_gap':idle_gap,'sampled_bench_penetration_depth':penetration,'demo_loop_error':closure}
(P/'validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
assert edge_error<1e-5 and body_error<1e-5 and abs(idle_gap-.001)<.002 and closure<1e-5
assert penetration<.005
s.frame_set(25);cam=s.camera;target=Vector((0,.1,.1));cam.data.ortho_scale=4
s.render.resolution_x=800;s.render.resolution_y=650;s.cycles.samples=12
for name,pos in [('sit-angle',(3,-5,2)),('sit-side',(6,.1,.1))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-bench-scene.glb'))
raw=(P/'somangi-bench-scene.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];gltf=json.loads(raw[20:20+n])
report['roundtrip']={'glb_meshes':len(gltf['meshes']),'imported_mesh_objects':len([o for o in bpy.context.scene.objects if o.type=='MESH']),
 'bones':len(next(o for o in bpy.context.scene.objects if o.type=='ARMATURE').data.bones),
 'actions':[a.name for a in bpy.data.actions]}
(P/'validation.json').write_text(json.dumps(report,indent=2));print('ROUNDTRIP_OK')
assert report['roundtrip']['glb_meshes']==2 and report['roundtrip']['bones']==7
