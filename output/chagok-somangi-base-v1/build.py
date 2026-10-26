"""Derive Chagok from the accepted Somangi mesh; preserve authored geometry."""
import bpy, json, math, hashlib, bmesh
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix

P = Path(__file__).resolve().parent
source = P.parent/'somangi-game-v1/somangi-walk.blend'
digest = hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
body = bpy.data.objects['Somangi_SmoothBody']
rig = bpy.data.objects['Somangi_WholeArmRig']
original = np.array([v.co[:] for v in body.data.vertices])
scene.frame_set(1)
skin = np.array([239, 201, 119], dtype=np.float32)/255
linear = np.where(skin <= .04045, skin/12.92, ((skin+.055)/1.055)**2.4)
images = {}
for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    for bsdf in [n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED']:
        if not bsdf.inputs['Base Color'].links and 'skin' in mat.name.lower():
            bsdf.inputs['Base Color'].default_value = (*linear, 1)
        for link in list(bsdf.inputs['Base Color'].links):
            node = link.from_node
            if node.type != 'TEX_IMAGE' or not node.image: continue
            src = node.image
            if src.name not in images:
                dst = src.copy(); dst.name = 'Chagok_' + src.name
                pixels = np.empty(len(src.pixels), dtype=np.float32)
                src.pixels.foreach_get(pixels)
                rgba = pixels.reshape(-1, 4)
                rgba[rgba[:, :3].min(axis=1) > .72, :3] = skin
                dst.pixels.foreach_set(pixels); dst.pack()
                images[src.name] = dst
            node.image = images[src.name]

def material(name, rgb):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    color = np.array(rgb)/255
    color = np.where(color <= .04045, color/12.92, ((color+.055)/1.055)**2.4)
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = .62
    return mat

def follow_head(ob):
    ob.parent = rig; ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.vertex_groups.clear()
    ob.vertex_groups.new(name='Head').add(list(range(len(ob.data.vertices))), 1, 'REPLACE')
    for mod in list(ob.modifiers):
        if mod.type == 'ARMATURE': ob.modifiers.remove(mod)
    ob.modifiers.new('Follow Somangi Head', 'ARMATURE').object = rig

# Reuse the already fitted smooth frame, recolored to Chagok's warm brown.
accessory_source = P.parent/'tori-crystal-clean-v3/tori.blend'
accessory_digest = hashlib.sha256(accessory_source.read_bytes()).hexdigest()
with bpy.data.libraries.load(str(accessory_source), link=False) as (src, dst):
    dst.objects = [n for n in src.objects if n.startswith('Glasses')]
accessories = []
for ob in dst.objects:
    scene.collection.objects.link(ob)
    ob.name = 'Chagok brown round glasses'
    ob.data.materials.clear(); ob.data.materials.append(material('Warm walnut frame', [117, 76, 43]))
    follow_head(ob); accessories.append(ob)
assert len(accessories) == 1

# Two rounded seed-shell lobes, embedded directly into the crown without a collar.
gold = material('Golden seed shell', [231, 171, 65])
for side in [-1, 1]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=40)
    ob = bpy.context.object; ob.name = 'Chagok seed shell ' + ('left' if side < 0 else 'right')
    # Bake world coordinates so one Head skin group matches the source rig.
    for v in ob.data.vertices:
        x, y, z = v.co
        taper = 1 - .17*z
        local = Vector((x*.135*taper, y*.075, z*.245))
        angle = side*math.radians(39)
        v.co = (local.x*math.cos(angle)+local.z*math.sin(angle)+side*.145,
                local.y+.005,
                -local.x*math.sin(angle)+local.z*math.cos(angle)+1.105)
    for poly in ob.data.polygons: poly.use_smooth = True
    ob.data.materials.append(gold)
    follow_head(ob); accessories.append(ob)

assert np.array_equal(original, np.array([v.co[:] for v in body.data.vertices]))
objects = [body, rig, *accessories]
for ob in list(scene.objects):
    if ob not in objects: bpy.data.objects.remove(ob, do_unlink=True)
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'chagok.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'chagok.glb'), use_selection=True,
    export_format='GLB', export_animations=True, export_animation_mode='SCENE',
    export_frame_range=True, export_cameras=False, export_lights=False)
assert hashlib.sha256(source.read_bytes()).hexdigest() == digest
assert hashlib.sha256(accessory_source.read_bytes()).hexdigest() == accessory_digest

# Inspect the actual exported deliverable, then render its rest pose.
accessory_names = [o.name for o in accessories]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'chagok.glb'))
scene = bpy.context.scene
animation_names = [a.name for a in bpy.data.actions]
for ob in scene.objects:
    if ob.animation_data:
        ob.animation_data.action = None
        for track in ob.animation_data.nla_tracks: track.mute = True
    if ob.type == 'ARMATURE':
        for bone in ob.pose.bones: bone.matrix_basis = Matrix.Identity(4)
scene.frame_set(1)
report = {}
for ob in scene.objects:
    if ob.type != 'MESH': continue
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
    report[ob.name] = dict(boundaryEdges=sum(e.is_boundary for e in bm.edges),
        nonmanifoldEdges=sum(not e.is_manifold for e in bm.edges),
        zeroAreaFaces=sum(f.calc_area()<1e-12 for f in bm.faces))
    bm.free()
(P/'verification.json').write_text(json.dumps(dict(source=str(source), sourceSHA256=digest,
    accessorySource=str(accessory_source), accessorySourceSHA256=accessory_digest,
    vertices=len(original), maximumBodyVertexChange=0, skinSRGB='#EFC977',
    accessories=accessory_names, clothes=False, ledger=False,
    gameInstalled=False, animationNames=animation_names, meshes=report,
    scope='Body coordinates unchanged; exported GLB reload, topology, rest-pose renders. Animated contact not fully reviewed.'), indent=2))
world = bpy.data.worlds.new('Neutral studio'); world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.7,.7,.7,1)
world.node_tree.nodes['Background'].inputs[1].default_value = .65; scene.world = world
target = Vector((0,0,.15))
for pos, energy in [((-3,-4,5),400), ((4,3,4),300), ((4,-3,1),130)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light=bpy.context.object; light.data.energy=energy; light.data.size=4
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-6,.15))
cam=bpy.context.object; cam.data.type='ORTHO'; cam.data.ortho_scale=2.9; scene.camera=cam
scene.render.engine='CYCLES'; scene.cycles.samples=32
scene.render.resolution_x=810; scene.render.resolution_y=900
scene.view_settings.view_transform='AgX'
for name, pos in [('front',(0,-6,.15)), ('right',(6,0,.15)), ('back',(0,6,.15)),
                  ('angle',(3,-6,1.3))]:
    cam.location=pos; cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(P/(name+'.png')); bpy.ops.render.render(write_still=True)
