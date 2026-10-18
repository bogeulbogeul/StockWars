import bpy,math
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-walk-heat-v15/buddy-walk-heat.blend'))
rig=bpy.data.objects['Buddy_Rig'];s=bpy.context.scene
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Eat_Small_Bite')
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,radius=.095)
food=bpy.context.object;food.name='Food_Preview';food.scale=(1,.8,.75)
mat=bpy.data.materials.new('Bread');mat.diffuse_color=(.78,.45,.19,1);food.data.materials.append(mat)
for face in food.data.polygons:face.use_smooth=True
def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
def rot(name,deg,axis=(1,0,0)):
    pb=rig.pose.bones[name];q=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION'
    pb.rotation_quaternion=q.inverted()@Quaternion(axis,math.radians(deg))@q
hand_rest=Vector((.51,-.055,-.405))
for f in range(1,97):
    t=(f-1)/96;a=ease((t-.08)/.25)*(1-ease((t-.72)/.26))
    chew=math.sin(t*math.tau*5)*max(0,1-abs(t-.53)/.19)
    for pb in rig.pose.bones:
        pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
    rot('Arm.L',-18-25*a)
    rot('Head',12*a+1.2*chew);rot('Body',3*a)
    bpy.context.view_layer.update()
    pb=rig.pose.bones['Arm.L']
    food.location=(pb.matrix@pb.bone.matrix_local.inverted())@hand_rest+Vector((-.025,-.045,.055))
    food.keyframe_insert(data_path='location',frame=f)
    for pb in rig.pose.bones:
        pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=pb.name)
        pb.keyframe_insert(data_path='location',frame=f,group=pb.name)
s.frame_start=1;s.frame_end=96;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-eat.blend'))
s.render.resolution_x=560;s.render.resolution_y=560
for name,pos in [('angle',(3,-7,1.15)),('side',(7,0,-.02))]:
    cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat('-Z','Y').to_euler()
    folder=P/name;folder.mkdir(exist_ok=True)
    for f in range(1,97,3):
        s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
