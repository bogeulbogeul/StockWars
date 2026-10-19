import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-walk.blend'))
s=bpy.context.scene;cam=s.camera
cam.location=(6,0,0)
cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
s.render.resolution_x=480;s.render.resolution_y=480;s.cycles.samples=12
(P/'side-frames').mkdir(exist_ok=True)
for f in range(1,25):
    s.frame_set(f);s.render.filepath=str(P/'side-frames'/f'{f:03}.png')
    bpy.ops.render.render(write_still=True)
