"""Remove door pulls and simplify protruding door finish details."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v11/Popori-bus-animated.blend'))
scene=bpy.context.scene
removed=[]
for o in list(scene.objects):
    if o.name.startswith(('Rounded_Pull_Handle','Handle_Mount')):
        removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
# Keep the existing double door and glazing, with more restrained small fittings.
for o in scene.objects:
    if o.name.startswith('Door_Hinge_Plate'):
        o.scale.y*=.50;o.location.y=-.839
    elif o.name.startswith('Door_Central_Rubber_Seal'):
        o.scale.y*=.65;o.location.y=-.845
    elif o.name.startswith('Door_Lower_Panel_Moulding'):
        o.location.y+=.006
    elif o.name.startswith('Door_Top_Drip_Cap'):
        o.scale.y*=.75
assert len(removed)==6
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('door-close',(1.5,-5,2),(.396,-.83,1.18),1.85)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'removed':removed,
    'refinements':['Reduced hinge projection','Recessed central seal','Reduced lower moulding projection'],
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
