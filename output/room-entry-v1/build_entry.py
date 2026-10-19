"""Black surround, removable front wall, and a short fading entrance floor."""
import bpy
import json
import math
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'room-white-oak-v1' / 'Room-white-oak.blend'))
p = json.loads((ROOT.parent / 'room-clean-v2' / 'parameters.json').read_text())
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
before = {o.name: [tuple(v.co) for v in o.data.vertices] for o in parts}
front = bpy.data.objects['Wall_Front']
front.hide_render = True
front.hide_set(True)
front['visibility_note'] = 'Hidden for interior camera; retained for editing and collision design'

left, right = p['door_left'], p['door_right']
start = -p['z_max']
depth = .38
height = p['bottom'] + p['floor_thickness']
# Continue the same world-space plank pattern across the threshold.
source = bpy.data.images.get('Light_Oak_Planks')
pixels = np.array(source.pixels[:], dtype=np.float32).reshape(source.size[1], source.size[0], 4)
w, h = 256, 512
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
world_x = left + xx / (w - 1) * (right - left)
world_y = start - yy / (h - 1) * depth
u = (world_x - p['x_min']) / (p['x_max'] - p['x_min'])
v = (world_y + p['z_max']) / (p['z_max'] - p['z_min'])
rgba = pixels[(v % 1 * source.size[1]).astype(int) % source.size[1],
              (u % 1 * source.size[0]).astype(int) % source.size[0]].copy()
progress = yy / (h - 1)
fade = np.clip((progress - .08) / .92, 0, 1)
rgba[:, :, :3] *= (1 - fade * fade * (3 - 2 * fade))[:, :, None]
rgba[:, :, 3] = 1
image = bpy.data.images.new('Entrance_Oak_Fade', width=w, height=h, alpha=False)
image.pixels.foreach_set(rgba.ravel())
image.filepath_raw = str(ROOT / 'entrance-oak-fade.png')
image.file_format = 'PNG'
image.save()
image.pack()
mesh = bpy.data.meshes.new('Entrance_Floor_Mesh')
mesh.from_pydata([(left, start, height), (right, start, height),
                  (right, start - depth, height), (left, start - depth, height)],
                 [], [(3, 2, 1, 0)])
mesh.update()
uv = mesh.uv_layers.new(name='UVMap')
coords = [(0, 0), (1, 0), (1, 1), (0, 1)]
for loop in mesh.loops:
    uv.data[loop.index].uv = coords[loop.vertex_index]
entry = bpy.data.objects.new('Entrance_Floor', mesh)
bpy.context.collection.objects.link(entry)
mat = bpy.data.materials.new('Entrance_Oak_Fade_Material')
mat.use_nodes = True
shader = mat.node_tree.nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value = .9
shader.inputs['Specular IOR Level'].default_value = 0
tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = image
tex.extension = 'EXTEND'
mat.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
entry.data.materials.append(mat)
entry['purpose'] = 'Short entrance walkway; visual fade only, no scene transition implemented'

scene = bpy.context.scene
scene.render.film_transparent = False
# Pure black for camera rays while retaining soft room illumination.
world = scene.world
world.use_nodes = True
nodes = world.node_tree.nodes
nodes.clear()
output = nodes.new('ShaderNodeOutputWorld')
ambient = nodes.new('ShaderNodeBackground')
ambient.inputs['Color'].default_value = (.45, .45, .45, 1)
ambient.inputs['Strength'].default_value = .5
black = nodes.new('ShaderNodeBackground')
black.inputs['Color'].default_value = (0, 0, 0, 1)
path = nodes.new('ShaderNodeLightPath')
mix = nodes.new('ShaderNodeMixShader')
links = world.node_tree.links
links.new(path.outputs['Is Camera Ray'], mix.inputs[0])
links.new(ambient.outputs[0], mix.inputs[1])
links.new(black.outputs[0], mix.inputs[2])
links.new(mix.outputs[0], output.inputs['Surface'])
cam = scene.camera
cam.location = (.9, -4, 2.7)
target = Vector((0, -.08, -.03))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.ortho_scale = 3.05
scene.render.resolution_x = 1200
scene.render.resolution_y = 1000
scene.cycles.samples = 48
scene.render.filepath = str(ROOT / 'room-entry-preview.png')
for obj in parts:
    assert before[obj.name] == [tuple(v.co) for v in obj.data.vertices]
bpy.ops.object.select_all(action='DESELECT')
for obj in parts + [entry]:
    if obj != front:
        obj.select_set(True)
bpy.context.view_layer.objects.active = entry
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-entry-cutaway.glb'),
                          use_selection=True, export_format='GLB', export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-entry.blend'))
bpy.ops.render.render(write_still=True)
(ROOT / 'manifest.json').write_text(json.dumps({
    'base_geometry_unchanged': True, 'front_wall': 'Retained hidden in blend; omitted from cutaway GLB',
    'background': 'Black camera background in Blender; configure renderer clear color black when loading GLB',
    'entrance_width': right - left, 'entrance_depth': depth,
    'entrance_position': [left, right, p['z_max']],
    'materials': 'Existing white wallpaper and oak preserved; matching entrance planks fade to black',
    'scope': 'Asset and preview only; game integration and exit trigger not implemented',
}, indent=2), encoding='utf-8')
