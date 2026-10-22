"""Preview the opposite side of the current bus without modifying the model."""
import bpy
from pathlib import Path
from mathutils import Vector

root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'Popori-bus-animated.blend'))
scene=bpy.context.scene
scene.frame_set(0)
scene.render.resolution_x=1400
scene.render.resolution_y=1000
scene.cycles.samples=32
cam=scene.camera
cam.location=(-6,8,4.0)
cam.data.ortho_scale=6.1
cam.rotation_euler=(Vector((0,0,1.06))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(root/'opposite-side.png')
bpy.ops.render.render(write_still=True)
