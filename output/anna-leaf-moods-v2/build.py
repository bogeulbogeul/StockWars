import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-leaf-moods-v1/Anna-leaf-moods.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];leaf=bpy.data.objects['Anna_PlumpLeaf']
# A rigid leaf pivots at its attachment; no mixed weights anywhere on the leaf.
leaf.vertex_groups.clear();g=leaf.vertex_groups.new(name='Leaf_Stem');g.add(list(range(len(leaf.data.vertices))),1,'REPLACE')
rig.animation_data.action=None
for a in list(bpy.data.actions):
 if a.name.startswith('Leaf_'):bpy.data.actions.remove(a)
for pb in rig.pose.bones:pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
for name,count,center,amount in [('Leaf_Calm',65,0,3),('Leaf_Happy',25,-10,8),('Leaf_Sad',65,16,2)]:
 a=bpy.data.actions.new(name);rig.animation_data.action=a
 for f in range(1,count+1):
  angle=center+amount*math.sin((f-1)/(count-1)*math.tau);pb=rig.pose.bones['Leaf_Stem'];b=pb.bone.matrix_local.to_quaternion();pb.rotation_quaternion=b.inverted()@Quaternion((0,1,0),math.radians(angle))@b
  pb.keyframe_insert('rotation_quaternion',frame=f,group='Leaf_Stem')
 a.use_fake_user=True
rig.animation_data.action=bpy.data.actions['Walk_InPlace'];s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-leaf-moods.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']:bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-leaf-moods.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
import runpy
runpy.run_path(str(P/'filter-clips.py'))
base=[v.co.copy() for v in leaf.data.vertices];error=0;loop=0
for name,count in [('Leaf_Calm',65),('Leaf_Happy',25),('Leaf_Sad',65)]:
 rig.animation_data.action=bpy.data.actions[name]
 for pb in rig.pose.bones:pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
 start=None
 for f in range(1,count+1):
  s.frame_set(f);ev=leaf.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();co=[v.co.copy() for v in m.vertices];ev.to_mesh_clear()
  transform=rig.pose.bones['Leaf_Stem'].matrix@rig.data.bones['Leaf_Stem'].matrix_local.inverted()
  error=max(error,max((v-transform@old).length for v,old in zip(co,base)))
  if start is None:start=co
  if f==count:loop=max(loop,max((a-b).length for a,b in zip(start,co)))
 for j in range(12):
  s.frame_set(1+j*(count-1)//12);s.render.filepath=str(P/(name+'-%02d.png'%j));bpy.ops.render.render(write_still=True)
assert error<1e-6 and loop<1e-5
(P/'validation.json').write_text(json.dumps({'rigid_leaf_transform_error':error,'loop_error':loop,'leaf_weights':'100% Leaf_Stem','mesh_shape_preserved':True},indent=2));print('RIGID_LEAF',error,loop)
