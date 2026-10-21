"""Reference-inspired light lower molding painted into the existing ivory wallpaper."""
import bpy
import numpy as np
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-painted-molding-v2' / 'Room-painted-molding.blend'))
p = json.loads((ROOT.parent / 'room-clean-v2' / 'parameters.json').read_text())
wall_height = p['top'] - p['bottom'] - p['floor_thickness']
walls = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('Wall_')]
old = next(n.image for n in walls[0].data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE')
w, h = old.size
pixels = np.array(old.pixels[:], dtype=np.float32).reshape(h, w, 4)
height = np.arange(h, dtype=np.float32) / (h - 1) * wall_height
# A broad light ivory strip capped by a narrow muted beige boundary; no checks.
for row, z in enumerate(height):
    if z < .042:
        shade = -.018 if z < .002 else (.018 if z > .039 else 0)
        pixels[row, :, :3] = np.array((.86, .815, .72)) + shade
    elif z < .044:
        pixels[row, :, :3] = (.58, .535, .44)
    elif z < .047:
        pixels[row, :, :3] = (.82, .77, .665)
image = bpy.data.images.new('Ivory_Wallpaper_Light_Lower_Molding', width=w, height=h, alpha=False)
image.pixels.foreach_set(pixels.ravel())
image.filepath_raw = str(ROOT / 'wallpaper-light-molding.png')
image.file_format = 'PNG'
image.save()
image.pack()
for wall in walls:
    next(n for n in wall.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE').image = image
    wall['finish'] = 'Existing ivory wallpaper, light lower molding strip with thin boundary painted in 2D'
assert not any(o.get('purpose', '').startswith('Decorative trim') for o in bpy.context.scene.objects)
front = bpy.data.objects['Wall_Front']
front.hide_set(False)
front.hide_render = False
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-light-molding.glb'), export_format='GLB',
                          use_selection=True, export_extras=True)
front.hide_render = True
front.hide_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-light-molding.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'reference': 'Wallpaper-roll reference: lower light molding and thin boundary only',
    'change': 'Lower molding painted light ivory with a thin beige boundary',
    'preserved': ['Existing ivory wall color and texture', 'Upper molding', 'Solid floor', 'Cement entry'],
    'no_checks': True, 'no_solid_trim': True
}, indent=2), encoding='utf-8')
