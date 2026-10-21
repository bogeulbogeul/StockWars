"""Use the settlement office's actual plank materials and scaled board dimensions."""
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
reference = ROOT.parent / 'information-floor-edge-v1' / 'Office-floor-edge-preview.blend'
with bpy.data.libraries.load(str(reference), link=False) as (available, loaded):
    loaded.materials = sorted(name for name in available.materials if name.startswith('Office_Plank_'))
materials = loaded.materials
assert len(materials) == 4
unit_scale = (x1 - x0) / 8
thickness = .022 * unit_scale
# A matching substrate keeps joints shallow and prevents black cracks.
for vertex in floor.data.vertices:
    vertex.co.z = top - thickness if vertex.co.z > top - .0005 else top - thickness - .003
floor.data.materials.clear()
floor.data.materials.append(materials[0])
planks = []
rows = 20
row_width = (y1 - y0) / rows
length = 1.95 * unit_scale
gap = .005 * unit_scale
for row in range(rows):
    start = x0 - (row % 3) * .64 * unit_scale
    column = 0
    while start < x1:
        left, right = max(x0, start), min(x1, start + length)
        if right - left > gap * 2:
            bpy.ops.mesh.primitive_cube_add(size=1, location=((left + right) / 2,
                y0 + (row + .5) * row_width, top - thickness / 2))
            obj = bpy.context.object
            obj.name = 'Oak_Plank'
            obj.dimensions = (right - left - gap, row_width - gap, thickness)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            obj.data.materials.append(materials[(row + column) % 4])
            bevel = obj.modifiers.new('Real_Rounded_Plank_Edges', 'BEVEL')
            bevel.width = .001 * unit_scale
            bevel.segments = 2
            bpy.ops.object.modifier_apply(modifier=bevel.name)
            planks.append(obj)
        start += length
        column += 1
bpy.ops.object.select_all(action='DESELECT')
for obj in planks + [floor]:
    obj.select_set(True)
bpy.context.view_layer.objects.active = planks[0]
bpy.ops.object.join()
floor = bpy.context.object
floor.name = 'Floor'
floor['finish'] = 'Settlement office matching honey plank materials, proportions and shallow joints'
floor['plank_count'] = len(planks)
asset = [o for o in bpy.context.scene.objects if o.type == 'MESH']
front = bpy.data.objects['Wall_Front']
front.hide_set(False)
front.hide_render = False
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-office-floor.glb'), export_format='GLB',
                          use_selection=True, export_extras=True)
front.hide_render = True
front.hide_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-office-floor.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'floor': 'Actual four Office_Plank materials and scaled office board dimensions',
    'reference': str(reference),
    'plank_count': len(planks), 'walking_height_unchanged': top,
    'preserved': ['Walls', 'Cement entrance and black fade', 'Room footprint', 'All four walls for rotation'],
    'source': 'room-cement-entry-v1/Room-cement-entry.blend'
}, indent=2), encoding='utf-8')
