"""Native reward pouch meshes, Blender 5.2. No game installation."""
import bpy
import bmesh
import math
import json
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = m.diffuse_color
    p.inputs['Roughness'].default_value = .85
    return m


brown = mat('Pouch_Chestnut', (.26, .09, .033))
cream = mat('Cord_Beige', (.76, .60, .38))
green = mat('Sprout_Pale_Green', (.36, .51, .25))
root = bpy.data.objects.new('RewardPouch', None)
bpy.context.collection.objects.link(root)
assets = [root]


def finish(obj, name, material):
    obj.name = name
    obj.parent = root
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for p in obj.data.polygons:
        p.use_smooth = True
    assets.append(obj)
    return obj


def mesh(name, verts, faces, material):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.000001)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, material)


# Profile is a continuous body/neck/fanned fabric top, not separate petals.
profile = [(0, 0), (.075, 0), (.120, .006), (.145, .023),
    (.157, .054), (.160, .090), (.153, .133), (.136, .179),
    (.109, .219), (.077, .252), (.052, .270), (.051, .280),
    (.064, .299), (.087, .327), (.108, .350), (.109, .359),
    (.101, .363), (.085, .353), (.064, .337), (.044, .316),
    (.026, .301), (0, .296)]
samples = []
for i in range(len(profile) - 1):
    p0 = Vector(profile[max(0, i - 1)])
    p1, p2 = Vector(profile[i]), Vector(profile[i + 1])
    p3 = Vector(profile[min(len(profile) - 1, i + 2)])
    for j in range(5):
        t = j / 5
        v = .5 * ((2 * p1) + (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t*t +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t*t*t)
        samples.append((max(0, v.x), max(0, v.y)))
samples.append(profile[-1])
N = 96
verts = []
for r, z in samples:
    for j in range(N):
        a = j * math.tau / N
        fold = max(0, min(1, (z - .205) / .12)) * min(1, r / .025)
        rr = r * (1 + .17 * fold * math.cos(5 * a + .6))
        verts.append((rr * math.cos(a), rr * .70 * math.sin(a),
                      z + .005 * fold * math.sin(5 * a + .6)))
faces = [(i*N+j, i*N+(j+1)%N, (i+1)*N+(j+1)%N, (i+1)*N+j)
    for i in range(len(samples)-1) for j in range(N)]
body = mesh('Pouch_Soft_Gathered_Body', verts, faces, brown)


def cord(name, points, radius, cyclic=False):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 16
    data.bevel_depth = radius
    data.bevel_resolution = 4
    data.use_fill_caps = True
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for p, co in zip(spline.bezier_points, points):
        p.co = co
        p.handle_left_type = p.handle_right_type = 'AUTO'
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    converted = bpy.context.object
    bm = bmesh.new()
    bm.from_mesh(converted.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.000001)
    open_edges = [e for e in bm.edges if e.is_boundary]
    if open_edges:
        bmesh.ops.holes_fill(bm, edges=open_edges, sides=0)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(converted.data)
    bm.free()
    return finish(converted, name, cream)


cord('Neck_Drawstring', [(.055*math.cos(a), .041*math.sin(a), .274)
    for a in [i*math.tau/12 for i in range(12)]], .007, True)
cord('Bow_Left_Loop', [(0,-.053,.274),(-.039,-.066,.291),
    (-.073,-.070,.276),(-.068,-.077,.253),(-.033,-.070,.261)], .007, True)
cord('Bow_Right_Loop', [(0,-.054,.275),(.039,-.067,.293),
    (.073,-.070,.285),(.069,-.076,.262),(.032,-.069,.265)], .007, True)
cord('Tie_Left_End', [(-.007,-.056,.270),(-.030,-.079,.246),
    (-.052,-.093,.210)], .0065)
cord('Tie_Right_End', [(.008,-.057,.270),(.036,-.078,.245),
    (.063,-.092,.216)], .0065)


def ellipsoid(name, center, scale):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=center)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, cream)


ellipsoid('Bow_Center_Knot', (0,-.064,.274), (.012,.012,.016))
ellipsoid('Left_End_Knot', (-.052,-.093,.210), (.010,.009,.012))
ellipsoid('Right_End_Knot', (.063,-.092,.216), (.010,.009,.012))

# Reuse original village sprout geometry, excluding the sign/frame.
before = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(OUT.parent/'information-sprout-mark-v1'/'Information-sprout-wall-mark.glb'))
imported = list(set(bpy.context.scene.objects) - before)
sprouts = [o for o in imported if o.type == 'MESH' and
           any(s in o.name for s in ('Leaf', 'Stem'))]
assert len(sprouts) == 3, [o.name for o in imported]
for obj in sprouts:
    matrix = obj.matrix_world.copy()
    for v in obj.data.vertices:
        old = matrix @ v.co
        x, z = old.x * .245, old.z * .245 + .125
        # Conform emblem to the broad belly; retain original raised thickness.
        outer = [(rr, zz) for rr, zz in samples if zz < .22]
        r = outer[-1][0]
        for (ra, za), (rb, zb) in zip(outer, outer[1:]):
            if za <= z <= zb and zb > za:
                r = ra + (rb-ra)*(z-za)/(zb-za)
                break
        y = -.70 * math.sqrt(max(.00001, r*r - x*x)) + (old.y + .065)*.245
        v.co = (x,y,z)
    obj.parent = None
    obj.matrix_world.identity()
    finish(obj, 'Emblem_' + obj.name, green)
for obj in imported:
    if obj not in sprouts:
        bpy.data.objects.remove(obj, do_unlink=True)
anchor = bpy.data.objects.new('Handover_Anchor', None)
bpy.context.collection.objects.link(anchor)
anchor.parent = root
anchor.location = (0,0,.274)
assets.append(anchor)

report = []
for obj in assets:
    if obj.type != 'MESH':
        continue
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.000001)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(obj.data)
    boundary = sum(not e.is_manifold for e in bm.edges)
    assert boundary == 0, (obj.name, boundary)
    assert all(math.isfinite(c) for v in obj.data.vertices for c in v.co)
    obj.data.calc_loop_triangles()
    report.append(dict(name=obj.name, triangles=len(obj.data.loop_triangles), non_manifold_edges=boundary))
    bm.free()
bpy.ops.object.select_all(action='DESELECT')
for obj in assets:
    obj.select_set(True)
bpy.context.view_layer.objects.active = body
glb = OUT/'RewardPouch.glb'
bpy.ops.export_scene.gltf(filepath=str(glb), export_format='GLB', use_selection=True, export_extras=True)
before = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(glb))
roundtrip = list(set(bpy.context.scene.objects)-before)
assert len([o for o in roundtrip if o.type=='MESH']) == len(report)
points = [o.matrix_world@Vector(c) for o in roundtrip if o.type=='MESH' for c in o.bound_box]
dims = [max(p[a] for p in points)-min(p[a] for p in points) for a in range(3)]
for obj in roundtrip:
    bpy.data.objects.remove(obj, do_unlink=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 1000
scene.world = bpy.data.worlds.new('Studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.78,.75,.69,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .4
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-.0002))
bpy.context.object.data.materials.append(mat('Studio_Ivory',(.8,.74,.64)))
target = Vector((0,0,.18))
for loc, power, size in [((-.8,-1,1.5),70,1.3),((1,.4,1),30,1)]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    lamp=bpy.context.object
    lamp.data.energy, lamp.data.size = power,size
    lamp.rotation_euler=(target-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object
cam.data.type='ORTHO'
cam.data.ortho_scale=.49
scene.camera=cam
for name,loc in [('preview.png',(.35,-1,.45)),('back.png',(-.35,1,.45)),('front.png',(0,-1,.20))]:
    cam.location=loc
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/name)
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'RewardPouch.blend'))
(OUT/'manifest.json').write_text(json.dumps(dict(dimensions_H=dims,meshes=report,
    status='P1: standalone model and roundtrip checked; visual approval/game contact pending',
    scale='Provisional H=1 character-relative; not final game scale',
    origin='Bottom center, Blender Z-up/front -Y; glTF Y-up/front +Z',
    sprout_source='information-sprout-mark-v1/Information-sprout-wall-mark.glb',
    game_installed=False,glb_bytes=glb.stat().st_size),indent=2),encoding='utf-8')
print('POUCH_COMPLETE',dims,len(report))
