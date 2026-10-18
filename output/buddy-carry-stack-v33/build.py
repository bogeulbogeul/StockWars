import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-carry-fit-v32/buddy-carry-pose.blend'))
s=bpy.context.scene;box=bpy.data.objects['Carry_Box'];tape=bpy.data.objects['Box_Tape']
# Rear gripping section remains near the hands; the load projects forward.
box.location.y=-.70;box.scale.y=.65/.28
tape.location.y=-.70;tape.scale.y=.655
for i in [1,2]:
    new=box.copy();new.data=box.data.copy();bpy.context.collection.objects.link(new)
    new.name=f'Stacked_Box_{i+1}';new.location.y=-.94;new.location.z=box.location.z+.325*i
    band=tape.copy();band.data=tape.data.copy();bpy.context.collection.objects.link(band)
    band.name=f'Stacked_Tape_{i+1}';band.location.y=-.94;band.location.z=tape.location.z+.325*i
s.render.resolution_x=640;s.render.resolution_y=640
for name,pos in [('side',(7,0,-.02)),('angle',(3,-7,1.15)),('front',(0,-7,-.02))]:
    cam=s.camera;cam.data.ortho_scale=2.6;cam.location=pos
    cam.rotation_euler=(Vector((0,-.2,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-stacked-carry.blend'))
