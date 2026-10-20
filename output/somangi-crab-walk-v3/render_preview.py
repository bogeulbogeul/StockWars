import bpy,math
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-crab-walk.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];cam=s.camera
s.render.resolution_x=480;s.render.resolution_y=480;s.cycles.samples=8
# Face-on inspection makes the lateral step visible; angle view shows the turned body.
for view,pos in [('face',(6,0,.35)),('angle',(4,-6,.6))]:
    folder=P/(view+'-frames');folder.mkdir(exist_ok=True)
    cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.7
    rig.animation_data.action=bpy.data.actions['Crab_Right']
    for i in range(24):
        s.frame_set(i+1)
        s.render.filepath=str(folder/f'{i:03}.png');bpy.ops.render.render(write_still=True)
