"""Render saved model with the shallow reference viewing angle."""
import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'CipherSecurities-roof-reference.blend'))
scene=bpy.context.scene;cam=scene.camera
cam.location=(4,-10,3.48);cam.data.ortho_scale=6.7
cam.rotation_euler=(Vector((0,-.05,2.43))-cam.location).to_track_quat('-Z','Y').to_euler()
for name,width,height in [('reference-angle',1536,576),('roof-detail',1200,800)]:
    scene.render.resolution_x=width;scene.render.resolution_y=height
    scene.render.filepath=str(root/(name+'.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'CipherSecurities-roof-reference.blend'))
