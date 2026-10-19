import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-bench-sit.blend'))
s=bpy.context.scene;cam=s.camera;target=Vector((0,0,.1))
cam.location=(0,-6,.1);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale=3.6;s.render.resolution_x=640;s.render.resolution_y=600;s.cycles.samples=12
(P/'front-frames').mkdir(exist_ok=True)
for f in range(1,73,2):
    s.frame_set(f);s.render.filepath=str(P/'front-frames'/f'{f:03}.png');bpy.ops.render.render(write_still=True)
