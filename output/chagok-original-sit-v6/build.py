"""Use Somangi's existing Sit_Idle verbatim; only recolor and place on the chair."""
import bpy,json,hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parent
source=P.parent/'somangi-sit-v1/somangi-sit.blend'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
scene=bpy.context.scene
rig=bpy.data.objects['Somangi_OriginalRig'];body=bpy.data.objects['Somangi_SmoothBody']
rig.animation_data.action=bpy.data.actions['Sit_Idle']
for track in rig.animation_data.nla_tracks:track.mute=True
scene.frame_set(1);bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()
baked=bpy.data.meshes.new_from_object(body.evaluated_get(deps),depsgraph=deps)
original=np.array([v.co[:] for v in baked.vertices])
head=rig.pose.bones['Head'].matrix@rig.data.bones['Head'].matrix_local.inverted()
body.data=baked;body.modifiers.clear();body.parent=None;body.matrix_world=Matrix.Identity(4)
# Recolor exactly as the original Chagok derivation; retain face ink.
skin=np.array([239,201,119],dtype=np.float32)/255
linear=np.where(skin<=.04045,skin/12.92,((skin+.055)/1.055)**2.4)
images={}
for mat in body.data.materials:
    if not mat.use_nodes:continue
    for bsdf in [n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED']:
        if not bsdf.inputs['Base Color'].links and 'skin' in mat.name.lower():
            bsdf.inputs['Base Color'].default_value=(*linear,1)
        for link in list(bsdf.inputs['Base Color'].links):
            node=link.from_node
            if node.type!='TEX_IMAGE' or not node.image:continue
            src=node.image
            if src.name not in images:
                dst=src.copy();dst.name='Chagok_'+src.name
                pixels=np.empty(len(src.pixels),dtype=np.float32);src.pixels.foreach_get(pixels)
                rgba=pixels.reshape(-1,4);rgba[rgba[:,:3].min(axis=1)>.72,:3]=skin
                dst.pixels.foreach_set(pixels);dst.pack();images[src.name]=dst
            node.image=images[src.name]
accessory_source=P.parent/'chagok-somangi-base-v1/chagok.blend'
with bpy.data.libraries.load(str(accessory_source),link=False) as (src,dst):
    dst.objects=[n for n in src.objects if n.startswith('Chagok ')]
objects=[body]
for ob in dst.objects:
    scene.collection.objects.link(ob);ob.modifiers.clear();ob.parent=None
    ob.matrix_world=Matrix.Identity(4)
    for v in ob.data.vertices:v.co=head@v.co
    objects.append(ob)
# Rigid translation only: normalize original seated body and published contact.
contact=json.loads((P.parent/'somangi-sit-v1/sit-metadata.json').read_text())
shift=Vector((0,-contact['rootBackwardShift'],-contact['seatSurfaceZ']))
for ob in objects:
    for v in ob.data.vertices:v.co+=shift
actual=np.array([v.co[:] for v in body.data.vertices])
error=float(np.max(np.abs(actual-original-np.array(shift))))
assert error<1e-6
for ob in list(scene.objects):
    if ob not in objects:bpy.data.objects.remove(ob,do_unlink=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'chagok-seated.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'chagok-seated.glb'),use_selection=True,
    export_format='GLB',export_animations=False,export_cameras=False,export_lights=False)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
(P/'verification.json').write_text(json.dumps(dict(source=str(source),sourceSHA256=digest,
    clip='Sit_Idle',frame=1,maximumPoseVertexDifferenceAfterTranslation=error,
    rigidTranslation=list(shift),additionalLegRotation=0,additionalLegLift=0,
    undersideDeformation=False,sourceUnchanged=True),indent=2))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'chagok-seated.glb'))
character=[o for o in bpy.context.scene.objects if o.type=='MESH']
scale=1/1.9000606
seat_top=.6640000343-.024
for ob in character:
    ob.scale=(scale,)*3; ob.location=(0,.95,seat_top)
bpy.ops.import_scene.gltf(filepath=str(P.parents[1]/'web/assets/office/3d/Bank-furnished-room.glb'))
chair=[]
for ob in list(bpy.context.scene.objects):
    if ob in character:continue
    if ob.type=='MESH' and ob.name.startswith('Executive'):
        ob.location.z-=.024;chair.append(ob)
    else:bpy.data.objects.remove(ob,do_unlink=True)
scene=bpy.context.scene
world=bpy.data.worlds.new('Studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.65,.65,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.7;scene.world=world
target=Vector((0,1.2,1.05))
for pos,energy in [((-3,-4,5),400),((4,3,4),300)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    light=bpy.context.object;light.data.energy=energy;light.data.size=4
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.3;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=850;scene.render.resolution_y=900
scene.view_settings.view_transform='AgX'
for name,pos in [('front',(0,-5,1.2)),('side',(6,1.2,1.05)),('angle',(3,-5,3))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
target=Vector((0,.96,.82));cam.data.ortho_scale=.85
cam.location=(1.2,-3,1.5);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(P/'feet-close.png');bpy.ops.render.render(write_still=True)


