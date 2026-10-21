import bpy,sys
from pathlib import Path
from mathutils import Vector
P=Path('C:/GitHub/StockWars/output/anna-model-v2')
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-rigged.blend'))
s=bpy.context.scene;cam=s.camera;s.cycles.samples=32;s.render.resolution_x=900;s.render.resolution_y=900
for name,loc,target,scale in [('armpit-close',(3,-2,.15),(.29,0,-.25),.55),('sprout-close',(0,-4,1.8),(.06,0,.72),.42),('armpit-back',(3,2,.1),(.29,0,-.25),.55)]:
 t=Vector(target);cam.location=t+Vector(loc);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
