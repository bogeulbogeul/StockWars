"""Replace the painted floor with beveled solid planks; keep walking height."""
import bpy
import random
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'room-cement-entry-v1' / 'Room-cement-entry.blend'))
floor = bpy.data.objects['Floor']
points = [floor.matrix_world @ v.co for v in floor.data.vertices]
x0, x1 = min(v.x for v in points), max(v.x for v in points)
y0, y1 = min(v.y for v in points), max(v.y for v in points)
top = max(v.z for v in points)
bpy.data.objects.remove(floor, do_unlink=True)
materials = []
for i, variation in enumerate([-.025, -.015, -.005, .005, .015, .025]):
    mat = bpy.data.materials.new('Oak_Solid_' + str(i))
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    color = (.43 + variation, .285 + variation * .75, .155 + variation * .5, 1)
    shader.inputs['Base Color'].default_value = color
    shader.inputs['Roughness'].default_value = .72
    shader.inputs['Specular IOR Level'].default_value = .22
    mat.diffuse_color = color
    materials.append(mat)
rng = random.Random(20261020)
planks = []
rows = 12
row_width = (y1 - y0) / rows
length = (x1 - x0) / 3
gap = .0011
for row in range(rows):
    start = x0 - (row % 3) * length / 3
    while start < x1:
        left, right = max(x0, start), min(x1, start + length)
        if right - left > gap * 2:
            bpy.ops.mesh.primitive_cube_add(size=1, location=((left + right) / 2,
                y0 + (row + .5) * row_width, top - .006))
            obj = bpy.context.object
            obj.name = 'Oak_Plank'
            obj.dimensions = (right - left - gap, row_width - gap, .012)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            obj.data.materials.append(rng.choice(materials))
            bevel = obj.modifiers.new('Real_Rounded_Plank_Edges', 'BEVEL')
            bevel.width = .0018
            bevel.segments = 2
            bpy.ops.object.modifier_apply(modifier=bevel.name)
            planks.append(obj)
        start += length
bpy.ops.object.select_all(action='DESELECT')
for obj in planks:
    obj.select_set(True)
bpy.context.view_layer.objects.active = planks[0]
bpy.ops.object.join()
floor = bpy.context.object
floor.name = 'Floor'
floor['finish'] = 'Solid beveled oak planks; no painted grain or seam texture'
floor['plank_count'] = len(planks)
asset = [o for o in bpy.context.scene.objects if o.type == 'MESH']
front = bpy.data.objects['Wall_Front']
front.hide_set(False)
front.hide_render = False
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-solid-planks.glb'), export_format='GLB',
                          use_selection=True, export_extras=True)
front.hide_render = True
front.hide_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-solid-planks.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'floor': 'Real plank geometry, tiny joints, rounded edges, six quiet oak colors',
    'plank_count': len(planks), 'walking_height_unchanged': top,
    'preserved': ['Walls', 'Cement entrance and black fade', 'Room footprint', 'All four walls for rotation'],
    'source': 'room-cement-entry-v1/Room-cement-entry.blend'
}, indent=2), encoding='utf-8')
