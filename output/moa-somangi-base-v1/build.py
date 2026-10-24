"""Make Moa from the accepted Somangi geometry; tint and a head leaf only."""
import bpy, json, math, numpy as np
from pathlib import Path
from mathutils import Vector

P = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-game-v1/somangi-walk.blend'))
scene = bpy.context.scene
body = bpy.data.objects['Somangi_SmoothBody']
rig = bpy.data.objects['Somangi_WholeArmRig']
original = np.array([v.co[:] for v in body.data.vertices])
scene.frame_set(1)
# Use one exact, 8-bit-representable cream colour for textured and solid skin.
# Replace baked skin shading rather than multiplying its previous colour.
cream = np.array([255, 219, 163], dtype=np.float32)/255
cream_linear = np.where(cream <= .04045, cream/12.92, ((cream+.055)/1.055)**2.4)
images = {}
for mat in bpy.data.materials:
    if not mat.use_nodes:
        continue
    for bsdf in [n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED']:
        if not bsdf.inputs['Base Color'].links and 'skin' in mat.name.lower():
            bsdf.inputs['Base Color'].default_value = (*cream_linear, 1)
        for link in list(bsdf.inputs['Base Color'].links):
            node = link.from_node
            if node.type != 'TEX_IMAGE' or not node.image:
                continue
            src = node.image
            if src.name not in images:
                dst = src.copy()
                dst.name = 'Moa_' + src.name
                pixels = np.empty(len(src.pixels), dtype=np.float32)
                src.pixels.foreach_get(pixels)
                rgba = pixels.reshape(-1, 4)
                skin = rgba[:, :3].min(axis=1) > .72
                rgba[skin, :3] = cream
                dst.pixels.foreach_set(pixels)
                dst.pack()
                images[src.name] = dst
            node.image = images[src.name]

leaf_mat = bpy.data.materials.new('Moa olive leaf')
leaf_mat.diffuse_color = (.32, .39, .075, 1)
leaf_mat.use_nodes = True
bsdf = leaf_mat.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = leaf_mat.diffuse_color
bsdf.inputs['Roughness'].default_value = .68

def attach(obj):
    obj.data.materials.append(leaf_mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.vertex_groups.new(name='Head').add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
    obj.modifiers.new('Follow original head', 'ARMATURE').object = rig
    obj.parent = rig
    return obj

# Closed, softly inflated almond leaf, leaning to the viewer's right.
verts, faces = [], []
rings, sides = 180, 160
axis = Vector((.43, 0, .43))
across = Vector((-.7071, 0, .7071))
for i in range(rings+1):
    t = i/rings
    center = Vector((.025, 0, 1.01)) + axis*t
    center.y += .035*math.sin(math.pi*t)
    width = .17*math.sin(math.pi*t)**.85
    depth = .045*math.sin(math.pi*t)**.7
    for j in range(sides):
        a = 2*math.pi*j/sides
        u = math.cos(a)
        # Shallow sculpted midrib and three pairs of oblique folds.
        midrib = math.exp(-(u/.065)**2)
        branches = max(math.exp(-((t-(root+.19*abs(u)))/.012)**2)
                       for root in (.20, .40, .60))
        fade = math.sin(math.pi*t)**1.2
        groove = (.010*midrib + .006*branches*(1-midrib))*fade
        inset = groove*abs(math.sin(a))**3
        y = depth*math.sin(a) - math.copysign(inset, math.sin(a))
        v = center + across*(width*u) + Vector((0, y, 0))
        verts.append(v[:])
for i in range(rings):
    for j in range(sides):
        k = i*sides+j
        faces.append((k, i*sides+(j+1)%sides, (i+1)*sides+(j+1)%sides, k+sides))
mesh = bpy.data.meshes.new('Moa leaf closed surface')
mesh.from_pydata(verts, [], faces)
mesh.update()
leaf = bpy.data.objects.new('Moa_Leaf', mesh)
scene.collection.objects.link(leaf)
attach(leaf)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=(.018, 0, .987))
stem = bpy.context.object
stem.name = 'Moa_LeafStem'
stem.scale = (.035, .035, .092)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
attach(stem)

import sys
sys.path.insert(0, str(P))
from leaf_moods import add_leaf_moods, isolate_exported_tracks
add_leaf_moods(rig, leaf, stem, P)
from vest import add_vest
vest = add_vest(body, rig, P)

assert np.array_equal(original, np.array([v.co[:] for v in body.data.vertices]))
export_objects = [body, rig, leaf, stem, vest]
for ob in scene.objects:
    if ob.type == 'MESH' and ob not in export_objects:
        ob.hide_render = True
        ob.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for ob in export_objects:
    ob.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'moa.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'moa.glb'), use_selection=True,
    export_format='GLB', export_animations=True, export_animation_mode='ACTIONS',
    export_frame_range=False, export_cameras=False, export_lights=False)
isolate_exported_tracks(P/'moa.glb')
(P/'verification.json').write_text(json.dumps(dict(
    source='somangi-game-v1/somangi-walk.blend', originalVertices=len(original),
    maximumOriginalVertexChange=0, originalBonesAndWalkPreserved=True,
    additions=['Moa_Leaf', 'Moa_LeafStem', 'Moa_GreenVest'], uniformSkinSRGB8=[255,219,163],
    leafDetail='Sculpted central groove and three pairs of shallow lateral folds',
    gameInstalled=False), indent=2))

# Render the exported model itself, not a separate illustration.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'moa.glb'))
scene = bpy.context.scene
scene.frame_set(1)
world = bpy.data.worlds.new('Warm studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.55,.55,.55,1)
world.node_tree.nodes['Background'].inputs[1].default_value = .7
scene.world = world
target = Vector((0,0,.22))
for pos, energy in [((-3,-4,5),450), ((4,2,4),300), ((4,-3,0),100)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light = bpy.context.object
    light.data.energy = energy
    light.data.size = 4
    light.rotation_euler = (target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-6,.22))
cam = bpy.context.object
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 2.8
scene.camera = cam
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 680
scene.render.resolution_y = 720
scene.view_settings.view_transform = 'AgX'
for name, pos in [('front',(0,-6,.22)), ('side',(-6,0,.22)), ('back',(0,6,.22))]:
    cam.location = pos
    cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath = str(P/(name+'.png'))
    bpy.ops.render.render(write_still=True)
target = Vector((.23,0,1.23))
cam.location = (.23,-6,1.23)
cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.ortho_scale = .85
scene.render.filepath = str(P/'leaf-close.png')
bpy.ops.render.render(write_still=True)
imported_rig = next(o for o in scene.objects if o.type == 'ARMATURE')
imported_rig.animation_data_create()
for track in imported_rig.animation_data.nla_tracks:
    track.mute = True
for mood in ('Calm','Happy','Sad','Curious','Surprised'):
    action = next(a for a in bpy.data.actions if a.name == 'Moa_Leaf_'+mood)
    imported_rig.animation_data.action = action
    imported_rig.animation_data.action_slot = action.slots[0]
    scene.frame_set(round(action.frame_range[1]*.25))
    scene.render.filepath = str(P/('leaf-'+mood.lower()+'.png'))
    bpy.ops.render.render(write_still=True)
