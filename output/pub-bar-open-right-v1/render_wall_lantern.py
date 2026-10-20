"""Detail preview of the right wall lantern."""
import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'Pub-bar-room-preview.blend'))
scene=bpy.context.scene
camera=scene.camera
camera.data.type='ORTHO'
camera.data.ortho_scale=1.10
camera.location=(0,-2.5,2.5)
camera.rotation_euler=(Vector((3.76,.58,1.68))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(root/'wall-lantern-close.png')
bpy.ops.render.render(write_still=True)
