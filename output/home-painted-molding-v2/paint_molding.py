"""Paint flat wood molding bands directly into wallpaper; remove trim geometry."""
import bpy
import numpy as np
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-wood-molding-v1' / 'Room-wood-molding.blend'))
p = json.loads((ROOT.parent / 'room-clean-v2' / 'parameters.json').read_text())
bottom, top = p['bottom'] + p['floor_thickness'], p['top']
removed = []
for obj in list(bpy.context.scene.objects):
    if obj.get('purpose', '').startswith('Decorative trim'):
        removed.append(obj.name)
        bpy.data.objects.remove(obj, do_unlink=True)
assert len(removed) == 9
w, h = 1024, 512
y, x = np.mgrid[0:h, 0:w].astype(np.float32)
height = y / (h - 1) * (top - bottom)
rng = np.random.default_rng(20261020)
grain = rng.normal(0, .0015, (h, w)).astype(np.float32)
rgba = np.ones((h, w, 4), dtype=np.float32)
for channel, base in enumerate((.79, .735, .63)):
    rgba[:, :, channel] = base + grain
mask = (height < .035) | (height > top - bottom - .024)
for channel, wood in enumerate((.56, .38, .20)):
    rgba[:, :, channel][mask] = wood
# Quiet painted bevel highlights/shadows, all pixels on the original wall plane.
for edge, sign in [(.035, -1), (top - bottom - .024, 1)]:
    highlight = (height >= edge - .002) & (height < edge)
    shadow = (height >= edge) & (height < edge + .002)
    rgba[:, :, :3][highlight] += .028 * sign
    rgba[:, :, :3][shadow] -= .028 * sign
image = bpy.data.images.new('Ivory_Wallpaper_Painted_Molding', width=w, height=h, alpha=False)
image.pixels.foreach_set(rgba.ravel())
image.filepath_raw = str(ROOT / 'wallpaper-painted-molding.png')
image.file_format = 'PNG'
image.save()
image.pack()
walls = [o for o in bpy.context.scene.objects if o.name.startswith('Wall_') and o.type == 'MESH']
for wall in walls:
    mat = wall.data.materials[0]
    tex = next(n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE')
    tex.image = image
    tex.extension = 'EXTEND'
    uv = wall.data.uv_layers.active
    horizontal = 1 if wall.name in ('Wall_Left', 'Wall_Right') else 0
    values = [v.co[horizontal] for v in wall.data.vertices]
    start, end = min(values), max(values)
    for loop in wall.data.loops:
        co = wall.data.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = ((co[horizontal] - start) / (end - start), (co.z - bottom) / (top - bottom))
    wall['finish'] = 'Flat 2D wallpaper image including painted upper and lower molding'
front = bpy.data.objects['Wall_Front']
front.hide_set(False)
front.hide_render = False
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-painted-molding.glb'), export_format='GLB',
                          use_selection=True, export_extras=True)
front.hide_render = True
front.hide_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-painted-molding.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'removed_solid_trim_objects': removed, 'molding': 'Painted into wallpaper image, no protruding geometry',
    'preserved': ['Solid plank floor', 'Wall shape and doorway', 'Cement entrance fade'],
    'image': 'Embedded 1024x512 wallpaper with top and bottom wood bands'
}, indent=2), encoding='utf-8')
