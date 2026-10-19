import bpy,json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-bench-sit-v1/somangi-bench-sit.blend'))
s=bpy.context.scene;s.frame_set(25);mesh=bpy.data.objects['Somangi_Body'];rig=bpy.data.objects['Somangi_Rig'];bench=bpy.data.objects['Bench']
rig.animation_data.action=None;rig.pose.bones['Root'].location=(0,0,0);bpy.context.view_layer.update()
obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh();points=[v.co.copy() for v in temp.vertices];obj.to_mesh_clear()
verts=[bench.matrix_world@v.co for v in bench.data.vertices]
lo=Vector([min(v[i] for v in verts) for i in range(3)]);hi=Vector([max(v[i] for v in verts) for i in range(3)])
bvh=BVHTree.FromPolygons(verts,[list(p.vertices) for p in bench.data.polygons])
seat=bvh.ray_cast(Vector((0,.35,3)),Vector((0,0,-1)))[0].z
group=mesh.vertex_groups['Body'].index
body=[v.index for v in mesh.data.vertices if -.65<v.co.z<-.48 and abs(v.co.x)<.30 and any(g.group==group and g.weight>.95 for g in v.groups)]
rows=[]
for step in range(-20,36):
    y=step*.01
    candidates=[i for i in body if lo.y+.012<points[i].y+y<hi.y-.012]
    if not candidates:continue
    bottom=min(points[i].z for i in candidates);z=seat-bottom+.001;penetration=0
    for p in points:
        co=p+Vector((0,y,z))
        if not all(lo[i]<co[i]<hi[i] for i in range(3)):continue
        near,normal,_,dist=bvh.find_nearest(co)
        if (co-near).dot(normal)<0:penetration=max(penetration,dist)
    touching=[i for i in candidates if points[i].z-bottom<.008]
    rows.append({'y':y,'z':z,'penetration':penetration,'contact_vertices':len(touching),'butt_vertex_ids':candidates})
viable=[r for r in rows if r['penetration']<.003 and r['contact_vertices']>=10]
assert viable,[(r['y'],r['penetration']) for r in rows]
chosen=max(viable,key=lambda r:r['y'])
rig.pose.bones['Root'].location=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((0,chosen['y'],chosen['z']))
cam=s.camera;target=Vector((0,0,.1));s.render.resolution_x=640;s.render.resolution_y=600;s.cycles.samples=12
for name,pos in [('sit-side',(6,0,.1)),('sit-angle',(3,-5,2))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=3.5
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'scene-base.blend'))
chosen.update({'seat_center':[0,.35,seat],'seated_root_world':[0,chosen['y'],chosen['z']],'bench_scale':1.5})
(P/'seat.json').write_text(json.dumps(chosen,indent=2))
print('CONTACT_FIT',json.dumps({k:v for k,v in chosen.items() if k!='butt_vertex_ids'}))
