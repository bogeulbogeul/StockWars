import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-black-eyes.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
action=next(a for a in bpy.data.actions if a.name=='Walk_InPlace')
rig.animation_data.action=action;start,end=action.frame_range
scene=bpy.context.scene
world=bpy.data.worlds.new('Eye color motion test');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.3,.3,.3,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.6;scene.world=world
target=Vector((0,0,0))
bpy.ops.object.light_add(type='AREA',location=(-2,-4,4))
light=bpy.context.object;light.data.energy=450;light.data.size=4
light.data.color=(1,.48,.18)
light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO'
cam.data.ortho_scale=2.5;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.resolution_x=480;scene.render.resolution_y=520;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
for view,pos in [('front',(0,-5,.2)),('angle',(2,-5,.4))]:
    cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/('walk-'+view);folder.mkdir(exist_ok=True)
    for i in range(18):
        frame=start+(end-start)*i/18
        scene.frame_set(int(frame),subframe=frame-int(frame))
        scene.render.filepath=str(folder/f'{i:03}.png');bpy.ops.render.render(write_still=True)
(P/'walk-render.json').write_text(json.dumps({'clip':'Walk_InPlace','durationSeconds':.75,'framesPerView':18,'views':['front','angle'],'keyLightColor':[1,.48,.18],'source':'somangi-black-eyes.glb'},indent=2))
