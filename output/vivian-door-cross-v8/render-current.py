"""Photograph the current installed general-store asset without changing it."""
import bpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'VivianStore-fitted-cross.blend'))
scene=bpy.context.scene;cam=scene.camera;cam.data.type='ORTHO'
cam.data.ortho_scale=4.3;cam.location=(4,-6,3.5)
cam.rotation_euler=(Vector((0,-.08,1.05))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.cycles.samples=24;scene.render.filepath=str(ROOT/'current-front-right.png')
bpy.ops.render.render(write_still=True)
