import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'buddy-hop-seat.blend'))
s=bpy.context.scene;cam=s.camera
cam.location=(0,-7,.05);cam.data.ortho_scale=2.75
cam.rotation_euler=(Vector((0,0,.05))-cam.location).to_track_quat('-Z','Y').to_euler()
s.render.resolution_x=560;s.render.resolution_y=560
folder=P/'front';folder.mkdir(exist_ok=True)
for f in range(1,97,3):
    s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
