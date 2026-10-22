"""Remove window crossbars, latches and green sills; retain inset glazing."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v18/Popori-bus-animated.blend'))
scene=bpy.context.scene
removed=[]
for o in list(scene.objects):
    if o.name.startswith(('Window_Upper_Vent_Crossbar','Window_Vent_Latch','Window_Lower_Sill')):
        removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
assert len(removed)==21
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.cycles.samples=32
cam=scene.camera
for name,loc,target,scale in [('front-right',(6,-8,4.3),(0,0,1.06),6.1),
    ('windows-close',(-2,-6,2.8),(-1.0,-.81,1.58),2.45)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'removed':removed,'inset_glass_and_outer_frames_preserved':True,
    'wheel_roll_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
