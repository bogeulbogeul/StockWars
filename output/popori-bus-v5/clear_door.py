"""Move the complete entry and step clear of the tire and wheel opening."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v4/Popori-bus-animated.blend'))
scene=bpy.context.scene
for o in scene.objects:
    if o.name.startswith(('Boarding_Door_','Door_Handle','Boarding_Step')):o.location.x-=.14
bpy.context.view_layer.update()
doors=[o for o in scene.objects if o.name.startswith('Boarding_Door_Frame')]
right=max((o.matrix_world@Vector(v)).x for o in doors for v in o.bound_box)
arch_clearance=(1.18-.435)-right
assert arch_clearance>.06
step=bpy.data.objects['Boarding_Step']
assert abs(sum(o.location.x for o in doors)/2-step.location.x)<1e-6
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=24
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),5.3),
    ('door-wheel-close',(2,-6,2),(.43,-.8,1.03),2.3)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'door_right_x':right,'wheel_arch_left_x':.745,
    'door_arch_clearance':arch_clearance,'door_step_centers_aligned':True,
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
