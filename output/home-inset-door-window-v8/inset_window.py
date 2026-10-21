"""Recess the door glass behind a real opening and anchor crossbars into the rim."""
import bpy
import bmesh
import math
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'cipher-exterior-blender-v1'))
from exterior_geometry import box
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-window-cross-v7' / 'Home-window-clean.blend'))
rim = bpy.data.objects['Home_Door_Round_Window_Rim']
glass = bpy.data.objects['Home_Door_Round_Window_Glass']
wood = rim.data.materials[0]
cx, cz = .43, .77
# The old rim was a solid disk. Cut through both it and the door so the glass can sit behind.
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=.108, depth=.24,
    location=(cx, -.845, cz), rotation=(math.pi / 2, 0, 0))
cutter = bpy.context.object
for obj in [rim, bpy.data.objects['Home_Arched_Wood_Door']]:
    bpy.context.view_layer.objects.active = obj
    modifier = obj.modifiers.new('Real_Round_Glass_Opening', 'BOOLEAN')
    modifier.operation = 'DIFFERENCE'
    modifier.object = cutter
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    normal = obj.modifiers.new('Refresh_Cut_Surface_Normals', 'WEIGHTED_NORMAL')
    normal.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=normal.name)
bpy.data.objects.remove(cutter, do_unlink=True)
glass.location.y = -.825
# A wood-lined reveal connects the outer rim to the recessed pane.
vertices, faces, count = [], [], 96
for y in [-.872, -.824]:
    for radius in [.106, .118]:
        vertices += [(cx + radius * math.cos(2 * math.pi * i / count), y,
                      cz + radius * math.sin(2 * math.pi * i / count)) for i in range(count)]
for i in range(count):
    j = (i + 1) % count
    faces.extend([(i, j, count + j, count + i),
                  (2 * count + i, 3 * count + i, 3 * count + j, 2 * count + j),
                  (i, 2 * count + i, 2 * count + j, j),
                  (count + i, count + j, 3 * count + j, 3 * count + i)])
mesh = bpy.data.meshes.new('Door_Window_Reveal_Mesh')
mesh.from_pydata(vertices, [], faces)
bm = bmesh.new()
bm.from_mesh(mesh)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
assert all(edge.is_manifold for edge in bm.edges)
bm.to_mesh(mesh)
bm.free()
for polygon in mesh.polygons:
    if polygon.index % 4 in (2, 3):
        polygon.use_smooth = True
mesh.update()
reveal = bpy.data.objects.new('Home_Door_Window_Inner_Reveal', mesh)
bpy.context.collection.objects.link(reveal)
mesh.materials.append(wood)
reveal['preview_only'] = False
for name in ['Home_Door_Glass_Cross_V', 'Home_Door_Glass_Cross_H']:
    bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
vertical = box('Home_Door_Glass_Cross_V', (.014, .012, .236), (cx, -.875, cz), wood, .002)
horizontal = box('Home_Door_Glass_Cross_H', (.236, .012, .014), (cx, -.8765, cz), wood, .002)
for obj in [vertical, horizontal]:
    obj['preview_only'] = False
asset = [o for o in bpy.context.scene.objects if not o.get('preview_only', False)]
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Home-inset-window.glb'), export_format='GLB', use_selection=True)
scene, cam = bpy.context.scene, bpy.context.scene.camera
for name, target, offset, scale in [
    ('window-detail', (cx, -.86, cz), (1.8, -5, 1.3), .43),
    ('front-right', (0, -.03, 1.10), (4, -6, 2.4), 3.6),
]:
    point = Vector(target)
    cam.location = point + Vector(offset)
    cam.rotation_euler = (point - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.ortho_scale = scale
    scene.render.filepath = str(ROOT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Home-inset-window.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'glass_y': -.825, 'opening_radius': .108, 'crossbar_half_length': .118,
    'rim_outer_radius': .137, 'crossbars': 'Ends overlap wooden rim by .010',
    'fixes': ['Real opening through door and rim', 'Wood-lined inner reveal',
              'Recessed glass', 'Crossbars meet rim', 'Offset crossing faces to avoid central dot'],
    'preserved': 'House palette and all other exterior/interior features'
}, indent=2), encoding='utf-8')
