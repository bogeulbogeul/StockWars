import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-sit-corrective-v21/buddy-sit-corrective.blend'))
rig=bpy.data.objects['Buddy_Rig'];s=bpy.context.scene
for f in range(1,73):
    s.frame_set(f)
    t=max(0,min(1,(f-24)/28));a=t*t*(3-2*t)
    pb=rig.pose.bones['Root']
    pb.location+=pb.bone.matrix_local.to_quaternion().inverted()@Vector((0,0,-.12*a))
    pb.keyframe_insert(data_path='location',frame=f,group='Root')
s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-sit-contact.blend'))
for name,pos in [('side',(7,0,-.02)),('angle',(3,-7,1.25))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.12))-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for f in range(1,73,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
