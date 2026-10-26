"""Derive an unclothed Tori from the accepted Somangi mesh."""
import bpy, json, math, hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils import Matrix

P = Path(__file__).resolve().parent
source = P.parent/'somangi-game-v1/somangi-walk.blend'
digest = hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
body = bpy.data.objects['Somangi_SmoothBody']
rig = bpy.data.objects['Somangi_WholeArmRig']
original = np.array([v.co[:] for v in body.data.vertices])
scene.frame_set(1)
skin = np.array([184, 194, 217], dtype=np.float32)/255
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
                dst = src.copy(); dst.name = 'Tori_' + src.name
                pixels = np.empty(len(src.pixels), dtype=np.float32)
                src.pixels.foreach_get(pixels)
                rgba = pixels.reshape(-1, 4)
                rgba[rgba[:, :3].min(axis=1) > .72, :3] = skin
                dst.pixels.foreach_set(pixels); dst.pack()
                images[src.name] = dst
            node.image = images[src.name]

# Reuse only Tori's accepted crystal and glasses; old body/clothes stay retired.
accessory_source = P.parent/'agent-k-glasses-v6/Agent-K.blend'
accessory_digest = hashlib.sha256(accessory_source.read_bytes()).hexdigest()
with bpy.data.libraries.load(str(accessory_source), link=False) as (src, dst):
    dst.objects = [n for n in src.objects if n.startswith('Glasses') or n in ['AgentK_Crystal','Crystal collar']]
accessories = []
for ob in dst.objects:
    scene.collection.objects.link(ob)
    ob.parent = rig
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.vertex_groups.clear()
    ob.vertex_groups.new(name='Head').add(list(range(len(ob.data.vertices))),1,'REPLACE')
    for mod in list(ob.modifiers):
        if mod.type == 'ARMATURE': ob.modifiers.remove(mod)
    ob.modifiers.new('Follow current Head','ARMATURE').object = rig
    if ob.name in ['AgentK_Crystal','Crystal collar']:
        ob.location.z -= .055
    accessories.append(ob)
assert len(accessories) == 3, [o.name for o in accessories]
assert np.array_equal(original,np.array([v.co[:] for v in body.data.vertices]))
objects = [body,rig,*accessories]
for ob in list(scene.objects):
    if ob not in objects: bpy.data.objects.remove(ob,do_unlink=True)
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'tori.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'tori.glb'),use_selection=True,
    export_format='GLB',export_animations=True,export_animation_mode='SCENE',
    export_frame_range=True,export_cameras=False,export_lights=False)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
assert hashlib.sha256(accessory_source.read_bytes()).hexdigest()==accessory_digest
(P/'verification.json').write_text(json.dumps(dict(source=str(source),sourceSHA256=digest,
    accessorySource=str(accessory_source),accessorySourceSHA256=accessory_digest,
    vertices=len(original),maximumBodyVertexChange=0,skinSRGB='#B8C2D9',
    accessories=[o.name for o in accessories],clothes=False,gameInstalled=False,
    crystalAndCollarOffsetZ=-.055,walkPreserved=True,face='Somangi baseline U smile'),indent=2))
# Verify and photograph the delivered GLB in its authored rest pose.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'tori.glb'))
scene=bpy.context.scene
for ob in scene.objects:
    if ob.animation_data:
        ob.animation_data.action=None
        for track in ob.animation_data.nla_tracks: track.mute=True
    if ob.type == 'ARMATURE':
        for bone in ob.pose.bones: bone.matrix_basis=Matrix.Identity(4)
scene.frame_set(1)
world=bpy.data.worlds.new('Neutral studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.7,.7,.7,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.65;scene.world=world
target=Vector((0,0,.15))
for pos,energy in [((-3,-4,5),400),((4,3,4),300),((4,-3,1),130)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    light=bpy.context.object;light.data.energy=energy;light.data.size=4
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-6,.15))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.9;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=720;scene.render.resolution_y=800
scene.view_settings.view_transform='AgX'
for name,pos in [('front',(0,-6,.15)),('right',(6,0,.15)),('back',(0,6,.15))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)



