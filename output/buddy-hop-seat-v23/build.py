import bpy,math
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-sit-contact-v22/buddy-sit-contact.blend'))
rig=bpy.data.objects['Buddy_Rig'];mesh=bpy.data.objects['Buddy_Original'];s=bpy.context.scene
s.frame_set(70);target={pb.name:(pb.rotation_quaternion.copy(),pb.location.copy()) for pb in rig.pose.bones}
rig.animation_data_clear()
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Hop_Onto_Seat')
key=mesh.data.shape_keys.key_blocks['Sit_Hip_Corrective'];mesh.data.shape_keys.animation_data_clear()
def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
root=rig.pose.bones['Root'];basis=root.bone.matrix_local.to_quaternion()
end_world=basis@target['Root'][1]
# A standing start in front of the seat; arc ends at the approved sitting position.
start_world=Vector((0,-.68,end_world.z-.16))
for f in range(1,97):
    jump=max(0,min(1,(f-22)/28));travel=ease(jump)
    sit=ease((f-28)/22)
    prep=math.sin(math.pi*max(0,min(1,(f-8)/14))) if f<22 else 0
    land=math.sin(math.pi*max(0,min(1,(f-50)/12))) if 50<=f<62 else 0
    pos=start_world.lerp(end_world,travel)
    pos.z+=.36*math.sin(math.pi*jump)-.035*prep-.022*land
    for pb in rig.pose.bones:
        q,loc=target[pb.name]
        pb.rotation_mode='QUATERNION';pb.rotation_quaternion=Quaternion().slerp(q,sit)
        pb.location=loc*sit if pb.name!='Root' else basis.inverted()@pos
        pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=pb.name)
        pb.keyframe_insert(data_path='location',frame=f,group=pb.name)
    key.value=sit;key.keyframe_insert(data_path='value',frame=f)
s.frame_start=1;s.frame_end=96;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-hop-seat.blend'))
s.render.resolution_x=560;s.render.resolution_y=560
for name,pos in [('side',(7,-.2,.05)),('angle',(3,-7,1.25))]:
    cam=s.camera;cam.data.ortho_scale=2.75;cam.location=pos
    cam.rotation_euler=(Vector((0,-.2,-.15))-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for f in range(1,97,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
