"""Create a UV-ready vest on the unchanged accepted Somangi walk model."""
import bpy, sys, json, numpy as np
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P))
from tailor import tailor
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-game-v1/somangi-walk.blend'))
scene=bpy.context.scene
scene.frame_set(1)
body=bpy.data.objects['Somangi_SmoothBody']
rig=bpy.data.objects['Somangi_WholeArmRig']
original=np.array([v.co[:] for v in body.data.vertices])
garments=tailor(body,rig,P)
exports=[body,rig,*garments]
for ob in scene.objects:
    if ob.type=='MESH' and ob not in exports:
        ob.hide_render=True
        ob.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for ob in exports: ob.hide_set(False);ob.select_set(True)
bpy.context.view_layer.objects.active=body
assert np.array_equal(original,np.array([v.co[:] for v in body.data.vertices]))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-vest.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-vest.glb'),use_selection=True,
    export_format='GLB',export_animations=True,export_animation_mode='SCENE',
    export_frame_range=True,export_cameras=False,export_lights=False)
(P/'verification.json').write_text(json.dumps(dict(originalBodyVertices=len(original),
    maximumBodyVertexChange=0,walkPreserved=True,uvTexture='vest-basecolor.png',
    gameInstalled=False),indent=2))
# Inspect the delivered GLB, rather than rendering an independent illustration.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-vest.glb'))
scene=bpy.context.scene
scene.frame_set(1)
world=bpy.data.worlds.new('Neutral studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.55,.55,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.7
scene.world=world
target=Vector((0,0,0))
for pos,energy in [((-3,-4,5),450),((4,2,4),300),((4,-3,0),100)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    light=bpy.context.object;light.data.energy=energy;light.data.size=4
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-6,0));cam=bpy.context.object
cam.data.type='ORTHO';cam.data.ortho_scale=2.25;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.resolution_x=650;scene.render.resolution_y=700
scene.view_settings.view_transform='AgX'
for name,pos in [('front',(0,-6,0)),('side',(-6,0,0)),('back',(0,6,0)),('three-quarter',(-3,-6,.2))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(0,-6,0);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
for frame in (8,23):
    scene.frame_set(frame)
    scene.render.filepath=str(P/f'walk-{frame}.png');bpy.ops.render.render(write_still=True)
