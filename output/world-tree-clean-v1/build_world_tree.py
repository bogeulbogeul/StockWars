"""Native smooth world-tree study. No game assets are overwritten."""
import bpy
import math
import json
import random
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
random.seed(21)

def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = .86
    return m

wood = material('Warm_Matte_Wood', (.36, .17, .065))
leaves = [material('Foliage_'+str(i), c) for i, c in enumerate([
    (.24,.43,.075), (.32,.51,.10), (.40,.58,.14), (.29,.47,.085)])]

def limb(name, points, radii):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 16
    curve.bevel_depth = 1
    curve.bevel_resolution = 4
    curve.use_fill_caps = True
    s = curve.splines.new('BEZIER')
    s.bezier_points.add(len(points)-1)
    for p, co, radius in zip(s.bezier_points, points, radii):
        p.co = co
        p.radius = radius
        p.handle_left_type = p.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(wood)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o.select_set(False)
    return o

trunk_parts = []
trunk_parts.append(limb('Central_Trunk', [(0,0,.12),(.08,0,.7),(-.10,.03,1.55),(.06,.10,2.4),(.15,.16,3.4)], [.53,.43,.34,.25,.09]))
for i in range(7):
    a = i*math.tau/7+.18
    x,y = math.cos(a),math.sin(a)
    trunk_parts.append(limb('Grounded_Root', [(0,0,.42),(.47*x,.47*y,.23),(.94*x,.94*y,.10),(1.25*x,1.25*y,.065)], [.30,.22,.12,.015]))
for name, points, radii in [
    ('Left', [(-.06,0,1.35),(-.64,.03,1.95),(-1.1,.04,2.6),(-1.35,.04,3.25)], [.30,.24,.16,.055]),
    ('Right', [(0,0,1.85),(.62,-.03,2.25),(1.1,-.04,2.55),(1.45,-.03,2.97)], [.26,.21,.15,.045]),
    ('Rear', [(0,.08,1.5),(-.25,.55,2.25),(-.45,.85,2.85),(-.55,.95,3.3)], [.25,.18,.11,.04]),
    ('Front', [(-.1,0,2.15),(-.38,-.40,2.55),(-.65,-.65,3.03)], [.19,.13,.04])]:
    trunk_parts.append(limb(name+'_Branch', points, radii))
# Fuse root and branch intersections into a single smooth wood surface.
for o in trunk_parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = trunk_parts[0]
bpy.ops.object.join()
trunk = bpy.context.object
trunk.name = 'Continuous_Trunk_And_Roots'
remesh = trunk.modifiers.new('Joined_Wood', 'REMESH')
remesh.mode = 'VOXEL'
remesh.voxel_size = .035
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth = trunk.modifiers.new('Soft_Wood', 'SMOOTH')
smooth.factor = 1.2
smooth.iterations = 5
bpy.ops.object.modifier_apply(modifier=smooth.name)
for p in trunk.data.polygons:
    p.use_smooth = True
trunk.select_set(False)

# Broad asymmetrical canopy, using softly scalloped masses rather than leaf noise.
clusters = [
    ((-.15,.25,3.73),(1.15,.85,.82)),
    ((-.95,.15,3.45),(.95,.76,.69)),
    ((.85,.20,3.43),(1.0,.79,.71)),
    ((-1.43,.02,3.03),(.79,.66,.58)),
    ((1.50,-.05,2.97),(.79,.65,.59)),
    ((-.52,-.67,3.29),(.91,.66,.63)),
    ((.65,-.60,3.17),(.88,.66,.59)),
    ((-.55,.91,3.28),(.91,.71,.65)),
    ((.68,.84,3.20),(.85,.73,.64))]
for i, (loc, scale) in enumerate(clusters):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=28, location=loc)
    o = bpy.context.object
    o.name = 'Soft_Canopy_'+str(i)
    for v in o.data.vertices:
        n = v.co.normalized()
        a = math.atan2(n.y,n.x)
        v.co *= 1+.045*math.sin(5*a+i)*math.sin(math.acos(max(-1,min(1,n.z))))**2
    o.scale = scale
    o.data.materials.append(leaves[i%len(leaves)])
    for p in o.data.polygons:
        p.use_smooth = True
    o.select_set(False)

assets = [o for o in bpy.context.scene.objects if o.type=='MESH']
for o in assets:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'WorldTree-clean.glb'), export_format='GLB', use_selection=True)
bpy.ops.object.select_all(action='DESELECT')
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 1000
scene.world = bpy.data.worlds.new('Studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .7
bpy.ops.mesh.primitive_plane_add(size=200)
ground = bpy.context.object
ground.data.materials.append(material('Studio_Ground',(.72,.74,.77)))
for loc, power, size in [((-4,-5,8),700,5),((4,2,6),450,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    o = bpy.context.object
    o.data.energy = power
    o.data.shape = 'DISK'
    o.data.size = size
    o.rotation_euler = (Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam = bpy.context.object
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 5.9
scene.camera = cam
for name, loc in [('front',(0,-9,5.0)),('front-right',(6,-9,5.8)),('rear',(6,9,5.8))]:
    cam.location = loc
    cam.rotation_euler = (Vector((0,0,2.1))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath = str(ROOT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'WorldTree-clean.blend'))
(ROOT/'manifest.json').write_text(json.dumps({
    'status':'P1 draft model; user visual review and game integration pending',
    'style':'Smooth matte native 3D matching current village buildings',
    'references':['output/big-tree-retouch-final/BigTree-after.png','output/bookstore-exterior-clean-v1/front-left.png'],
    'mesh_count':len(assets), 'polygon_count':sum(len(o.data.polygons) for o in assets),
    'game_modified':False
}, indent=2), encoding='utf-8')
