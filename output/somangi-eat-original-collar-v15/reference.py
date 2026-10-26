import bpy,sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;quick='--quick' in sys.argv;side='--side' in sys.argv
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3/somangi-bread.blend'))
body=bpy.data.objects['Somangi_SmoothBody']
body.shape_key_clear()
for ob in list(bpy.context.scene.objects):
    if ob!=body:bpy.data.objects.remove(ob,do_unlink=True)
body.modifiers.clear()
scene=bpy.context.scene
for ob in [*scene.objects,*bpy.data.shape_keys]:
    ad=ob.animation_data
    if ad and not ad.action and ad.nla_tracks:
        strip=ad.nla_tracks[0].strips[0];ad.action=strip.action;ad.action_slot=strip.action_slot
        for track in ad.nla_tracks:track.mute=True
start,end=1,1
world=bpy.data.worlds.new('Eating preview');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.24,.24,.24,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.7;scene.world=world
target=Vector((0,-.1,0))
for pos,energy in [((-3,-4,5),450),((4,2,4),300)]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=energy;o.data.size=4
    o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(-6,-.1,0) if side else (0,-6,0));cam=bpy.context.object
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=2.55;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=480;scene.render.resolution_y=520;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';folder=P/('reference-side' if side else 'reference-front');folder.mkdir(exist_ok=True)
for i in [0]:
    frame=start+(end-start)*i/36;scene.frame_set(int(frame),subframe=frame-int(frame))
    scene.render.filepath=str(folder/f'{i:03}.png');bpy.ops.render.render(write_still=True)


