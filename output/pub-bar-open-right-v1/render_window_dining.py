"""Preview the opposite window dining set."""
import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'Pub-bar-room-preview.blend'))
scene=bpy.context.scene
camera=scene.camera
camera.data.type='ORTHO'
camera.data.ortho_scale=4.60
camera.location=(-1,-5,3.6)
camera.rotation_euler=(Vector((2.78,-1.88,.66))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(root/'window-dining-close.png')
bpy.ops.render.render(write_still=True)
