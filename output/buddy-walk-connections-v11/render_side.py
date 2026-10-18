import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'buddy-soft-connections.blend'))
s=bpy.context.scene;cam=s.camera;cam.location=(7,0,-.02)
cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
folder=P/'side-frames';folder.mkdir(exist_ok=True)
for f in range(1,33,2):
    s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
