"""Change only entrance material while retaining room geometry and presentation."""
import bpy
import json
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'room-entry-v1' / 'Room-entry.blend'))
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
before = {o.name: [tuple(v.co) for v in o.data.vertices] for o in parts}
unchanged_materials = {o.name: o.data.materials[0] for o in parts if o.name != 'Entrance_Floor'}
entry = bpy.data.objects['Entrance_Floor']
w, h = 256, 512
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
rng = np.random.default_rng(20261019)
grain = rng.normal(0, .004, (h, w)).astype(np.float32)
cloud = .004 * np.sin(xx / 27 + np.sin(yy / 49)) * np.cos(yy / 39)
progress = yy / (h - 1)
fade = np.clip((progress - .08) / .92, 0, 1)
fade = 1 - fade * fade * (3 - 2 * fade)
rgba = np.ones((h, w, 4), dtype=np.float32)
for channel, base in enumerate((.56, .54, .505)):
    rgba[:, :, channel] = np.clip(base + grain + cloud, 0, 1) * fade
image = bpy.data.images.new('Warm_Gray_Cement_Fade', width=w, height=h, alpha=False)
image.pixels.foreach_set(rgba.ravel())
image.filepath_raw = str(ROOT / 'cement-entry-fade.png')
image.file_format = 'PNG'
image.save()
image.pack()
mat = bpy.data.materials.new('Entrance_Warm_Gray_Matte_Cement')
mat.use_nodes = True
shader = mat.node_tree.nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value = 1
shader.inputs['Specular IOR Level'].default_value = 0
tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = image
tex.extension = 'EXTEND'
mat.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
entry.data.materials.clear()
entry.data.materials.append(mat)
entry['finish'] = 'Warm gray matte cement, fine surface grain, fade to black at end'
for obj in parts:
    assert before[obj.name] == [tuple(v.co) for v in obj.data.vertices]
    if obj.name != 'Entrance_Floor':
        assert obj.data.materials[0] == unchanged_materials[obj.name]
front = bpy.data.objects['Wall_Front']
assert front.hide_render and front.hide_get()
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    if obj != front:
        obj.select_set(True)
bpy.context.view_layer.objects.active = entry
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-cement-entry.glb'),
                          use_selection=True, export_format='GLB', export_extras=True)
scene = bpy.context.scene
scene.render.filepath = str(ROOT / 'preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-cement-entry.blend'))
bpy.ops.render.render(write_still=True)
(ROOT / 'manifest.json').write_text(json.dumps({
    'change': 'Entrance material only: warm gray matte cement with subtle grain',
    'verified': 'All mesh positions and non-entrance materials unchanged; front wall remains hidden',
    'preserved': ['White wallpaper', 'Oak floor', 'Black camera background', 'Entrance end fade', 'Camera and lighting'],
    'scope': 'Model and preview; not installed in game',
}, indent=2), encoding='utf-8')
