import bpy,math
from pathlib import Path
from mathutils import Matrix,Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'buddy-seat.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Buddy_Rig'];mesh=bpy.data.objects['Buddy_Original'];target=bpy.data.objects['Seated_Pose_Review']
target.hide_render=True;target.hide_set(True);mesh.hide_render=False;mesh.hide_set(False)
rig.hide_set(False);s.frame_set(70);bpy.context.view_layer.update()
ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
actual=[v.co.copy() for v in ev.data.vertices]
mats={pb.name:pb.matrix@pb.bone.matrix_local.inverted() for pb in rig.pose.bones}
key=mesh.shape_key_add(name='Restored_Seat_Pose')
for i,v in enumerate(mesh.data.vertices):
    delta=target.data.vertices[i].co-actual[i]
    if delta.length<1e-7:continue
    m=Matrix(((0,0,0,0),)*4);total=0
    for g in v.groups:
        n=mesh.vertex_groups[g.group].name
        if n in mats:m+=mats[n]*g.weight;total+=g.weight
    if total:
        m*=1/total;key.data[i].co+=m.to_3x3().inverted_safe()@delta
for f in range(1,97):
    t=max(0,min(1,(f-28)/22));key.value=t*t*(3-2*t);key.keyframe_insert(data_path='value',frame=f)
s.frame_start=1;s.frame_end=96;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-seat-motion.blend'))
s.render.resolution_x=560;s.render.resolution_y=560
for name,pos,look in [('side',(7,-.2,.05),(0,-.2,-.15)),('front',(0,-7,.05),(0,0,.05))]:
    cam=s.camera;cam.data.ortho_scale=2.75;cam.location=pos
    cam.rotation_euler=(Vector(look)-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/(name+'-frames');folder.mkdir(exist_ok=True)
    for f in range(1,97,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
