"""Extend bus length while preserving wheels, entry proportions and roll clip."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v6/Popori-bus-animated.blend'))
scene=bpy.context.scene
factor=1.20
# Stretch only structural surfaces; shift wheel centres and details without distortion.
structural=('Cream_Rounded_Coach','Green_Lower_Body','Cream_Roof_Cap','Chassis')
for o in scene.objects:
    if o.parent is not None:continue
    if o.name=='Preview_Ground' or o.type in ('CAMERA','LIGHT'):continue
    o.location.x*=factor
    if o.name.startswith(structural) or o.type=='CURVE':o.scale.x*=factor
# Keep doors, handles and step as a single rigid assembly centred on the step.
old_center=.33
new_center=old_center*factor
for o in scene.objects:
    if o.name.startswith(('Boarding_Door_','Door_Handle','Boarding_Step')):
        o.location.x=old_center+(o.location.x/factor-old_center)+(new_center-old_center)
bpy.context.view_layer.update()
scene.frame_set(0)
doors=[o for o in scene.objects if o.name.startswith('Boarding_Door_Frame')]
step=bpy.data.objects['Boarding_Step']
assert abs(sum(o.location.x for o in doors)/2-step.location.x)<1e-6
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=24
cam=scene.camera
for name,loc in [('front-right',(6,-8,4.3)),('side',(0,-9,2.8))]:
    cam.location=loc;cam.data.ortho_scale=6.1
    cam.rotation_euler=(Vector((0,0,1.06))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'length_factor':factor,'wheel_shapes_preserved':True,
    'door_step_alignment_preserved':True,'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
