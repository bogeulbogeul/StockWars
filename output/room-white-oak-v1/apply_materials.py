"""Apply exportable white wallpaper and an embedded oak-plank texture."""
import bpy
import json
import math
from pathlib import Path
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / 'room-clean-v2' / 'Room-clean.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
before = {o.name: [tuple(v.co) for v in o.data.vertices] for o in parts}

# Deterministic, seamless plank rows, staggered ends and quiet longitudinal grain.
size = 1024
yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) / size
row = np.floor(yy * 14).astype(int)
along = xx * 3 + (row % 3) / 3
column = np.floor(along).astype(int)
u, v = along % 1, (yy * 14) % 1
variation = np.sin(row * 71.3 + column * 19.7) * 0.035
grain = (np.sin(yy * 2500 + 5 * np.sin(xx * 14 + row)) * 0.009
         + np.sin(yy * 6400 + np.sin(xx * 37) * 7) * 0.004)
long_wave = np.sin(v * 24 + np.sin(u * 5 + row) * 2) * 0.012
gap = ((v < .018) | (v > .982) | (u < .0035) | (u > .9965))
rgb = np.stack([.72 + variation + grain + long_wave,
                .51 + variation + grain + long_wave,
                .30 + variation * .8 + grain + long_wave], axis=-1)
rgb[gap] *= .72
rgba = np.concatenate([np.clip(rgb, 0, 1), np.ones((size, size, 1))], axis=-1)
image = bpy.data.images.new('Light_Oak_Planks', width=size, height=size, alpha=False)
image.pixels.foreach_set(rgba.astype(np.float32).ravel())
image.filepath_raw = str(ROOT / 'oak-planks.png')
image.file_format = 'PNG'
image.save()
image.pack()

for obj in parts:
    mat = bpy.data.materials.new(obj.name + ('_OakFloor' if obj.name == 'Floor' else '_WhiteWallpaper'))
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = .82 if obj.name == 'Floor' else .95
    if obj.name == 'Floor':
        tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = image
        mat.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
        mat.diffuse_color = (.72, .51, .30, 1)
        xs = [v.co.x for v in obj.data.vertices]
        ys = [v.co.y for v in obj.data.vertices]
        for loop in obj.data.loops:
            co = obj.data.vertices[loop.vertex_index].co
            obj.data.uv_layers.active.data[loop.index].uv = (
                (co.x - min(xs)) / (max(xs) - min(xs)),
                (co.y - min(ys)) / (max(ys) - min(ys)))
    else:
        shader.inputs['Base Color'].default_value = (.91, .90, .875, 1)
        mat.diffuse_color = (.91, .90, .875, 1)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    obj.select_set(True)
    assert [tuple(v.co) for v in obj.data.vertices] == before[obj.name]
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-white-oak.glb'),
                          export_format='GLB', use_selection=True, export_extras=True)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.world = bpy.data.worlds.new('Neutral_World')
scene.world.color = (.45, .45, .45)
bpy.ops.object.camera_add(location=(3, -4, 3))
cam = bpy.context.object
cam.rotation_euler = (Vector((0, 0, -.02)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 3.1
scene.camera = cam
for loc, energy, scale in [((0, -1, 4), 220, 4), ((-3, -2, 2), 90, 3)]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    lamp = bpy.context.object
    lamp.data.energy = energy
    lamp.data.shape = 'DISK'
    lamp.data.size = scale
    lamp.rotation_euler = (Vector((0, 0, 0)) - lamp.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.resolution_x = 1100
scene.render.resolution_y = 950
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-white-oak.blend'))
scene.render.filepath = str(ROOT / 'assembled-preview.png')
bpy.ops.render.render(write_still=True)
for obj in parts:
    if obj.name in ('Wall_Front', 'Wall_Right'):
        obj.hide_render = True
scene.render.filepath = str(ROOT / 'interior-preview.png')
bpy.ops.render.render(write_still=True)
(ROOT / 'manifest.json').write_text(json.dumps({
    'source': str(SOURCE), 'parts': list(before), 'geometry_unchanged': True,
    'wallpaper': 'Matte plain warm white, separate material per wall',
    'floor': 'Light oak staggered planks; embedded 1024px color texture',
    'preview': 'Interior preview hides front and right wall only; delivered models include all walls',
}, indent=2), encoding='utf-8')
