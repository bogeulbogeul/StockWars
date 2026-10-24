"""Orthographic rest-pose views of the currently shipped Somangi GLB."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
ROOT=P.parents[1]
source=ROOT/'web/assets/characters/3d/somangi/walk.glb'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
scene=bpy.context.scene
# Game idle stops all actions; use the same authored rest pose, not a walk sample.
for ob in scene.objects:
    if ob.animation_data:
        ob.animation_data.action=None
        for track in ob.animation_data.nla_tracks:track.mute=True
scene.frame_set(1)
meshes=[ob for ob in scene.objects if ob.type=='MESH' and not ob.hide_render and ob.visible_get()]
points=[ob.matrix_world@v.co for ob in meshes for v in ob.data.vertices]
minimum=[min(v[i] for v in points) for i in range(3)]
maximum=[max(v[i] for v in points) for i in range(3)]
world=bpy.data.worlds.new('Neutral body reference')
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.7,.7,.7,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.65
scene.world=world
target=Vector((0,0,0))
for pos,energy in [((-3,-4,5),400),((4,3,4),300),((4,-3,1),130)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    light=bpy.context.object;light.data.energy=energy;light.data.size=4
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-6,0))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.4
scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=48
scene.render.resolution_x=900;scene.render.resolution_y=1000
scene.view_settings.view_transform='AgX'
for name,pos in [('front',(0,-6,0)),('right',(6,0,0)),('back',(0,6,0))]:
    cam.location=pos
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(P/(name+'.png'))
    bpy.ops.render.render(write_still=True)
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
runtime=ROOT/'electron-app/dist/win-unpacked/resources/web/assets/characters/3d/somangi/walk.glb'
runtime_hash=hashlib.sha256(runtime.read_bytes()).hexdigest() if runtime.exists() else None
(P/'capture.json').write_text(json.dumps(dict(
    source=str(source.relative_to(ROOT)),sha256=digest,runtimeSHA256=runtime_hash,
    runtimeIdentical=runtime_hash==digest,pose='Authored rest pose; all imported actions/NLA muted',
    views=dict(front=[0,-6,0],right=[6,0,0],back=[0,6,0]),
    projection='orthographic',orthographicScale=2.4,resolution=[900,1000],
    boundsBlenderXYZ=dict(min=minimum,max=maximum),
    dimensionsBlenderXYZ=[maximum[i]-minimum[i] for i in range(3)],
    sourceUnchanged=True),indent=2))
