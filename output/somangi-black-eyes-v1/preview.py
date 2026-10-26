import bpy,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P.parent/'somangi-bench-down-v1'))
from rig_utils import reset
for label,path in [('before',P.parent/'somangi-bench-down-v1/somangi-bench-down.glb'),('after',P/'somangi-black-eyes.glb')]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
    rig.animation_data_clear();reset(rig)
    scene=bpy.context.scene
    world=bpy.data.worlds.new('Neutral ambient');world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[0].default_value=(.3,.3,.3,1)
    world.node_tree.nodes['Background'].inputs[1].default_value=.6;scene.world=world
    target=Vector((0,-.05,.43))
    bpy.ops.object.light_add(type='AREA',location=(-2,-4,4))
    light=bpy.context.object;light.data.energy=450;light.data.size=4
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(0,-5,.5));cam=bpy.context.object
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=1.25;scene.camera=cam
    scene.render.engine='CYCLES';scene.cycles.samples=16
    scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX'
    for tint,color in [('neutral',(1,1,1)),('warm',(1,.48,.18))]:
        light.data.color=color
        scene.render.filepath=str(P/f'{label}-{tint}.png')
        bpy.ops.render.render(write_still=True)
