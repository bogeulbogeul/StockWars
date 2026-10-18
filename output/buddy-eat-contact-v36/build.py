import bpy,math
from pathlib import Path
from mathutils import Quaternion,Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-eat-v35/buddy-eat.blend'))
rig=bpy.data.objects['Buddy_Rig'];s=bpy.context.scene;food=bpy.data.objects['Food_Preview']
rig.animation_data_clear();food.animation_data_clear()
for pb in rig.pose.bones:
    pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
def rot(name,q):
    pb=rig.pose.bones[name];b=pb.bone.matrix_local.to_quaternion();pb.rotation_quaternion=b.inverted()@q@b
rot('Arm.L',Quaternion((0,0,1),math.radians(-38))@Quaternion((1,0,0),math.radians(-63)))
rot('Head',Quaternion((0,0,1),math.radians(28))@Quaternion((1,0,0),math.radians(27)))
bpy.context.view_layer.update()
head=rig.pose.bones['Head'];headmat=head.matrix@head.bone.matrix_local.inverted()
mouth=headmat@Vector((.05,-.405,.105))
bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1,location=mouth)
marker=bpy.context.object;marker.name='Temporary_Mouth_Guide';marker.scale=(.026,.008,.013)
marker.rotation_euler=headmat.to_euler()
mat=bpy.data.materials.new('Mouth_Guide');mat.diffuse_color=(.11,.065,.04,1);marker.data.materials.append(mat)
hand=rig.pose.bones['Arm.L'];handmat=hand.matrix@hand.bone.matrix_local.inverted()
food.location=handmat@Vector((.51,-.055,-.405))+Vector((-.025,-.045,.055))
s.frame_start=1;s.frame_end=1;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-eat-contact.blend'))
s.render.resolution_x=600;s.render.resolution_y=600
for name,pos in [('angle',(3,-7,1.15)),('side',(7,0,-.02)),('front',(0,-7,-.02))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
print('FOOD_MOUTH_DISTANCE',(food.location-mouth).length)
