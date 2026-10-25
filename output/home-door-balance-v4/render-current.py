"""Photograph the current adopted house; do not edit or export its geometry."""
import bpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'Home-balanced-door.blend'))
scene=bpy.context.scene;cam=scene.camera
cam.data.type='ORTHO';cam.data.ortho_scale=3.65
cam.location=(4,-6,3.1)
cam.rotation_euler=(Vector((.10,-.08,1.05))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.cycles.samples=24;scene.render.filepath=str(ROOT/'current-front-right.png')
bpy.ops.render.render(write_still=True)
