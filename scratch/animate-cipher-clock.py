"""Keep the source building, add centered clock pivots and an accelerated demo."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Matrix, Vector

out = Path('C:/GitHub/StockWars/output/cipher-exterior-clock-v1')
out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/cipher-exterior-blender-v1/CipherSecurities-exterior.blend')
scene = bpy.context.scene
step = bpy.data.objects['Entry_Step']
step.data.transform(Matrix.Diagonal((1, 1, 2, 1)))
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 289
hands = []
for name, y, dx, dz in [('Clock_Hour', -1.201, -.064, .043), ('Clock_Minute', -1.206, .083, .072)]:
    hand = bpy.data.objects[name]
    center = Vector((0, y, 1.65))
    hand.data.transform(Matrix.Translation(-center))
    hand.location = center
    base = math.atan2(dx, dz)
    period = 43200 if name == 'Clock_Hour' else 3600
    for frame in range(1, 290, 6):
        elapsed = (frame - 1) / 24 * 3600
        hand.rotation_euler.y = 2 * math.pi * elapsed / period - base
        hand.keyframe_insert(data_path='rotation_euler', frame=frame)
    for layer in hand.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'
    hands.append(hand)
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(out / 'CipherSecurities-clock.blend'))
bpy.ops.export_scene.gltf(filepath=str(out / 'CipherSecurities-clock.glb'), export_format='GLB',
    export_animations=True, export_animation_mode='SCENE', export_frame_range=True)

# Short front clock close-up; the GIF deliberately accelerates time.
scene.render.engine = 'CYCLES'
scene.cycles.samples = 8
scene.cycles.use_denoising = True
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.8,.84,.9,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .7
bpy.ops.object.light_add(type='AREA', location=(-3,-4,6))
lamp = bpy.context.object
lamp.data.energy = 350
lamp.data.size = 5
lamp.rotation_euler = (Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-5,1.65))
camera = bpy.context.object
camera.rotation_euler = (Vector((0,-1.2,1.65))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = .65
scene.camera = camera
scene.render.resolution_x = 400
scene.render.resolution_y = 400
scene.render.resolution_percentage = 100
for i in range(48):
    scene.frame_set(1 + i * 6)
    scene.render.filepath = str(out / f'preview-{i:02}.png')
    bpy.ops.render.render(write_still=True)
(out / 'manifest.json').write_text(json.dumps({
    'clock_hands': ['Clock_Hour','Clock_Minute'],
    'pivot': 'Each hand origin is its own center on the clock spindle',
    'blender_axis': '+Y clockwise when viewed from front',
    'demo_duration_seconds': 12, 'demo_time_scale': 3600,
    'actual_hour_period_seconds': 43200, 'actual_minute_period_seconds': 3600,
    'game_installed': False}, indent=2))
scene.frame_set(33)
camera.location = (4,-6,3.5)
camera.rotation_euler = (Vector((0,-.03,1.03))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale = 3.65
scene.render.resolution_x = 1400
scene.render.resolution_y = 1200
scene.cycles.samples = 24
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,-.015))
ground = bpy.context.object
ground.scale = (200,200,.01)
scene.render.filepath = str(out / 'front-right.png')
bpy.ops.render.render(write_still=True)
