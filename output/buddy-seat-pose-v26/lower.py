import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'buddy-seat-pose-review.blend'))
s=bpy.context.scene;obj=bpy.data.objects['Seated_Pose_Review']
obj.location.z-=.105
for name,pos in [('side',(7,-.2,.05)),('front',(0,-7,.05))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.1))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'-contact.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-seat-pose-contact.blend'))
