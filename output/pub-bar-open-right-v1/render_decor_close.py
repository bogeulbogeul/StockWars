"""Detail preview for tabletop ornament finishing."""
import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'Pub-bar-room-preview.blend'))
scene=bpy.context.scene
camera=scene.camera
camera.data.type='ORTHO'
camera.data.ortho_scale=.85
camera.location=(.5,-5,2.7)
camera.rotation_euler=(Vector((-1.67,-2.98,.99))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(root/'table-decor-close.png')
bpy.ops.render.render(write_still=True)
