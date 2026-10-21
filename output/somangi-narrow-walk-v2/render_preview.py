import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-narrow-walk.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];cam=s.camera
s.render.resolution_x=480;s.render.resolution_y=480;s.cycles.samples=8
for view,pos in [('front',(0,-6,.1)),('angle',(3,-6,.6))]:
    folder=P/(view+'-frames');folder.mkdir(exist_ok=True)
    cam.location=pos;cam.rotation_euler=(Vector((0,-.05,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.7
    for i in range(0,72,2):
        if i<12:name='Narrow_Enter';frame=i+1
        elif i<60:name='Narrow_Walk';frame=(i-12)%24+1
        else:name='Narrow_Exit';frame=i-59
        rig.animation_data.action=bpy.data.actions[name];s.frame_set(frame)
        s.render.filepath=str(folder/f'{i:03}.png');bpy.ops.render.render(write_still=True)
