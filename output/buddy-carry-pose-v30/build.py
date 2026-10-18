import bpy,math
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-walk-heat-v15/buddy-walk-heat.blend'))
rig=bpy.data.objects['Buddy_Rig'];s=bpy.context.scene
rig.animation_data_clear()
for pb in rig.pose.bones:
    pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
for name in ['Arm.L','Arm.R']:
    pb=rig.pose.bones[name];b=pb.bone.matrix_local.to_quaternion()
    pb.rotation_quaternion=b.inverted()@Quaternion((1,0,0),math.radians(-18))@b
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.32,-.43))
box=bpy.context.object;box.name='Carry_Box';box.scale=(.84,.40,.40)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
mat=bpy.data.materials.new('Cardboard');mat.diffuse_color=(.62,.39,.19,1);box.data.materials.append(mat)
bevel=box.modifiers.new('Soft edges','BEVEL');bevel.width=.015;bevel.segments=3
# Simple tape band makes orientation clear without added surface detail.
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.32,-.227))
tape=bpy.context.object;tape.name='Box_Tape';tape.scale=(.10,.405,.004)
tm=bpy.data.materials.new('Tape');tm.diffuse_color=(.82,.65,.41,1);tape.data.materials.append(tm)
s.frame_start=1;s.frame_end=1;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-carry-pose.blend'))
s.render.resolution_x=560;s.render.resolution_y=560
for name,pos in [('front',(0,-7,-.02)),('angle',(3,-7,1.15)),('side',(7,0,-.02))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
