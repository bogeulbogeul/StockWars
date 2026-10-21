import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-walk-v4/somangi-walk.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];mesh=bpy.data.objects['Somangi_Body']
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
def rotate(name,q):
    pb=rig.pose.bones[name];basis=pb.bone.matrix_local.to_quaternion()
    pb.rotation_quaternion=basis.inverted()@q@basis
def reset():
    for pb in rig.pose.bones:
        pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
arms={}
for side,sign in [('L',1),('R',-1)]:
    bone=rig.data.bones['Arm.'+side]
    original=bone.tail_local-bone.head_local
    target=Vector((sign*.12,-.40,-.27))-bone.head_local
    arms[side]=original.rotation_difference(target)
sole={side:[v.index for v in mesh.data.vertices if v.co.z<-.88 and (v.co.x>0 if side=='L' else v.co.x<0)] for side in ['L','R']}
ground=min(v.co.z for v in mesh.data.vertices)
def pose(amount,t=None,direction=1):
    reset()
    for side in ['L','R']:rotate('Arm.'+side,Quaternion().slerp(arms[side],amount))
    if t is not None:
        for side,phase in [('L',t%1),('R',(t+.5)%1)]:
            pitch=-10+40*phase if phase<.5 else 10-20*((phase-.5)*2)**2*(3-2*((phase-.5)*2))
            rotate('Leg.'+side,Quaternion((0,1,0),math.radians(direction*pitch)))
            lift=.018*math.sin(math.pi*(phase-.5)*2)**2 if phase>.5 else 0
            pb=rig.pose.bones['Leg.'+side]
            pb.location=pb.bone.matrix_local.to_3x3().inverted()@Vector((0,0,lift))
    bpy.context.view_layer.update()
    heights=[]
    for side in ['L','R']:
        pb=rig.pose.bones['Leg.'+side];mat=pb.matrix@pb.bone.matrix_local.inverted()
        heights.append(min((mat@mesh.data.vertices[i].co).z for i in sole[side]))
    rig.pose.bones['Root'].location=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((0,0,ground-min(heights)))
    rotate('Root',Quaternion((0,0,1),math.pi*.5*amount))
for name,count in [('Crab_Enter',13),('Crab_Right',25),('Crab_Left',25),('Crab_Exit',13)]:
    rig.animation_data_create();action=bpy.data.actions.new(name);rig.animation_data.action=action;action.use_fake_user=True
    for frame in range(1,count+1):
        t=(frame-1)/(count-1);amount=t*t*(3-2*t)
        if name=='Crab_Exit':amount=1-amount
        walking=name in ['Crab_Right','Crab_Left']
        pose(1 if walking else amount,t if walking else None,-1 if name=='Crab_Left' else 1)
        for pb in rig.pose.bones:
            pb.keyframe_insert('location',frame=frame,group=pb.name);pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
rig.animation_data.action=bpy.data.actions['Crab_Enter'];s.frame_set(1)
s.frame_start=1;s.frame_end=25;s.render.fps=24
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-crab-walk.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-crab-walk.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
print('CRAB_WALK_BUILT')
