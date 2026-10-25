import bpy, json, hashlib, bmesh
from pathlib import Path
from mathutils import Vector, Matrix
P=Path(__file__).resolve().parent
source=P/'tori.glb'
before=hashlib.sha256(source.read_bytes()).hexdigest()
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
scene.cycles.samples=48
scene.render.resolution_x=900;scene.render.resolution_y=900
shots=[
 ('gem-front',(0,-6,1.02),(0,0,1.00),.65),
 ('gem-angle',(3,-5,2.5),(0,0,1.00),.65),
 ('gem-side',(6,0,1.05),(0,0,1.00),.65),
 ('gem-back',(-3,5,2),(0,0,1.00),.65),
 ('face-angle',(3,-6,1.2),(0,-.35,.36),1.1),
 ('face-side',(6,-1,.65),(0,-.35,.36),1.1)]
for name,pos,focus,scale in shots:
 cam.location=pos;cam.rotation_euler=(Vector(focus)-cam.location).to_track_quat('-Z','Y').to_euler()
 cam.data.ortho_scale=scale
 scene.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
report={}
for ob in scene.objects:
 if ob.type!='MESH':continue
 bm=bmesh.new();bm.from_mesh(ob.data)
 bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
 report[ob.name]=dict(boundaryEdges=sum(e.is_boundary for e in bm.edges),
  nonmanifoldEdges=sum(not e.is_manifold for e in bm.edges),
  zeroAreaFaces=sum(f.calc_area()<1e-12 for f in bm.faces))
 bm.free()
assert hashlib.sha256(source.read_bytes()).hexdigest()==before
(P/'inspection.json').write_text(json.dumps(dict(sourceSHA256=before,sourceUnchanged=True,
 meshes=report,views=[s[0] for s in shots],scope='Rest pose, topology and six close-up renders; not animated contact verification'),indent=2))

