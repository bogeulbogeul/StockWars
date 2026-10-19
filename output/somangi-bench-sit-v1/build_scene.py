import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-walk-v3/somangi-walk.blend'))
s=bpy.context.scene;mesh=bpy.data.objects['Somangi_Body'];rig=bpy.data.objects['Somangi_Rig']
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
for pb in rig.pose.bones:
    pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
# Hip pivots at the actual narrow body/leg join; no longer-leg reconstruction.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
for side in ['L','R']:
    b=rig.data.edit_bones['Leg.'+side];b.head.z=-.64
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Bench.glb')
bench=next(o for o in bpy.context.selected_objects if o.type=='MESH');bench.name='Bench'
bench.scale=(1.5,1.5,1.5);bench.location=(0,.35,-.951+.20133699476718903*1.5)
bpy.context.view_layer.update()
verts=[bench.matrix_world@v.co for v in bench.data.vertices]
bvh=BVHTree.FromPolygons(verts,[list(p.vertices) for p in bench.data.polygons])
hit=bvh.ray_cast(Vector((0,.35,3)),Vector((0,0,-1)))
assert hit[0] is not None
seat=hit[0].z
def rotate(name,axis,angle):
    p=rig.pose.bones[name];q=p.bone.matrix_local.to_quaternion()
    p.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(angle))@q
def root(x,y,z):
    rig.pose.bones['Root'].location=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((x,y,z))
def pose(amount):
    for pb in rig.pose.bones:
        pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
    for side in ['L','R']:rotate('Leg.'+side,(1,0,0),-76*amount)
    rotate('Arm.L',(1,0,0),-9*amount);rotate('Arm.R',(1,0,0),-9*amount)
pose(1);bpy.context.view_layer.update()
obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh()
bodygroup=mesh.vertex_groups['Body'].index
seated_y=.05
bench_front=min(v.y for v in verts);bench_back=max(v.y for v in verts)
butt=[v.index for v in mesh.data.vertices if v.co.z<-.40 and abs(v.co.x)<.35 and bench_front+.005<temp.vertices[v.index].co.y+seated_y<bench_back-.005]
assert butt
bottom=min(temp.vertices[i].co.z for i in butt);obj.to_mesh_clear()
root_z=seat-bottom+.001
root(0,seated_y,root_z);bpy.context.view_layer.update()
cam=s.camera;target=Vector((0,.05,-.05))
def render(name,pos):
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=3.5;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
s.render.resolution_x=800;s.render.resolution_y=650;s.cycles.samples=16
render('sit-angle',(3,-5,2.0));render('sit-side',(6,.05,-.05))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'scene-base.blend'))
(P/'seat.json').write_text(json.dumps({'bench_scale':1.5,'seat_center':[0,.35,seat],'seated_root_world':[0,seated_y,root_z],'butt_vertex_ids':butt,'hip_z':-.64,'leg_angle':-76},indent=2))
print('SEAT',seat,'ROOT_Z',root_z)
