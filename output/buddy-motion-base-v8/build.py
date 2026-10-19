import bpy, math,json
from pathlib import Path
from mathutils import Quaternion,Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'spirit-walk-original-v4/buddy-gentle-walk.blend'))
rig=bpy.data.objects['Buddy_Rig'];mesh=bpy.data.objects['Buddy_Original'];scene=bpy.context.scene
original=[tuple(v.co) for v in mesh.data.vertices]
walk=rig.animation_data.action;walk.name='Walk'
def rot(n,deg,axis=(1,0,0)):
    pb=rig.pose.bones[n];q=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION'
    pb.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(deg))@q
def reset():
    for pb in rig.pose.bones:
        pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
def ease(t):return t*t*(3-2*t)
def greet(t):
    a=math.sin(math.pi*t)**2
    rot('Body',9*a);rot('Head',7*a);rot('Arm.L',-7*a);rot('Arm.R',-7*a)
def eat(t):
    a=math.sin(math.pi*t)**2
    rot('Arm.L',-47*a);rot('Arm.R',-47*a)
    rot('Arm.L',-47*a)
    rot('Head',12*a);rot('Body',4*a)
def sit(t):
    a=ease(min(1,t*3))
    rot('Leg.L',-68*a);rot('Leg.R',-68*a)
    rot('Body',-5*a);rot('Head',5*a)
    rig.pose.bones['Root'].location.z=-.23*a
actions={'Walk':walk}
for name,fn in [('Greeting',greet),('Eat',eat),('Sit',sit)]:
    a=bpy.data.actions.new(name);rig.animation_data.action=a;actions[name]=a
    for f in range(1,66):
        reset();fn((f-1)/64)
        for pb in rig.pose.bones:
            pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=pb.name)
            pb.keyframe_insert(data_path='location',frame=f,group=pb.name)
    a.use_fake_user=True
for name,a in actions.items():
    a.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,a);track.mute=True
rig.animation_data.action=walk;scene.frame_set(1);scene.frame_start=1;scene.frame_end=32
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-motion-base.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'buddy-motion-base.glb'),use_selection=True,export_format='GLB',export_animation_mode='ACTIONS')
scene.render.resolution_x=480;scene.render.resolution_y=480
for name,a in actions.items():
    rig.animation_data.action=a
    folder=P/name;folder.mkdir(exist_ok=True)
    end=32 if name=='Walk' else 64
    for f in range(1,end+1,4):
        scene.frame_set(f);scene.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
assert original==[tuple(v.co) for v in mesh.data.vertices]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'buddy-motion-base.glb'))
assert len(bpy.data.actions)==4
(P/'validation.json').write_text(json.dumps({'geometry_unchanged':True,'actions':[a.name for a in bpy.data.actions],'export_reimport':True},indent=2))
