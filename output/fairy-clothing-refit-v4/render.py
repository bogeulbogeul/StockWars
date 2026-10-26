import bpy, math
from pathlib import Path
from mathutils import Vector

P = Path(__file__).resolve().parent
for label, filename in [('moa', 'moa-bench-sit.glb'),
                        ('tori', 'tori.glb'), ('bongbong', 'bongbong.glb')]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(P / filename))
    scene = bpy.context.scene
    for ob in list(scene.objects):
        ob.animation_data_clear()
        if ob.type == 'ARMATURE': ob.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    meshes = [o for o in scene.objects if o.type == 'MESH']
    points = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    low = min(v.z for v in points)
    high = max(v.z for v in points)
    center = Vector((0, 0, (low + high) / 2))
    world = bpy.data.worlds.new('Studio'); world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (.32, .32, .32, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = .7
    scene.world = world
    for location, energy, size in [((-3, -4, 5), 450, 4), ((3, -2, 3), 250, 3), ((0, 3, 4), 350, 3)]:
        bpy.ops.object.light_add(type='AREA', location=location)
        lamp = bpy.context.object; lamp.data.energy = energy; lamp.data.shape = 'DISK'; lamp.data.size = size
        lamp.rotation_euler = (center - lamp.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.camera_add()
    camera = bpy.context.object; camera.data.type = 'ORTHO'; camera.data.ortho_scale = (high - low) * 1.22
    scene.camera = camera
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 24
    scene.render.resolution_x = 650; scene.render.resolution_y = 800; scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = 'AgX'
    for view, offset in [('front', (0, -5, .05)), ('right', (5, 0, .05)), ('back', (0, 5, .05)), ('angle', (3, -5, .7))]:
        camera.location = center + Vector(offset)
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(P / f'{label}-{view}.png')
        bpy.ops.render.render(write_still=True)

