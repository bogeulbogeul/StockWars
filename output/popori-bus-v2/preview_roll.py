"""Linearize wheel motion and render a full revolution for visual QA."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
scene=bpy.context.scene
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for key in fc.keyframe_points:
                        key.interpolation='LINEAR'
                        key.co.x-=1
                        key.handle_left.x-=1;key.handle_right.x-=1
for o in scene.objects:
    if o.name.startswith('WheelPivot_'):
        for track in o.animation_data.nla_tracks:
            for strip in track.strips:
                strip.action_frame_start=0;strip.action_frame_end=48
                strip.frame_start=0;strip.frame_end=48
scene.frame_start=0;scene.frame_end=48
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in ('MESH','CURVE','EMPTY') and o.name!='Preview_Ground':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Popori-bus-animated.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=True,export_force_sampling=True)
scene.render.resolution_x=640;scene.render.resolution_y=480;scene.cycles.samples=8
scene.camera.location=(6,-8,4.3)
scene.camera.rotation_euler=(Vector((0,0,1.06))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
folder=ROOT/'roll-frames';folder.mkdir(exist_ok=True)
for i,frame in enumerate(range(0,48,3)):
    scene.frame_set(frame)
    for o in scene.objects:
        if o.name.startswith('WheelPivot_'):
            assert abs(o.rotation_euler.y-frame*math.tau/48)<1e-5
    scene.render.filepath=str(folder/f'{i:03}.png');bpy.ops.render.render(write_still=True)
scene.frame_set(0)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Popori-bus-animated.blend'))
report=json.loads((ROOT/'validation.json').read_text())
report['linear_speed_verified_frames']=16
report['full_revolution_frames']=48
(ROOT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
