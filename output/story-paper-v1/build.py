"""One thin reusable application sheet, Blender 5.2; no text or stamp."""
import bpy
import bmesh
import math
import json
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = .9
    return mat


paper_mat = material('Paper_Cream', (.87, .79, .63))
ink_mat = material('Print_Muted_Gray', (.32, .34, .29))
root = bpy.data.objects.new('StoryApplicationPaper', None)
bpy.context.collection.objects.link(root)
WIDTH, LENGTH, THICKNESS = .29, .41, .0008


def rounded_outline(cx, cy, width, length, radius):
    result = []
    for x, y, start in [(cx + width / 2 - radius, cy + length / 2 - radius, 0),
                        (cx - width / 2 + radius, cy + length / 2 - radius, 90),
                        (cx - width / 2 + radius, cy - length / 2 + radius, 180),
                        (cx + width / 2 - radius, cy - length / 2 + radius, 270)]:
        for i in range(9):
            a = math.radians(start + i * 90 / 8)
            result.append((x + radius * math.cos(a), y + radius * math.sin(a)))
    return result


def mesh_object(name, verts, faces, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = root
    mesh.materials.append(mat)
    return obj


outline = rounded_outline(0, 0, WIDTH, LENGTH, .006)
n = len(outline)
verts = [(x, y, z) for z in (0, THICKNESS) for x, y in outline]
faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
faces += [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)]
sheet = mesh_object('Single_Paper_Sheet', verts, faces, paper_mat)
sheet['sheet_count'] = 1
sheet['thickness_H'] = THICKNESS

# Ink is flat geometry 0.00001H above the front, not raised lettering.
print_verts, print_faces = [], []


def print_polygon(points):
    start = len(print_verts)
    print_verts.extend((x, y, THICKNESS + .00001) for x, y in points)
    print_faces.append(tuple(range(start, len(print_verts))))


def line(left, y, width, height):
    print_polygon(rounded_outline(left + width / 2, y, width, height, height / 2))


line(-.105, .145, .120, .009)
line(-.105, .110, .210, .008)
line(-.105, .084, .145, .005)
line(-.105, .063, .110, .005)
# One continuous blank input box.
outer = [(-.106, -.054), (.106, -.054), (.106, .027), (-.106, .027)]
inner = [(-.102, -.050), (.102, -.050), (.102, .023), (-.102, .023)]
for i in range(4):
    j = (i + 1) % 4
    print_polygon([outer[i], outer[j], inner[j], inner[i]])
line(-.105, -.112, .160, .004)
line(-.105, -.139, .112, .003)
printing = mesh_object('Generic_Form_Print', print_verts, print_faces, ink_mat)
printing['purpose'] = 'Shared resident / bank account / stock account form; no baked title'
anchor = bpy.data.objects.new('Form_Front_Anchor', None)
bpy.context.collection.objects.link(anchor)
anchor.parent = root
anchor.location.z = THICKNESS + .00002
assets = [root, sheet, printing, anchor]

bm = bmesh.new()
bm.from_mesh(sheet.data)
assert all(e.is_manifold for e in bm.edges)
assert bm.calc_volume(signed=True) > 0
bm.free()
assert all(math.isfinite(c) for obj in (sheet, printing) for v in obj.data.vertices for c in v.co)
bpy.ops.object.select_all(action='DESELECT')
for obj in assets:
    obj.select_set(True)
bpy.context.view_layer.objects.active = sheet
glb = OUT / 'StoryApplicationPaper.glb'
bpy.ops.export_scene.gltf(filepath=str(glb), export_format='GLB',
                          use_selection=True, export_extras=True)
before = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(glb))
imported = list(set(bpy.context.scene.objects) - before)
meshes = [o for o in imported if o.type == 'MESH']
assert len(meshes) == 2
points = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
dims = [max(p[a] for p in points) - min(p[a] for p in points) for a in range(3)]
assert all(abs(a - b) < .000001 for a, b in zip(dims, [WIDTH, LENGTH, THICKNESS + .00001]))
for obj in imported:
    bpy.data.objects.remove(obj, do_unlink=True)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 1100
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('Studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.78, .75, .69, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .4
scene.view_settings.view_transform = 'AgX'
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.0001))
bpy.context.object.name = 'Studio_Only_Ground'
bpy.context.object.data.materials.append(material('Studio_Background', (.67, .63, .55)))
target = Vector((0, 0, 0))
for location, energy, size in [((-1, -1.5, 2), 100, 1.5), ((1, .8, 2), 40, 1.5)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy, light.data.size = energy, size
    light.rotation_euler = (target - light.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = 'ORTHO'
camera.data.ortho_scale = .57
scene.camera = camera


def render(name, position):
    camera.location = position
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(OUT / name)
    bpy.ops.render.render(write_still=True)


render('preview.png', (.38, -.68, 1.05))
render('front.png', (0, 0, 1))
render('edge.png', (.30, -.65, .18))
# Studio stays only in .blend, not GLB; default opens at useful preview angle.
camera.location = (.38, -.68, 1.05)
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'StoryApplicationPaper.blend'))
triangles = {}
for obj in (sheet, printing):
    obj.data.calc_loop_triangles()
    triangles[obj.name] = len(obj.data.loop_triangles)
manifest = dict(status='P1: model/roundtrip checked; visual acceptance and gameplay contact pending',
    sheet_count=1, dimensions_blender_H=dims, size_status='Provisional H=1 character-relative unit',
    root_origin='Bottom surface center, lying flat; front +Z, form heading +Y in Blender',
    glTF_axes='Y-up; form front +Y, form heading -Z',
    uses=['resident application', 'bank account application', 'stock account application'],
    printed_content='Generic lines, blank field and signature line; no title, stamp, name or signature',
    textures='None; print uses flat coplanar-style geometry with 0.00001H separation',
    triangles=triangles, glb_bytes=glb.stat().st_size,
    validation='Closed positive-volume sheet; finite coordinates; GLB reimport 2 meshes and bounds passed',
    game_installed=False)
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('PAPER_COMPLETE', json.dumps(manifest))
