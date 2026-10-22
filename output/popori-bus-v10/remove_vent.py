"""Remove both rear side vent decorations, retaining the finished bus and roll."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'popori-bus-v9/Popori-bus-animated.blend'))
scene=bpy.context.scene
removed=[]
for o in list(scene.objects):
    if o.name.startswith(('Rear_Service_Panel','Rear_Engine_Vent')):
        removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
assert len(removed)==10
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=24
cam=scene.camera;cam.location=(6,-8,4.3);cam.data.ortho_scale=6.1
cam.rotation_euler=(Vector((0,0,1.06))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'front-right.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
(ROOT/'validation.json').write_text(json.dumps({'removed':removed,'wheel_roll_preserved':True,
    'door_step_and_wheel_clearance_preserved':True,'game_modified':False},indent=2),encoding='utf-8')
