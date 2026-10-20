"""Continuous mitered eaves and window bars recessed to the glass plane."""
import bpy
import bmesh
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-plain-wall-v3' / 'Home-plain-wall.blend'))
# The underlying roof's side face shared the tile-end plane and caused dark seams.
for vertex in bpy.data.objects['Home_Curved_Roof_Base'].data.vertices:
    vertex.co.x *= .995
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('Home_Wood_Eaves', 'Home_Side_Wood_Eaves')):
        bpy.data.objects.remove(obj, do_unlink=True)
# A single closed fascia ring; front/side edges share vertices at all four corners.
outline = [(-1.265 + 2.53 * i / 48, -1.005) for i in range(49)]
outline += [(1.265 - 2.53 * i / 48, 1.005) for i in range(49)]
verts = []
for x, y in outline:
    height = 1.25 + .67 * max(0, math.cos(abs(x / 1.265) * math.pi / 2)) ** 1.18 - .035
    inner_x, inner_y = x * 1.195 / 1.265, y * .935 / 1.005
    verts.extend([(x, y, height), (inner_x, inner_y, height),
                  (x, y, height - .08), (inner_x, inner_y, height - .08)])
faces = []
for i in range(len(outline)):
    a, b = i * 4, ((i + 1) % len(outline)) * 4
    faces.extend([(a, b, b + 1, a + 1), (a + 2, a + 3, b + 3, b + 2),
                  (a, a + 2, b + 2, b), (a + 1, b + 1, b + 3, a + 3)])
mesh = bpy.data.meshes.new('Home_Continuous_Eaves_Mesh')
mesh.from_pydata(verts, [], faces)
bm = bmesh.new()
bm.from_mesh(mesh)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
assert all(e.is_manifold for e in bm.edges)
bm.to_mesh(mesh)
bm.free()
eaves = bpy.data.objects.new('Home_Continuous_Mitered_Eaves', mesh)
bpy.context.collection.objects.link(eaves)
eaves.data.materials.append(bpy.data.materials['Home_Honey_Wood'])
eaves['preview_only'] = False
bpy.context.view_layer.objects.active = eaves
bevel = eaves.modifiers.new('Soft_Continuous_Edges', 'BEVEL')
bevel.width = .006
bevel.segments = 3
bpy.ops.object.modifier_apply(modifier=bevel.name)
normal = eaves.modifiers.new('Planar_Normals', 'WEIGHTED_NORMAL')
normal.keep_sharp = True
bpy.ops.object.modifier_apply(modifier=normal.name)

recessed = []
for obj in bpy.context.scene.objects:
    if obj.name.startswith(('Home_Front_Window_Cross_', 'Home_Right_Window_Cross_')):
        # Window glass front is local Y=-.85. Thin bars sit 0.001 in front of it.
        # Local coordinates also handle the rotated side-window parent correctly.
        obj.location.y = -.860 if obj.name.endswith('_H') else -.859
        for v in obj.data.vertices:
            v.co.y *= .8
        recessed.append(obj.name)
assert len(recessed) == 4
asset = [o for o in bpy.context.scene.objects if not o.get('preview_only', False)]
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Home-refined.glb'), export_format='GLB', use_selection=True)
scene = bpy.context.scene
cam = scene.camera
for name, position in [('front-right', (4, -6, 3.5)), ('eaves-detail', (3, -4, 2.7)),
                       ('window-detail', (0, -6, 1.4))]:
    target = Vector((0, -.03, 1.10))
    cam.data.ortho_scale = 3.6
    if name == 'eaves-detail':
        target = Vector((1.17, -.94, 1.30))
        cam.data.ortho_scale = .7
    elif name == 'window-detail':
        target = Vector((-.54, -.86, .65))
        cam.data.ortho_scale = .85
    cam.location = target + Vector(position)
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(ROOT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
cam.data.ortho_scale = 3.6
cam.location = (4, -6, 3.5)
cam.rotation_euler = (Vector((0, -.03, 1.10)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Home-refined.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'eaves': 'One closed manifold mitered fascia; no overlapping cylindrical end caps',
    'window_bars': recessed, 'bar_local_y': -.859,
    'preserved': 'House colors, red tiles, smooth walls, door and window placement, entry and interior'
}, indent=2), encoding='utf-8')
