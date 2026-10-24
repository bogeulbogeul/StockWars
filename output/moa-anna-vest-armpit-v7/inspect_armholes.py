"""Read-only GLB inspection renders; no model edits or exports."""
import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
BASE=P.parent/'moa-somangi-base-v1'
code=(BASE/'build.py').read_text()
exec(code.split('# Render the exported model itself, not a separate illustration.')[1].split('for name, pos in')[0])
scene.render.resolution_x=640
scene.render.resolution_y=640
cam.data.ortho_scale=.78
for name,sign,front in [('left-front',-1,-1),('left-back',-1,1),('right-front',1,-1),('right-back',1,1)]:
    target=Vector((sign*.245,0,-.15))
    cam.location=target+Vector((sign*6,front*3,-.8))
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(P/('armpit-'+name+'.png'))
    bpy.ops.render.render(write_still=True)
