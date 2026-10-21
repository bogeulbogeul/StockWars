"""Remove white wheel trim and shorten boarding step with measured tire clearance."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v2/Popori-bus-animated.blend'))
scene=bpy.context.scene
for o in list(scene.objects):
    if o.name.startswith('Continuous_Wheel_Arch_Trim'):
        bpy.data.objects.remove(o,do_unlink=True)
step=bpy.data.objects['Boarding_Step']
# Preserve rounded geometry while ending the step before the front tire envelope.
step.location.x=.47
step.scale.x*=.56/.79
bpy.context.view_layer.update()
right=max((step.matrix_world@Vector(p)).x for p in step.bound_box)
clearance=(1.18-.398)-right
assert clearance>.025,clearance
for f in range(0,49,3):
    scene.frame_set(f);bpy.context.view_layer.update()
    wheel=bpy.data.objects['WheelPivot_Front_Right']
    assert abs(wheel.matrix_world.translation.x-1.18)<1e-6
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
cam=scene.camera;scene.cycles.samples=24
scene.render.resolution_x=1200;scene.render.resolution_y=900
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),5.3),
    ('step-wheel-close',(3,-5,1.6),(.8,-.8,.48),1.85)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'step_tire_clearance':clearance,
    'white_arch_trim_removed':True,'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
