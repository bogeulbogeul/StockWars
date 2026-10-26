import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P.parent/'somangi-face-smooth-v1/somangi-face-smooth.glb'))
source=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-rest.glb'))
result=bpy.data.objects['Somangi_SmoothBody']
for o in bpy.context.scene.objects:
    if o.type=='ARMATURE':o.data.pose_position='REST'
    if o.type=='MESH' and o not in [source,result]:o.hide_render=True
bpy.context.view_layer.update()
scene=bpy.context.scene
points=[source.matrix_world@Vector(c) for c in source.bound_box]
low=min(p.z for p in points);high=max(p.z for p in points)
target=Vector((0,0,(low+high)/2))
world=bpy.data.worlds.new('Matched studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.32,.32,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.7;scene.world=world
for pos,energy,size in [((-3,-4,5),450,4),((3,-2,3),250,3),((0,3,4),350,3)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    lamp=bpy.context.object;lamp.data.energy=energy;lamp.data.shape='DISK';lamp.data.size=size
    lamp.rotation_euler=(target-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=(high-low)*1.22
camera.location=target+Vector((0,-5,.05))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=650;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
for name,visible,hidden in [('source-rest',source,result),('result-rest',result,source)]:
    visible.hide_render=False;hidden.hide_render=True
    scene.render.filepath=str(P/(name+'.png'))
    bpy.ops.render.render(write_still=True)
