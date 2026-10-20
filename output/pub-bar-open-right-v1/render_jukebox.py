"""Close preview of the entrance-side jukebox."""
import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'Pub-bar-room-preview.blend'))
scene=bpy.context.scene
camera=scene.camera
camera.data.type='ORTHO'
camera.data.ortho_scale=2.25
camera.location=(-1,-6.5,2.5)
camera.rotation_euler=(Vector((3.40,-4.32,.73))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(root/'jukebox-close.png')
bpy.ops.render.render(write_still=True)
