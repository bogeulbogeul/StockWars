"""Replace the stacked fascia/backing with one continuous flush roof-edge band."""
import bpy
import bmesh
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'home-sealed-edges-v5' / 'Home-sealed.blend'))
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('Home_Continuous_Mitered_Eaves', 'Home_Sealed_Tile_Underside')):
        bpy.data.objects.remove(obj, do_unlink=True)
outline = [(-1.265 + 2.53 * i / 48, -1.005) for i in range(49)]
outline += [(1.265 - 2.53 * i / 48, 1.005) for i in range(49)]
vertices, faces = [], []
for x, y in outline:
    roof = 1.25 + .67 * max(0, math.cos(abs(x / 1.265) * math.pi / 2)) ** 1.18
    ix, iy = x * 1.195 / 1.265, y * .935 / 1.005
    vertices.extend([(x, y, roof - .005), (ix, iy, roof - .005),
                     (x, y, roof - .115), (ix, iy, roof - .115)])
for i in range(len(outline)):
    a, b = i * 4, ((i + 1) % len(outline)) * 4
    faces.extend([(a, b, b + 1, a + 1), (a + 2, a + 3, b + 3, b + 2),
                  (a, a + 2, b + 2, b), (a + 1, b + 1, b + 3, a + 3)])
mesh = bpy.data.meshes.new('Home_Single_Flush_Eaves_Mesh')
mesh.from_pydata(vertices, [], faces)
bm = bmesh.new()
bm.from_mesh(mesh)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
assert all(edge.is_manifold for edge in bm.edges)
bm.to_mesh(mesh)
bm.free()
obj = bpy.data.objects.new('Home_Continuous_Mitered_Eaves', mesh)
bpy.context.collection.objects.link(obj)
obj.data.materials.append(bpy.data.materials['Home_Honey_Wood'])
obj['preview_only'] = False
bpy.context.view_layer.objects.active = obj
bevel = obj.modifiers.new('Soft_Edges', 'BEVEL')
bevel.width = .006
bevel.segments = 3
bpy.ops.object.modifier_apply(modifier=bevel.name)
normal = obj.modifiers.new('Planar_Normals', 'WEIGHTED_NORMAL')
normal.keep_sharp = True
bpy.ops.object.modifier_apply(modifier=normal.name)
asset = [o for o in bpy.context.scene.objects if not o.get('preview_only', False)]
bpy.ops.object.select_all(action='DESELECT')
for part in asset:
    part.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Home-single-eaves.glb'), export_format='GLB', use_selection=True)
scene, cam = bpy.context.scene, bpy.context.scene.camera
for name, offset, target, scale in [
    ('eaves-detail', (3, -4, 2.7), (1.17, -.94, 1.30), .70),
    ('front-right', (4, -6, 2.4), (0, -.03, 1.10), 3.6),
]:
    point = Vector(target)
    cam.location = point + Vector(offset)
    cam.rotation_euler = (point - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.ortho_scale = scale
    scene.render.filepath = str(ROOT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Home-single-eaves.blend'))
(ROOT / 'manifest.json').write_text(json.dumps({
    'change': 'Single taller flush fascia closes underside without stacked backing ledge',
    'preserved': ['Sealed doorway threshold', 'Recessed window bars', 'Roof tiles and palette'],
    'validation': 'Closed manifold eaves before bevel; no separate underside backing objects'
}, indent=2), encoding='utf-8')
