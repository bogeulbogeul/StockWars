import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'CipherSecurities-roof-reference.blend'))
scene=bpy.context.scene;cam=scene.camera
cam.location=(4.4,-10.1,3.65);cam.data.ortho_scale=3.1
cam.rotation_euler=(Vector((.4,-.1,2.6))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1200;scene.render.resolution_y=800
scene.render.filepath=str(root/'central-close.png')
bpy.ops.render.render(write_still=True)
