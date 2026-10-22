import bpy,math,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P.parent/'somangi-walk.glb'))
scene=bpy.context.scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
start,end=rig.animation_data.action.frame_range
world=bpy.data.worlds.new('Gap audit studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.16,.16,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.8
scene.world=world
target=Vector((0,0,-.32))
for pos,energy,size in [((-3,-4,4),400,4),((3,2,3),350,3),((-2,4,1),200,3)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    o=bpy.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=1.42
scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=560;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
for label,pos in [('front',(0,-5,0)),('right',(5,0,0)),('back',(0,5,0)),('left',(-5,0,0))]:
    folder=P/label;folder.mkdir(exist_ok=True)
    camera.location=target+Vector(pos)
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    for index in ([0,4] if '--quick' in sys.argv else range(8)):
        f=start+(end-start)*index/8
        scene.frame_set(int(f),subframe=f-int(f))
        scene.render.filepath=str(folder/f'{index:02}.png')
        bpy.ops.render.render(write_still=True)
