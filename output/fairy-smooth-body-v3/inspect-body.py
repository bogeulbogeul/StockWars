import bpy
from pathlib import Path
from mathutils import Vector

P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'bongbong.glb'))
s=bpy.context.scene
for ob in s.objects:
    ob.animation_data_clear()
    if ob.type=='ARMATURE': ob.data.pose_position='REST'
    if 'Apron' in ob.name: ob.hide_render=True
s.world=bpy.data.worlds.new('Studio');s.world.use_nodes=True
s.world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.32,.32,1)
s.world.node_tree.nodes['Background'].inputs[1].default_value=.7
target=Vector((0,0,-.38))
for location,energy in [((-3,-4,5),450),((3,-2,3),250),((0,3,4),350)]:
    bpy.ops.object.light_add(type='AREA',location=location)
    light=bpy.context.object;light.data.energy=energy;light.data.size=4
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(-6,0,-.38))
cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=1.35;s.camera=cam
s.render.engine='CYCLES';s.cycles.samples=32
s.render.resolution_x=650;s.render.resolution_y=650;s.render.resolution_percentage=100
s.render.filepath=str(P/'body-profile-inspection.png');bpy.ops.render.render(write_still=True)
