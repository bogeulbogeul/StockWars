import bpy, json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'AnnaVest-source.glb'))
scene=bpy.context.scene
ob=next(o for o in scene.objects if o.type=='MESH')
v=[ob.matrix_world@p.co for p in ob.data.vertices]
print('BOUNDS',[(min(p[i] for p in v),max(p[i] for p in v)) for i in range(3)])
world=bpy.data.worlds.new('Studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.45,.45,.45,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.7
scene.world=world
target=sum(v,Vector())/len(v)
for pos,energy in [((-3,-4,5),450),((4,2,4),300)]:
 bpy.ops.object.light_add(type='AREA',location=pos);light=bpy.context.object
 light.data.energy=energy;light.data.size=4
 light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-5,1))
cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.4;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.resolution_x=640;scene.render.resolution_y=640
scene.view_settings.view_transform='AgX'
for name,pos in [('front',(0,-5,0)),('back',(0,5,0)),('side',(-5,0,0))]:
 cam.location=target+Vector(pos)
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(P/('source-'+name+'.png'))
 bpy.ops.render.render(write_still=True)
