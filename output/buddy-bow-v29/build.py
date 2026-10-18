import bpy,math
from pathlib import Path
from mathutils import Quaternion,Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-walk-heat-v15/buddy-walk-heat.blend'))
rig=bpy.data.objects['Buddy_Rig'];s=bpy.context.scene
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Greeting_Bow')
def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
def rot(n,deg,axis=(1,0,0)):
    pb=rig.pose.bones[n];q=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION'
    pb.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(deg))@q
for f in range(1,97):
    t=(f-1)/96;a=ease((t-.12)/.24)*(1-ease((t-.55)/.30))
    tilt=math.sin(math.pi*max(0,min(1,(t-.66)/.28)))*1.8
    for pb in rig.pose.bones:
        pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
    rot('Body',6*a);rot('Head',7*a)
    if tilt:rot('Head',tilt,(0,1,0))
    rot('Arm.L',-1.5*a);rot('Arm.R',-1.5*a)
    for pb in rig.pose.bones:
        pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=pb.name)
        pb.keyframe_insert(data_path='location',frame=f,group=pb.name)
s.frame_start=1;s.frame_end=96;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-bow.blend'))
s.render.resolution_x=560;s.render.resolution_y=560
for name,pos in [('front',(0,-7,-.02)),('angle',(3,-7,1.15)),('side',(7,0,-.02))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for f in range(1,97,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
