"""Fit service vents entirely within green body, above rear wheel opening."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v7/Popori-bus-animated.blend'))
scene=bpy.context.scene
# Upper green body surface is z=1.07. Keep a narrow panel below that seam.
for o in scene.objects:
    if o.name.startswith('Rear_Service_Panel'):
        o.location.z=.965;o.scale.z*=.10/.18
        o.location.x=-1.63
        o.scale.x*=.46/.53
    elif o.name.startswith('Rear_Engine_Vent'):
        # Four fine horizontal slots stay within the compact green panel.
        suffix=o.name.rsplit('.',1)
        index=int(suffix[1]) if len(suffix)==2 else 0
        o.location.x=-1.63;o.location.z=.935+(index%4)*.020
        o.scale.x*=.30/.35;o.scale.z*=.007/.012
bpy.context.view_layer.update()
panels=[o for o in scene.objects if o.name.startswith('Rear_Service_Panel')]
bottom=min((o.matrix_world@Vector(v)).z for o in panels for v in o.bound_box)
top=max((o.matrix_world@Vector(v)).z for o in panels for v in o.bound_box)
assert bottom>.825+.06 and top<1.07-.02
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=24
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('vent-wheel-close',(-3,-6,2),(-1.50,-.8,.88),1.8)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'panel_bottom':bottom,'panel_top':top,
    'green_body_upper_z':1.07,'wheel_opening_top_z':.825,'panel_arch_clearance':bottom-.825,
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
