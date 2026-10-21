import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-walk.blend'))
s=bpy.context.scene;cam=s.camera;target=Vector((0,-.10,0))
s.render.resolution_x=480;s.render.resolution_y=480;s.cycles.samples=8
for name,pos in [('front',(0,-6,0)),('side',(6,-.10,0))]:
    folder=P/(name+'-frames');folder.mkdir(exist_ok=True)
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.7
    for f in range(1,25):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
