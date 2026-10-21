import bpy,math,json,runpy
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-leaf-moods-v3/Anna-leaf-moods.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];body=bpy.data.objects['Somangi_Body'];torso=bpy.data.objects['Eating_Torso'];ground=-.950443;seated_delta=ground-min(v.co.z for v in torso.data.vertices)+.002
sole={side:[v.index for v in body.data.vertices if v.co.z<-.88 and (v.co.x>0 if side=='L' else v.co.x<0)] for side in ['L','R']}
def worldloc(n,v):
 rig.pose.bones[n].location=rig.data.bones[n].matrix_local.to_3x3().inverted()@Vector(v)
def rotate(n,deg):
 pb=rig.pose.bones[n];b=pb.bone.matrix_local.to_quaternion();pb.rotation_quaternion=b.inverted()@Quaternion((1,0,0),math.radians(deg))@b

def pose(amount):
 for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
 for side in ['L','R']:rotate('Leg.'+side,-76*amount);rotate('Arm.'+side,-9*amount)
 worldloc('Root',(0,0,seated_delta*amount));bpy.context.view_layer.update()
 ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();bottom={side:min(m.vertices[i].co.z for i in ids) for side,ids in sole.items()};ev.to_mesh_clear()
 for side in ['L','R']:worldloc('Leg.'+side,(0,0,(ground-bottom[side])))

def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
for name,count,fn in [('SitDown',25,lambda t:smooth(t)),('Seated',33,lambda t:1),('StandUp',25,lambda t:1-smooth(t)),('Sit_Demo',97,lambda t:smooth(t*3) if t<1/3 else (1 if t<2/3 else 1-smooth((t-2/3)*3)))]:
 a=bpy.data.actions.new(name);rig.animation_data.action=a
 for f in range(1,count+1):
  pose(fn((f-1)/(count-1)))
  for pb in rig.pose.bones:
   if pb.name.startswith('Leaf_'):continue
   pb.keyframe_insert('rotation_quaternion',frame=f,group=pb.name);pb.keyframe_insert('location',frame=f,group=pb.name)
 a.use_fake_user=True
s.render.fps=32;s.frame_start=1;s.frame_end=97;rig.animation_data.action=bpy.data.actions['Sit_Demo'];s.frame_set(40)
cam=s.camera;target=Vector((0,-.13,.0));cam.data.ortho_scale=2.6;s.render.resolution_x=600;s.render.resolution_y=600
for name,pos in [('front',(0,-5,.35)),('side',(5,0,.35))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-sit.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']:bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-sit.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
# Same channel filtering as the leaf asset, using the sitting model filename.
source=(P/'filter-clips.py').read_text().replace('Anna-leaf-moods.glb','Anna-sit.glb');exec(compile(source,str(P/'filter-clips.py'),'exec'))
s.render.resolution_x=420;s.render.resolution_y=420
cam.location=(2.8,-5,.7);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
for f in range(1,97,4):
 s.frame_set(f);s.render.filepath=str(P/('frame-%03d.png'%f));bpy.ops.render.render(write_still=True)
