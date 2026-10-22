import bpy,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
quick='--quick' in sys.argv
for kind in ['bread','drink']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(P/f'somangi-{kind}.glb'))
    scene=bpy.context.scene
    for ob in [*scene.objects,*bpy.data.shape_keys]:
        ad=ob.animation_data
        if ad and not ad.action and ad.nla_tracks:
            strip=ad.nla_tracks[0].strips[0]
            ad.action=strip.action;ad.action_slot=strip.action_slot
            for track in ad.nla_tracks:track.mute=True
    action=next(k.animation_data.action for k in bpy.data.shape_keys if k.animation_data and k.animation_data.action)
    start,end=action.frame_range
    world=bpy.data.worlds.new('Food motion studio');world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[0].default_value=(.24,.24,.24,1)
    world.node_tree.nodes['Background'].inputs[1].default_value=.7;scene.world=world
    target=Vector((0,-.1,0))
    for pos,energy,size in [((-3,-4,5),450,4),((4,2,4),300,4)]:
        bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object
        o.data.energy=energy;o.data.size=size
        o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.55;scene.camera=cam
    scene.render.engine='CYCLES';scene.cycles.samples=12
    scene.render.resolution_x=650;scene.render.resolution_y=700;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX'
    for view,pos in [('side',(-6,-.1,0))]:
        cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
        folder=P/f'{kind}-{view}';folder.mkdir(exist_ok=True)
        for i in [0,6,12,16,24,30]:
            frame=start+(end-start)*i/36
            scene.frame_set(int(frame),subframe=frame-int(frame))
            scene.render.filepath=str(folder/f'{i:03}.png');bpy.ops.render.render(write_still=True)
