import bpy,math
from pathlib import Path
from mathutils import Quaternion,Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'buddy-walk-connections-v11/buddy-soft-connections.blend'))
rig=bpy.data.objects['Buddy_Rig'];mesh=bpy.data.objects['Buddy_Original'];s=bpy.context.scene
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Eat')
def smooth(a,b,v):
    t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
for v in mesh.data.vertices:
    x,y,z=v.co
    if -.54<z<-.045 and abs(x)>.30:
        boundary=.30+max(0,-z-.08)*.28
        w=smooth(boundary-.07,boundary+.01,abs(x))
        if w>0:
            for g in mesh.vertex_groups:g.remove([v.index])
            mesh.vertex_groups['Arm.'+('L' if x>=0 else 'R')].add([v.index],w,'REPLACE')
            mesh.vertex_groups['Body'].add([v.index],1-w,'REPLACE')
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=.11,location=(0,-.44,-.27))
food=bpy.context.object;food.name='Food_Separate_Prop'
mat=bpy.data.materials.new('Bread');mat.diffuse_color=(.78,.43,.14,1);food.data.materials.append(mat)
for f in food.data.polygons:f.use_smooth=True
def rotation(name,q):
    pb=rig.pose.bones[name];b=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION';pb.rotation_quaternion=b.inverted()@q@b
for f in range(1,97):
    t=(f-1)/96
    lift=min(1,t/.30,(1-t)/.22);lift=max(0,lift);lift=lift*lift*(3-2*lift)
    nibble=math.sin(t*math.tau*4)*max(0,1-abs(t-.55)/.25)
    for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
    for side,sign in [('L',1),('R',-1)]:
        q=Quaternion((0,0,1),math.radians(-sign*17*lift))@Quaternion((1,0,0),math.radians(-56*lift))
        rotation('Arm.'+side,q)
    rotation('Head',Quaternion((1,0,0),math.radians(11*lift+1.8*nibble)))
    rotation('Body',Quaternion((1,0,0),math.radians(2*lift)))
    food.location=(.28,-.22-.23*lift,-.40+.23*lift+.005*nibble)
    food.keyframe_insert(data_path='location',frame=f)
    for pb in rig.pose.bones:
        pb.keyframe_insert(data_path='rotation_quaternion',frame=f,group=pb.name)
        pb.keyframe_insert(data_path='location',frame=f,group=pb.name)
s.frame_start=1;s.frame_end=96;s.render.fps=24;s.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for o in [rig,mesh,food]:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'buddy-eat.blend'))
s.render.resolution_x=540;s.render.resolution_y=540
s.camera.location=(3,-7,1.1);s.camera.rotation_euler=(Vector((0,0,-.02))-s.camera.location).to_track_quat('-Z','Y').to_euler()
folder=P/'frames';folder.mkdir(exist_ok=True)
for f in range(1,97,3):
    s.frame_set(f);s.render.filepath=str(folder/f'{f:03}.png');bpy.ops.render.render(write_still=True)
