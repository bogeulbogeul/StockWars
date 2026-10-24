"""Build a standalone story seed pot. Run with Blender --background --python."""
import bpy
import bmesh
import json
import math
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return mat


clay = material('Terracotta_Matte', (.55, .115, .028), .76)
earth = material('Soil_Dark_Brown', (.055, .024, .009), .95)
root = bpy.data.objects.new('StoryFlowerpot', None)
bpy.context.collection.objects.link(root)
root['size_status'] = 'Provisional H=1 normalized character scale; not installed'


def finish_mesh(name, vertices, faces, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.000001)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = root
    mesh.materials.append(mat)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def lathe(name, profile, mat):
    segments = 96
    vertices = [(r * math.cos(j * math.tau / segments),
                 r * math.sin(j * math.tau / segments), z)
                for r, z in profile for j in range(segments)]
    faces = []
    for i in range(len(profile) - 1):
        for j in range(segments):
            faces.append((i * segments + j, i * segments + (j + 1) % segments,
                          (i + 1) * segments + (j + 1) % segments,
                          (i + 1) * segments + j))
    # Zero-radius end rings collapse into watertight poles in finish_mesh.
    obj = finish_mesh(name, vertices, faces, mat)
    bpy.context.view_layer.objects.active = obj
    bevel = obj.modifiers.new('Soft_Clay_Edges', 'BEVEL')
    bevel.width = .0025
    bevel.segments = 3
    bevel.angle_limit = math.radians(23)
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj


saucer = lathe('Saucer', [
    (0, 0), (.153, 0), (.171, .003), (.182, .009), (.188, .017),
    (.190, .030), (.189, .043), (.185, .050), (.179, .052),
    (.174, .050), (.172, .045), (.169, .033), (.161, .026),
    (.145, .023), (0, .023)], clay)
pot = lathe('Pot_Hollow_Body', [
    (0, .024), (.127, .024), (.137, .028), (.143, .038),
    (.147, .057), (.174, .294), (.179, .318),
    (.188, .320), (.197, .324), (.201, .333), (.202, .347),
    (.202, .375), (.200, .387), (.195, .395), (.188, .399),
    (.181, .399), (.175, .395), (.172, .388), (.172, .377),
    (.170, .346), (.165, .317), (.139, .080), (.134, .064),
    (.126, .058), (0, .058)], clay)
soil = lathe('Soil', [(0, .345), (.160, .345), (.168, .350),
                     (.169, .355), (.162, .359), (0, .359)], earth)

# Flat, uninterrupted soil surface requested by the user; no clods or textures.

anchor = bpy.data.objects.new('Plant_Anchor', None)
bpy.context.collection.objects.link(anchor)
anchor.parent = root
anchor.location = (0, 0, .359)
anchor.empty_display_size = .025
anchor['purpose'] = 'Future seed/plant attachment at soil center; no growth implemented'
asset_objects = [root, pot, saucer, soil, anchor]


def mesh_report(objects):
    result = []
    for obj in objects:
        if obj.type != 'MESH':
            continue
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        obj.data.calc_loop_triangles()
        entry = dict(name=obj.name, vertices=len(obj.data.vertices),
                     triangles=len(obj.data.loop_triangles),
                     non_manifold_edges=sum(not e.is_manifold for e in bm.edges),
                     finite=all(math.isfinite(c) for v in obj.data.vertices for c in v.co),
                     signed_volume=bm.calc_volume(signed=True))
        bm.free()
        assert entry['non_manifold_edges'] == 0, entry
        assert entry['finite'] and entry['signed_volume'] > 0, entry
        result.append(entry)
    return result


report = mesh_report(asset_objects)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = pot
glb = OUT / 'StoryFlowerpot.glb'
bpy.ops.export_scene.gltf(filepath=str(glb), export_format='GLB',
                          use_selection=True, export_extras=True)

# Independent import verifies the delivered GLB rather than only source meshes.
before = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(glb))
imported = list(set(bpy.context.scene.objects) - before)
imported_meshes = [o for o in imported if o.type == 'MESH']
assert len(imported_meshes) == 3
assert any(o.name.startswith('Plant_Anchor') for o in imported)
points = [o.matrix_world @ Vector(c) for o in imported_meshes for c in o.bound_box]
dimensions = [max(p[a] for p in points) - min(p[a] for p in points) for a in range(3)]
assert abs(min(p.z for p in points)) < .00001
assert all(abs(a - b) < .003 for a, b in zip(dimensions, [.404, .404, .399]))
for obj in imported:
    bpy.data.objects.remove(obj, do_unlink=True)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('Warm_Studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.78, .75, .69, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35
scene.view_settings.view_transform = 'AgX'
bpy.ops.mesh.primitive_plane_add(size=200)
floor = bpy.context.object
floor.name = 'Studio_Only_Ground'
floor.location.z = -.001
floor.data.materials.append(material('Studio_Ivory', (.82, .77, .66), .9))
target = Vector((0, 0, .21))
for location, energy, size in [((-1.4, -1.6, 2.2), 85, 1.8),
                               ((1.8, -.4, 1.2), 25, 1.6)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    lamp = bpy.context.object
    lamp.data.energy, lamp.data.size = energy, size
    lamp.rotation_euler = (target - lamp.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = 'ORTHO'
camera.data.ortho_scale = .65
scene.camera = camera


def render(name, position, focus=target):
    camera.location = position
    camera.rotation_euler = (focus - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(OUT / name)
    bpy.ops.render.render(write_still=True)


render('preview.png', (.75, -1.2, .91))
render('top.png', (.55, -.9, 1.65))
render('side.png', (0, -1.5, .32))
# Save editable asset with studio, but studio is excluded from the exported GLB.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'StoryFlowerpot.blend'))

# Archived character is used only in a separate scale inspection render.
archive = OUT.parent / 'somangi-neck-smooth-v8' / 'walk.glb'
before = set(scene.objects)
bpy.ops.import_scene.gltf(filepath=str(archive))
character = list(set(scene.objects) - before)
for obj in character:
    obj.animation_data_clear()
    if obj.type == 'ARMATURE':
        obj.data.pose_position = 'REST'
bpy.context.view_layer.update()
body = next(o for o in character if o.name.startswith('Somangi_Body'))
body_points = [body.matrix_world @ v.co for v in body.data.vertices]
low = min(p.z for p in body_points)
high = max(p.z for p in body_points)
height = high - low
comparison_root = bpy.data.objects.new('Inspection_Only_Character', None)
bpy.context.collection.objects.link(comparison_root)
for obj in character:
    if obj.parent not in character:
        obj.parent = comparison_root
comparison_root.scale = (1 / height,) * 3
comparison_root.location = (-.44, 0, -low / height)
root.location.x = .28
bpy.context.view_layer.update()
camera.data.ortho_scale = 1.6
render('scale-comparison.png', (0, -3, 1.45), Vector((-.04, 0, .48)))

manifest = dict(status='P1: model created; visual acceptance and gameplay contact pending',
                reference='reference.png: adopted flowerpot in left column',
                glb=glb.name, dimensions_H=dimensions, ground_origin=[0, 0, 0],
                plant_anchor_blender_Z_up=[0, 0, .359],
                plant_anchor_glTF_Y_up=[0, .359, 0],
                components=report, glb_bytes=glb.stat().st_size,
                roundtrip_import='passed: 3 meshes, anchor, bounds, ground',
                scale_reference=str(archive.relative_to(OUT.parent.parent)),
                reference_pose='REST, Somangi_Body vertex Z bounds excluding separate growth props',
                reference_body_height=height, character_scale=1 / height,
                scale_status='Provisional pot size H=0.399; archived character inspection only',
                game_installed=False)
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('STORY_FLOWERPOT_COMPLETE', json.dumps(manifest))
