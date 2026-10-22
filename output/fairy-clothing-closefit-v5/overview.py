import bpy
from pathlib import Path
from mathutils import Vector

P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
for file,x in [('moa-bench-sit.glb',-1.65),('tori.glb',0),('bongbong.glb',1.65)]:
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(P/file))
    objects=set(bpy.data.objects)-before
    for o in objects:
        o.animation_data_clear()
        if o.type=='ARMATURE':o.data.pose_position='REST'
    for o in objects:
        if o.parent not in objects:o.location.x+=x
s=bpy.context.scene
s.world=bpy.data.worlds.new('Studio');s.world.use_nodes=True
s.world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.32,.32,1)
s.world.node_tree.nodes['Background'].inputs[1].default_value=.7
target=Vector((0,0,.22))
for loc,power,size in [((-3,-4,5),650,5),((3,-2,3),400,4),((0,3,4),450,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size
    lamp.rotation_euler=(target-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-7,.22))
c=bpy.context.object;c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler()
c.data.type='ORTHO';c.data.ortho_scale=5.65;s.camera=c
s.render.engine='CYCLES';s.cycles.samples=32
s.render.resolution_x=1500;s.render.resolution_y=800;s.render.resolution_percentage=100
s.render.filepath=str(P/'overview.png');bpy.ops.render.render(write_still=True)
