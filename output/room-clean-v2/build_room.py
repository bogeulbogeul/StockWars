"""Rebuild a parameterized room shell in Blender. Coordinates below are glTF Y-up."""
import bpy
import json
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
SOURCE = Path(r'C:\Users\bogeu\Downloads\Room.glb')
raw = SOURCE.read_bytes()
length = struct.unpack_from('<I', raw, 12)[0]
source_doc = json.loads(raw[20:20 + length])
source_bounds = source_doc['accessors'][0]
defaults = {
    'x_min': source_bounds['min'][0], 'x_max': source_bounds['max'][0],
    'z_min': source_bounds['min'][2], 'z_max': source_bounds['max'][2],
    'bottom': source_bounds['min'][1], 'top': source_bounds['max'][1],
    'wall_thickness': 0.071, 'floor_thickness': 0.001,
    'door_left': -0.162, 'door_right': 0.209, 'door_top': 0.2375,
}
parameter_file = ROOT / 'parameters.json'
if not parameter_file.exists():
    parameter_file.write_text(json.dumps(defaults, indent=2), encoding='utf-8')
p = json.loads(parameter_file.read_text(encoding='utf-8'))
bpy.ops.wm.read_factory_settings(use_empty=True)

def material(name):
    mat = bpy.data.materials.new(name + '_Material')
    mat.diffuse_color = (0.8, 0.8, 0.8, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = mat.diffuse_color
    shader.inputs['Roughness'].default_value = 1
    return mat

def finish(name, vertices, faces):
    mesh = bpy.data.meshes.new(name + '_Mesh')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material(name))
    # Planar UVs in common model units, ready for wall/floor textures.
    uv = mesh.uv_layers.new(name='UVMap')
    for face in mesh.polygons:
        axis = max(range(3), key=lambda a: abs(face.normal[a]))
        axes = [a for a in range(3) if a != axis]
        for loop_id in face.loop_indices:
            v = mesh.vertices[mesh.loops[loop_id].vertex_index].co
            uv.data[loop_id].uv = (v[axes[0]], v[axes[1]])
    obj['part'] = name
    obj['parameter_source'] = 'parameters.json (glTF Y-up)'
    return obj

def box(name, x0, x1, y0, y1, h0, h1):
    verts = [(x, y, h) for h in (h0, h1) for y in (y0, y1) for x in (x0, x1)]
    return finish(name, verts, [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4),
                               (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)])

x0, x1 = p['x_min'], p['x_max']
# glTF +Z front becomes Blender -Y.
y0, y1 = -p['z_max'], -p['z_min']
t = p['wall_thickness']
h0, h1 = p['bottom'] + p['floor_thickness'], p['top']
parts = [box('Floor', x0, x1, y0, y1, p['bottom'], h0),
         box('Wall_Left', x0, x0 + t, y0, y1, h0, h1),
         box('Wall_Right', x1 - t, x1, y0, y1, h0, h1),
         box('Wall_Back', x0 + t, x1 - t, y1 - t, y1, h0, h1)]
# One watertight U-shaped prism: doorway is genuinely open, no internal box faces.
outline = [(x0 + t, h0), (p['door_left'], h0),
           (p['door_left'], p['door_top']), (p['door_right'], p['door_top']),
           (p['door_right'], h0), (x1 - t, h0), (x1 - t, h1), (x0 + t, h1)]
verts = [(x, y, h) for y in (y0, y0 + t) for x, h in outline]
faces = [tuple(range(8)), tuple(reversed(range(8, 16)))]
faces.extend((i, i + 8, (i + 1) % 8 + 8, (i + 1) % 8) for i in range(8))
parts.append(finish('Wall_Front', verts, faces))

# Recalculate outward normals and verify closed solids before export.
import bmesh
for obj in parts:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    assert all(e.is_manifold for e in bm.edges), obj.name
    bm.to_mesh(obj.data)
    bm.free()
    obj.select_set(True)
    obj['flat_surfaces'] = True
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Room-clean.glb'), use_selection=True,
                          export_format='GLB', export_yup=True, export_extras=True)

# Validate overall bounds from reconstructed vertices, converted back to glTF.
coords = [(v.co.x, v.co.z, -v.co.y) for obj in parts for v in obj.data.vertices]
actual_min = [min(v[i] for v in coords) for i in range(3)]
actual_max = [max(v[i] for v in coords) for i in range(3)]
assert all(abs(actual_min[i] - source_bounds['min'][i]) < 1e-6 for i in range(3))
assert all(abs(actual_max[i] - source_bounds['max'][i]) < 1e-6 for i in range(3))
report = {'parts': [o.name for o in parts], 'bounds_min': actual_min,
          'bounds_max': actual_max, 'bounds_match_tolerance': 1e-6,
          'door': {k: p[k] for k in ('door_left', 'door_right', 'door_top')},
          'door_measurement': 'Straightened from dense original edge clusters; approximate within original surface noise',
          'validation': '5 closed manifold meshes; flat shading; separate materials; UVs; source bounds match',
          'floor_note': 'Thin 0.001 slab stays inside original bounds; walking surface is 0.001 above original minimum'}
(ROOT / 'manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')

bpy.ops.object.camera_add(location=(3, -4, 3))
cam = bpy.context.object
cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 3.4
scene = bpy.context.scene
scene.camera = cam
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'MATERIAL'
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.filepath = str(ROOT / 'preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Room-clean.blend'))
bpy.ops.render.render(write_still=True)
# Cutaway preview only: do not save visibility changes into deliverables.
for obj in parts:
    if obj.name in ('Wall_Front', 'Wall_Right'):
        obj.hide_render = True
scene.render.filepath = str(ROOT / 'interior-preview.png')
bpy.ops.render.render(write_still=True)
print(json.dumps(report, indent=2))
