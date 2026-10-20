"""Warm ivory woven wallpaper, exported as an embedded image for all four walls."""
import bpy
import numpy as np
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-office-floor-v2' / 'Room-office-floor.blend'))
n = 512
y, x = np.mgrid[0:n, 0:n].astype(np.float32)
rng = np.random.default_rng(20261020)
weave = .002 * np.sin(x * np.pi) + .002 * np.sin(y * np.pi / 2)
weave += rng.normal(0, .0015, (n, n)).astype(np.float32)
rgba = np.ones((n, n, 4), dtype=np.float32)
for i, color in enumerate((.79, .735, .63)):
    rgba[:, :, i] = color + weave
image = bpy.data.images.new('Warm_Ivory_Woven_Wallpaper', width=n, height=n, alpha=False)
image.pixels.foreach_set(rgba.ravel())
image.filepath_raw = str(ROOT / 'ivory-wallpaper.png')
image.file_format = 'PNG'
image.save()
image.pack()
walls = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('Wall_')]
assert len(walls) == 4
for wall in walls:
    mat = bpy.data.materials.new(wall.name + '_Warm_Ivory_Wallpaper')
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = .96
    shader.inputs['Specular IOR Level'].default_value = .16
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = image
    mat.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
    mat.diffuse_color = (.79, .735, .63, 1)
    wall.data.materials.clear()
    wall.data.materials.append(mat)
    wall['finish'] = 'Warm ivory matte wallpaper with very quiet woven fibers'
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
front = bpy.data.objects['Wall_Front']
front.hide_set(False)
front.hide_render = False
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-ivory-wallpaper.glb'), export_format='GLB',
                          use_selection=True, export_extras=True)
front.hide_render = True
front.hide_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-ivory-wallpaper.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'walls': [o.name for o in walls], 'finish': 'Warm ivory matte woven wallpaper',
    'preserved': ['Office plank floor', 'Cement entrance fade', 'Geometry', 'Walking height'],
    'texture': 'Embedded 512px subtle weave; common image, independently editable wall materials'
}, indent=2), encoding='utf-8')
