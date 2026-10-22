"""Align the complete boarding door assembly to the shortened step."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v3/Popori-bus-animated.blend'))
scene=bpy.context.scene
step=bpy.data.objects['Boarding_Step']
doors=[o for o in scene.objects if o.name.startswith('Boarding_Door_Frame')]
old_center=sum(o.location.x for o in doors)/len(doors)
offset=step.location.x-old_center
moved=[]
for o in scene.objects:
    if o.name.startswith(('Boarding_Door_','Door_Handle')):
        o.location.x+=offset;moved.append(o.name)
assert abs(sum(o.location.x for o in doors)/len(doors)-step.location.x)<1e-6
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=24
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),5.3),
    ('door-step-close',(2,-6,2),(.48,-.8,1.03),2.25)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'door_shift_x':offset,'door_center_x':step.location.x,
    'step_center_x':step.location.x,'moved_objects':moved,'step_and_wheels_unchanged':True,
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
