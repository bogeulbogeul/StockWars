import bpy,math
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-carry-stack-v33/buddy-stacked-carry.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Buddy_Rig']
props=[o for o in s.objects if o.name.startswith(('Carry_Box','Stacked_Box','Box_Tape','Stacked_Tape'))]
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.76,-.565))
tray=bpy.context.object;tray.name='Carry_Tray';tray.scale=(.98,1.03,.045)
mat=bpy.data.materials.new('Tray');mat.diffuse_color=(.24,.16,.10,1);tray.data.materials.append(mat)
bevel=tray.modifiers.new('Rounded rim','BEVEL');bevel.width=.02;bevel.segments=3
props.append(tray)
bpy.ops.object.empty_add(location=(0,0,0));carrier=bpy.context.object;carrier.name='Preview_Movement'
rig.parent=carrier
for o in props:o.parent=carrier
base={o.name:o.location.copy() for o in props}
for f in range(1,97):
    t=(f-1)/96;phase=t*math.tau*3;step=math.sin(phase)
    # Side view preview of a short outbound/return trip.
    travel=-.65*math.sin(t*math.tau)
    carrier.location=(0,travel,.008*(1-math.cos(phase*2)))
    for n,sign in [('Leg.L',1),('Leg.R',-1)]:
        pb=rig.pose.bones[n];q=pb.bone.matrix_local.to_quaternion()
        pb.rotation_mode='QUATERNION';pb.rotation_quaternion=q.inverted()@Quaternion((1,0,0),math.radians(7*sign*step))@q
        pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=n)
    carrier.keyframe_insert(data_path='location',frame=f)
    for o in props:
        o.location=base[o.name].copy()
        if o.name.startswith(('Stacked_Box','Stacked_Tape')):
            level=2 if o.name.endswith('3') else 1
            o.location.y+=.014*level*math.sin(phase-.35)
            o.rotation_euler.x=math.radians(.9*level*math.sin(phase-.35))
        o.keyframe_insert(data_path='location',frame=f)
        o.keyframe_insert(data_path='rotation_euler',frame=f)
s.frame_start=1;s.frame_end=96;s.render.fps=24;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-carry-preview.blend'))
s.render.resolution_x=640;s.render.resolution_y=560
cam=s.camera;cam.location=(7,-.1,.1);cam.data.ortho_scale=4.0
cam.rotation_euler=(Vector((0,-.35,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
folder=P/'frames';folder.mkdir(exist_ok=True)
for f in range(1,97,3):
    s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
