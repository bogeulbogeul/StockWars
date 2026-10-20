import bpy
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'VivianStore-clean.blend'))
scene=bpy.context.scene
cam=scene.camera
target=Vector((-.08,-.98,.65))
cam.location=target+Vector((.6,-1.6,.5))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO'
cam.data.ortho_scale=.65
scene.render.resolution_x=1000
scene.render.resolution_y=1000
scene.render.filepath=str(ROOT/'door-detail.png')
bpy.ops.render.render(write_still=True)
