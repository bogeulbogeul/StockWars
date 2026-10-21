import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-somangi-base-v1/Anna-shared-base.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];leaf=bpy.data.objects['Anna_PlumpLeaf'];walk=rig.animation_data.action
original={o.name:[tuple(v.co) for v in o.data.vertices] for o in bpy.data.objects if o.type=='MESH' and o.name!='Preview_Ground'}
rig.animation_data.action=None
for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
bpy.context.view_layer.objects.active=rig;bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
b=rig.data.edit_bones.new('Leaf_Stem');b.head=(0,0,.94);b.tail=(.055,0,1.025);b.parent=rig.data.edit_bones['Head']
b=rig.data.edit_bones.new('Leaf_Tip');b.head=(.055,0,1.025);b.tail=(.34,0,1.15);b.parent=rig.data.edit_bones['Leaf_Stem'];b.use_connect=True
bpy.ops.object.mode_set(mode='OBJECT')
leaf.vertex_groups.clear();groups={n:leaf.vertex_groups.new(name=n) for n in ['Head','Leaf_Stem','Leaf_Tip']}
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
for v in leaf.data.vertices:
 z=v.co.z;x=v.co.x;stem=smooth(.945,.995,z);tip=smooth(.015,.19,x)*smooth(.975,1.04,z)
 for n,w in [('Head',1-stem),('Leaf_Stem',stem*(1-tip)),('Leaf_Tip',stem*tip)]:
  if w>0:groups[n].add([v.index],w,'REPLACE')

def rotate(n,axis,degrees):
 pb=rig.pose.bones[n];b=pb.bone.matrix_local.to_quaternion();pb.rotation_quaternion=b.inverted()@Quaternion(axis,math.radians(degrees))@b
moods={}
for name,frames in [('Leaf_Calm',65),('Leaf_Happy',25),('Leaf_Sad',65)]:
 a=bpy.data.actions.new(name);rig.animation_data.action=a
 for f in range(1,frames+1):
  t=(f-1)/(frames-1);phase=math.sin(t*math.tau)
  if name=='Leaf_Calm':stem=2*phase;tip=3*math.sin(t*math.tau+.4)
  elif name=='Leaf_Happy':stem=-7+5*phase;tip=-10+9*math.sin(t*math.tau-.4)
  else:stem=10+1.5*phase;tip=23+2*math.sin(t*math.tau-.3)
  rotate('Leaf_Stem',(0,1,0),stem);rotate('Leaf_Tip',(0,1,0),tip)
  for n in ['Leaf_Stem','Leaf_Tip']:rig.pose.bones[n].keyframe_insert('rotation_quaternion',frame=f,group=n)
 a.use_fake_user=True;moods[name]=a
walk.use_fake_user=True;rig.animation_data.action=walk;s.frame_set(7)
cam=s.camera;target=Vector((.16,0,1.045));cam.location=target+Vector((0,-4,.12));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=.92
s.render.resolution_x=480;s.render.resolution_y=480;s.cycles.samples=16
parts=[o for o in bpy.data.objects if o.type=='MESH' and o.name in original]
for o in parts:assert original[o.name]==[tuple(v.co) for v in o.data.vertices]
rig.animation_data.action=walk;s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-leaf-moods.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-leaf-moods.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
report={'mesh_vertices_unchanged':True,'original_walk_preserved':True,'leaf_bones':['Leaf_Stem','Leaf_Tip'],'mood_clips':list(moods),'notes':'Leaf-only channels; may overlay walking. Game emotion state is not connected.'}
# Evaluate full loop, ensure the attachment at the head stays fixed.
root_ids=[v.index for v in leaf.data.vertices if v.co.z<.945];drift=0;loop=0
for name,a in moods.items():
 rig.animation_data.action=a
 for pb in rig.pose.bones:
  if not pb.name.startswith('Leaf_'):pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
 frames=25 if name=='Leaf_Happy' else 65;start=None
 for f in range(1,frames+1):
  s.frame_set(f);ev=leaf.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();coords=[v.co.copy() for v in m.vertices]
  drift=max(drift,max((coords[i]-leaf.data.vertices[i].co).length for i in root_ids))
  if start is None:start=coords
  if f==frames:loop=max(loop,max((a-b).length for a,b in zip(start,coords)))
  ev.to_mesh_clear()
 for j in range(12):
  f=1+j*(frames-1)//12;s.frame_set(f);s.render.filepath=str(P/(name+'-%02d.png'%j));bpy.ops.render.render(write_still=True)
report['attachment_max_drift']=drift;report['loop_max_error']=loop;assert drift<1e-6 and loop<1e-5
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
