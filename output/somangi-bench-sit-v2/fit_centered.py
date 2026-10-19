import bpy,json,math
from pathlib import Path
from mathutils import Vector,Quaternion,Matrix
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-bench-sit-v1/somangi-bench-sit.blend'))
s=bpy.context.scene;s.frame_set(25);mesh=bpy.data.objects['Somangi_Body'];rig=bpy.data.objects['Somangi_Rig'];bench=bpy.data.objects['Bench']
rig.animation_data.action=None;rig.pose.bones['Root'].location=(0,0,0)
verts=[bench.matrix_world@v.co for v in bench.data.vertices]
lo=Vector([min(v[i] for v in verts) for i in range(3)]);hi=Vector([max(v[i] for v in verts) for i in range(3)])
bvh=BVHTree.FromPolygons(verts,[list(p.vertices) for p in bench.data.polygons])
seat=bvh.ray_cast(Vector((0,.35,3)),Vector((0,0,-1)))[0].z
group=mesh.vertex_groups['Body'].index
body=[v.index for v in mesh.data.vertices if -.65<v.co.z<-.48 and abs(v.co.x)<.30 and any(g.group==group and g.weight>.95 for g in v.groups)]
def hips(z):
    bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    for side in ['L','R']:rig.data.edit_bones['Leg.'+side].head.z=z
    bpy.ops.object.mode_set(mode='OBJECT')
    for side in ['L','R']:
        pb=rig.pose.bones['Leg.'+side];q=pb.bone.matrix_local.to_quaternion()
        pb.rotation_quaternion=q.inverted()@Quaternion((1,0,0),math.radians(-76))@q
    bpy.context.view_layer.update()
rows=[]
for hip in [-.35,-.30,-.25]:
    hips(hip)
    obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh();points=[v.co.copy() for v in temp.vertices];obj.to_mesh_clear()
    for step in range(15,36,2):
        y=step*.01;candidates=[i for i in body if lo.y+.02<points[i].y+y<hi.y-.02]
        if not candidates:continue
        bottom=min(points[i].z for i in candidates);z=seat-bottom+.005;depth=0
        for p in points:
            co=p+Vector((0,y,z))
            if not all(lo[i]<co[i]<hi[i] for i in range(3)):continue
            near,normal,_,dist=bvh.find_nearest(co)
            if (co-near).dot(normal)<0:depth=max(depth,dist)
        touch=sum(points[i].z-bottom<.008 for i in candidates)
        rows.append({'y':y,'z':z,'hip_z':hip,'penetration':depth,'contact_vertices':touch,'butt_vertex_ids':candidates})
viable=[r for r in rows if r['penetration']<.003 and r['contact_vertices']>=10]
assert viable,[(r['hip_z'],r['y'],r['penetration']) for r in rows]
chosen=max(viable,key=lambda r:(r['y'], -abs(r['hip_z']+.64)))
hips(chosen['hip_z'])
rig.pose.bones['Root'].location=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((0,chosen['y'],chosen['z']))
bpy.context.view_layer.update()
obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh()
offsets={}
for side in ['L','R']:
    ids=[v.index for v in mesh.data.vertices if v.co.z<-.84 and (v.co.x>0 if side=='L' else v.co.x<0)]
    center=sum((temp.vertices[i].co for i in ids),Vector())/len(ids)
    delta=Vector((0,-.07-center.y,seat+.16-center.z))
    offsets[side]=list(delta)
obj.to_mesh_clear()
for side,delta in offsets.items():
    rig.pose.bones['Leg.'+side].location=rig.data.bones['Leg.'+side].matrix_local.to_3x3().inverted()@Vector(delta)
bpy.context.view_layer.update()
obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh()
corrections=[]
for v in mesh.data.vertices:
    co=temp.vertices[v.index].co
    if v.co.z<=-.73 or not all(lo[i]<co[i]<hi[i] for i in [0,1]):continue
    hit=bvh.ray_cast(Vector((co.x,co.y,3)),Vector((0,0,-1)))[0]
    if hit is None or co.z>=hit.z+.001:continue
    skin=Matrix(((0,0,0),(0,0,0),(0,0,0)))
    for g in v.groups:
        name=mesh.vertex_groups[g.group].name
        if name not in rig.pose.bones:continue
        transform=rig.pose.bones[name].matrix@rig.data.bones[name].matrix_local.inverted()
        skin+=transform.to_3x3()*g.weight
    corrections.append((v.index,skin.inverted()@Vector((0,0,hit.z+.001-co.z))))
obj.to_mesh_clear()
for i,delta in corrections:mesh.data.vertices[i].co+=delta
mesh.data.update();bpy.context.view_layer.update()
cam=s.camera;target=Vector((0,0,.1));s.render.resolution_x=640;s.render.resolution_y=600;s.cycles.samples=12
for name,pos in [('sit-side',(6,0,.1)),('sit-angle',(3,-5,2))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=3.5
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'scene-base.blend'))
chosen.update({'seat_center':[0,.35,seat],'seated_root_world':[0,chosen['y'],chosen['z']],'bench_scale':1.5})
chosen['seated_leg_offsets']=offsets
chosen['hip_surface_repair_vertices']=len(corrections)
chosen['hip_surface_max_correction']=max((d.length for _,d in corrections),default=0)
(P/'seat.json').write_text(json.dumps(chosen,indent=2))
print('CENTERED_CONTACT',json.dumps({k:v for k,v in chosen.items() if k!='butt_vertex_ids'}))
