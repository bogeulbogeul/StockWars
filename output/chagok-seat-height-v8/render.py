import bpy
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P.parent/'chagok-original-sit-v6/chagok-seated.glb'))
character=[o for o in bpy.context.scene.objects if o.type=='MESH']
scale=1/1.9000606
seat_top=.6640000343-.024
for ob in character:
    ob.scale=(scale,)*3; ob.location=(0,1.03,seat_top)
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





