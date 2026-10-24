"""Rounded black story phone, editable Blender meshes and standalone GLB."""
import bpy
import bmesh
import json
import math
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, value, roughness):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (value, value, value, 1)
    mat.use_nodes = True
    node = mat.node_tree.nodes['Principled BSDF']
    node.inputs['Base Color'].default_value = mat.diffuse_color
    node.inputs['Roughness'].default_value = roughness
    return mat


case_mat = material('Case_Matte_Black', .006, .64)
bezel_mat = material('Bezel_Black', .008, .63)
glass_mat = material('Screen_Off_Black_Glass', .0008, .28)
glass_mat.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = .23
dark_mat = material('Speaker_Black', .002, .95)
ring_mat = material('Camera_Dark_Gray_Rim', .038, .5)
lens_mat = material('Camera_Black_Lens', .004, .19)
root = bpy.data.objects.new('StorySmartphone', None)
bpy.context.collection.objects.link(root)
assets = [root]


def finish(obj, name, mat, bevel=0):
    obj.name = name
    obj.parent = root
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    if bevel:
        mod = obj.modifiers.new('Soft_Edges', 'BEVEL')
        mod.width, mod.segments = bevel, 5
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for face in obj.data.polygons:
        face.use_smooth = True
    normals = obj.modifiers.new('Weighted_Surface_Normals', 'WEIGHTED_NORMAL')
    normals.keep_sharp = True
    bpy.ops.object.modifier_apply(modifier=normals.name)
    assets.append(obj)
    return obj


def slab(name, width, height, depth, radius, x, y, z, mat, bevel=.001):
    # CCW silhouette in X/Z, closed extrusion along Y.
    outline = []
    for cx, cz, start in [(width / 2 - radius, height / 2 - radius, 0),
                          (-width / 2 + radius, height / 2 - radius, 90),
                          (-width / 2 + radius, -height / 2 + radius, 180),
                          (width / 2 - radius, -height / 2 + radius, 270)]:
        for i in range(13):
            a = math.radians(start + i * 90 / 12)
            outline.append((cx + radius * math.cos(a), cz + radius * math.sin(a)))
    n = len(outline)
    verts = [(px, py, pz) for py in (-depth / 2, depth / 2) for px, pz in outline]
    faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))]
    faces += [(i, i + n, (i + 1) % n + n, (i + 1) % n) for i in range(n)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (x, y, z)
    return finish(obj, name, mat, bevel)


case = slab('Case_Rounded_Black', .18, .32, .029, .030, 0, 0, .16, case_mat, .006)
bezel = slab('Front_Black_Bezel', .164, .303, .006, .024, 0, -.010, .16, bezel_mat, .001)


def recess(obj, name, width, height, radius, y, z, depth):
    cutter = slab(name, width, height, depth, radius, 0, y, z, case_mat, 0)
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new(name, 'BOOLEAN')
    mod.operation, mod.solver, mod.object = 'DIFFERENCE', 'EXACT', cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    assets.remove(cutter)
    bpy.data.objects.remove(cutter, do_unlink=True)
    edge = obj.modifiers.new('Recess_Edge_Soften', 'BEVEL')
    edge.width, edge.segments = .00035, 3
    bpy.ops.object.modifier_apply(modifier=edge.name)


recess(case, 'Bezel_Seat', .167, .306, .0255, -.018, .16, .018)
recess(bezel, 'Screen_Seat', .146, .250, .013, -.016, .149, .014)
screen = slab('Screen_Off', .1458, .2498, .002, .0129, 0, -.011, .149, glass_mat, .00025)
slab('Earpiece_Dark_Rim', .034, .006, .001, .0028, 0, -.013, .294, case_mat, .00025)
slab('Earpiece', .030, .0025, .0006, .0012, 0, -.0135, .294, dark_mat, .00015)


def button(name, location, size):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, case_mat, .0024)


button('Side_Power_Button', (.09, 0, .207), (.005, .011, .043))
button('Side_Volume_Button', (-.09, 0, .228), (.005, .011, .051))


def camera_disk(name, radius, depth, y, mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=radius, depth=depth,
        end_fill_type='NGON', location=(-.047, y, .274), rotation=(math.pi / 2, 0, 0))
    obj = bpy.context.object
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return finish(obj, name, mat, .0006)


camera_disk('Camera_Socket', .017, .004, .015, case_mat)
camera_disk('Camera_Rim', .0135, .0025, .017, ring_mat)
camera_disk('Camera_Lens', .0106, .0014, .0183, lens_mat)
anchor = bpy.data.objects.new('Screen_Front_Anchor', None)
bpy.context.collection.objects.link(anchor)
anchor.parent = root
anchor.location = (0, -.01205, .149)
anchor['purpose'] = 'Future screen overlay center; no UI, light or apps included'
assets.append(anchor)
report = []
for obj in assets:
    if obj.type != 'MESH':
        continue
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    assert all(e.is_manifold for e in bm.edges), obj.name
    assert bm.calc_volume(signed=True) > 0, obj.name
    assert all(math.isfinite(c) for v in obj.data.vertices for c in v.co)
    obj.data.calc_loop_triangles()
    report.append(dict(name=obj.name, triangles=len(obj.data.loop_triangles), non_manifold_edges=0))
    bm.free()
bpy.ops.object.select_all(action='DESELECT')
for obj in assets:
    obj.select_set(True)
bpy.context.view_layer.objects.active = screen
glb = OUT / 'StorySmartphone.glb'
bpy.ops.export_scene.gltf(filepath=str(glb), export_format='GLB', use_selection=True, export_extras=True)
before = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(glb))
imported = list(set(bpy.context.scene.objects) - before)
meshes = [o for o in imported if o.type == 'MESH']
assert len(meshes) == len(report)
assert any(o.name.startswith('Screen_Front_Anchor') for o in imported)
points = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
dims = [max(p[a] for p in points) - min(p[a] for p in points) for a in range(3)]
assert abs(dims[2] - .32) < .0001 and .18 < dims[0] < .19
for obj in imported:
    bpy.data.objects.remove(obj, do_unlink=True)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 40
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('Warm_Studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.78, .75, .69, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .22
scene.view_settings.view_transform = 'AgX'
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.0002))
bpy.context.object.name = 'Studio_Only_Ground'
ground = material('Studio_Ivory', .72, .9)
ground.diffuse_color = (.82, .76, .64, 1)
ground.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = ground.diffuse_color
bpy.context.object.data.materials.append(ground)
target = Vector((0, 0, .16))
for location, energy, size in [((-.8, -.3, 1.1), 32, .7), ((.7, .7, .8), 22, .6)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    lamp = bpy.context.object
    lamp.data.energy, lamp.data.size = energy, size
    lamp.rotation_euler = (target - lamp.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = 'ORTHO'
camera.data.ortho_scale = .43
scene.camera = camera


def render(name, location):
    camera.location = location
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(OUT / name)
    bpy.ops.render.render(write_still=True)


render('preview.png', (.30, -.95, .39))
render('back.png', (-.48, .95, .49))
render('front.png', (0, -1, .17))
render('side.png', (1, -.06, .23))
camera.location = (.30, -.95, .39)
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'StorySmartphone.blend'))
manifest = dict(status='P1: model and roundtrip checked; acceptance and gameplay contact pending',
    dimensions_blender_H=dims, size_status='Provisional H=1; case width .18H, height .32H, depth .029H',
    origin='Bottom center; Blender up +Z, front -Y; glTF up +Y, front +Z',
    materials='Neutral black case and screen; rough matte case, subtle glass reflection; no emission',
    screen='Off; no icons, text, logos or UI', meshes=report, glb_bytes=glb.stat().st_size,
    validation='Finite coordinates, closed positive-volume meshes, GLB mesh/anchor/bounds roundtrip passed',
    game_installed=False)
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('SMARTPHONE_COMPLETE', json.dumps(manifest))
