import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-vest-fit-v3/Anna-vest-fit.blend'))
meshes=[o for o in bpy.data.objects if o.type=='MESH'];original={o.name:[tuple(v.co) for v in o.data.vertices] for o in meshes}
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='Anna_Rig'
bpy.ops.object.mode_set(mode='EDIT');eb=rig.data.edit_bones;eb.remove(eb[0])
spec=[('Root',(0,0,-.95),(0,0,-.78),None),('Body',(0,0,-.65),(0,0,-.13),'Root'),('Head',(0,0,-.10),(0,0,.6),'Body'),('Arm.L',(.29,0,-.17),(.65,0,-.17),'Body'),('Arm.R',(-.29,0,-.17),(-.65,0,-.17),'Body'),('Leg.L',(.15,0,-.65),(.15,0,-.93),'Root'),('Leg.R',(-.15,0,-.65),(-.15,0,-.93),'Root')]
for n,h,t,parent in spec:
 b=eb.new(n);b.head=h;b.tail=t
 if parent:b.parent=eb[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True

def smooth(a,b,v):
 t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)
for o in meshes:
 groups={n:o.vertex_groups.new(name=n) for n,_,_,_ in spec}
 for v in o.data.vertices:
  x,y,z=v.co;w={'Body':1}
  if o.name=='Anna_PlumpLeaf':w={'Head':1}
  elif o.name=='Anna_BaseBody':
   if abs(x)>.255 and -.36<z<-.025:
    a=smooth(.255,.43,abs(x));w={'Arm.L' if x>0 else 'Arm.R':a,'Body':1-a}
   elif z>-.13:
    a=smooth(-.13,-.08,z);w={'Head':a,'Body':1-a}
   elif z<-.70:
    a=smooth(-.70,-.77,z);w={'Leg.L' if x>0 else 'Leg.R':a,'Body':1-a}
  for n,value in w.items():
   if value>0:groups[n].add([v.index],value,'REPLACE')
 mod=o.modifiers.new('Anna skin','ARMATURE');mod.object=rig;mod.use_deform_preserve_volume=True;o.parent=rig

def rot(n,q):
 pb=rig.pose.bones[n];basis=pb.bone.matrix_local.to_quaternion();pb.rotation_mode='QUATERNION';pb.rotation_quaternion=basis.inverted()@q@basis

def pose(t,walk):
 for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
 for side,sign in [('L',1),('R',-1)]:
  phase=(t+(0 if side=='L' else .5))%1
  if phase<.5:pitch=-24+96*phase
  else:
   u=(phase-.5)*2;pitch=24-48*(u*u*(3-2*u))
  if not walk:pitch=0
  rot('Leg.'+side,Quaternion((1,0,0),math.radians(pitch)))
  swing=sign*math.cos(t*math.tau)*18 if walk else 0
  rot('Arm.'+side,Quaternion((1,0,0),math.radians(swing))@Quaternion((0,1,0),math.radians(0 if globals().get('baked',False) else sign*60)))
 # Root translation keeps the lowest evaluated foot on the original floor.
 bpy.context.view_layer.update();body=bpy.data.objects['Anna_BaseBody'];ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
 bottom=min(v.co.z for v in m.vertices);ev.to_mesh_clear();delta=-.9505959749-bottom
 pb=rig.pose.bones['Root'];pb.location=pb.bone.matrix_local.to_3x3().inverted()@Vector((0,0,delta))
# Bake the lowered arm rest pose before small walking rotations, matching GLB linear skinning.
pose(0,False);bpy.context.view_layer.update()
for o in meshes:
 ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();coords=[v.co.copy() for v in m.vertices];ev.to_mesh_clear()
 for mod in list(o.modifiers):
  if mod.type=='ARMATURE':o.modifiers.remove(mod)
 for v,co in zip(o.data.vertices,coords):v.co=co
bpy.context.view_layer.objects.active=rig;bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.armature_apply(selected=False);bpy.ops.object.mode_set(mode='OBJECT')
for o in meshes:
 mod=o.modifiers.new('Anna skin','ARMATURE');mod.object=rig
original={o.name:[tuple(v.co) for v in o.data.vertices] for o in meshes}

baked=True
actions={}
for name,count,walk in [('Idle',65,False),('Walk_InPlace',25,True)]:
 rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new(name);a=rig.animation_data.action
 for f in range(1,count+1):
  pose((f-1)/(count-1),walk)
  for pb in rig.pose.bones:pb.keyframe_insert('rotation_quaternion',frame=f,group=pb.name);pb.keyframe_insert('location',frame=f,group=pb.name)
 a.use_fake_user=True;actions[name]=a
s=bpy.context.scene;s.render.fps=32;s.frame_start=1;s.frame_end=25;s.render.resolution_x=600;s.render.resolution_y=600
rig.animation_data.action=actions['Walk_InPlace'];s.frame_set(7)
for name,pos in [('front',(0,-4,.25)),('side',(4,0,.25)),('back',(0,4,.25))]:
 cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-motion.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-motion.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
assert all(original[o.name]==[tuple(v.co) for v in o.data.vertices] for o in meshes)
(P/'validation.json').write_text(json.dumps({'lowered_arm_rest_baked':True,'rest_meshes_unchanged_during_animation':True,'bones':7,'actions':list(actions),'rigid_vest_body_weight':True},indent=2))
s.render.resolution_x=420;s.render.resolution_y=420
cam=s.camera;cam.location=(2.6,-4,.3);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
for view,pos in [('front',(0,-4,.25)),('side',(4,0,.25))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
 for f in range(1,25,2):
  s.frame_set(f);s.render.filepath=str(P/(view+'-%02d.png'%f));bpy.ops.render.render(write_still=True)
