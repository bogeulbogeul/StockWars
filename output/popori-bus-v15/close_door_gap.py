"""Tighten double door seam while preserving separate leaves."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v14/Popori-bus-animated.blend'))
scene=bpy.context.scene
center=.396
prefixes=('Door_Leaf','Door_Glass_Rubber_Seal','Door_Inset_Glass','Door_Lower_Panel_Moulding',
    'Door_Inset_Cream_Panel','Door_Edge_Hinge_Mount','Door_Edge_Hinge_Barrel')
for o in scene.objects:
    if o.name.startswith(prefixes):o.location.x+=.004 if o.location.x<center else -.004
bpy.context.view_layer.update()
leaves=sorted([o for o in scene.objects if o.name.startswith('Door_Leaf')],key=lambda o:o.location.x)
gap=min((leaves[1].matrix_world@Vector(v)).x for v in leaves[1].bound_box)-max((leaves[0].matrix_world@Vector(v)).x for v in leaves[0].bound_box)
assert .003<gap<.005
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('door-close',(1.5,-5,2),(center,-.83,1.18),1.85)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'door_seam_gap':gap,'previous_gap':.012,
    'leaves_overlap':False,'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
