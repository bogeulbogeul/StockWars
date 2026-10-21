import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-meshy-short-vest-v7/Anna-meshy-short-vest.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];body=bpy.data.objects['Somangi_Body'];torso=bpy.data.objects['Eating_Torso'];seat_delta=.002-min(v.co.z for v in torso.data.vertices)
foot_ids={side:[v.index for v in body.data.vertices if v.co.z<-.84 and (v.co.x>0 if side=='L' else v.co.x<0)] for side in ['L','R']}
def rot(n,angle):
 pb=rig.pose.bones[n];q=pb.bone.matrix_local.to_quaternion();pb.rotation_quaternion=q.inverted()@Quaternion((1,0,0),math.radians(angle))@q

def pose(a):
 for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
 for side in ['L','R']:rot('Leg.'+side,-76*a);rot('Arm.'+side,-9*a)
 pb=rig.pose.bones['Root'];pb.location=pb.bone.matrix_local.to_3x3().inverted()@Vector((0,0,seat_delta*a));bpy.context.view_layer.update()
 ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
 for side,ids in foot_ids.items():
  center=sum((m.vertices[i].co for i in ids),Vector())/len(ids)
  delta=Vector((0,(-.42-center.y)*a,(.16-center.z)*a));pb=rig.pose.bones['Leg.'+side];pb.location=pb.bone.matrix_local.to_3x3().inverted()@delta
 ev.to_mesh_clear()
for name,fn in [('Bench_SitDown',lambda t:t*t*(3-2*t)),('Bench_Seated',lambda t:1),('Bench_StandUp',lambda t:1-t*t*(3-2*t))]:
 a=bpy.data.actions.new(name);rig.animation_data.action=a
 for f in range(1,26):
  pose(fn((f-1)/24))
  for pb in rig.pose.bones:
   if pb.name.startswith('Leaf_'):continue
   pb.keyframe_insert('rotation_quaternion',frame=f,group=pb.name);pb.keyframe_insert('location',frame=f,group=pb.name)
 a.use_fake_user=True
rig['body_height_without_leaf']=1.899797;rig['seat_height_Bench_Seated']=0.0;rig['scale_reference']='Somangi base mesh; do not normalize by leaf-inclusive bounding box'
rig.animation_data.action=bpy.data.actions['Bench_Seated'];s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-size-sit-matched.blend'))
base=[bpy.data.objects[n] for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']];accessories=[bpy.data.objects[n] for n in ['Anna_PlumpLeaf','Anna_Vest']]
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in base+accessories:o.select_set(True)
bpy.context.view_layer.objects.active=rig;bpy.ops.export_scene.gltf(filepath=str(P/'Anna-size-sit-matched.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_extras=True,export_cameras=False,export_lights=False)
source=(P/'filter-clips.py').read_text().replace('Anna-leaf-moods.glb','Anna-size-sit-matched.glb');exec(compile(source,str(P/'filter-clips.py'),'exec'))
# Equal-scale reference is the exact current shared Somangi body, without Anna accessories.
ref=rig.copy();ref.data=rig.data.copy();ref.name='Somangi_Comparison_Rig';bpy.context.collection.objects.link(ref);refs=[]
for o in base:
 ob=o.copy();ob.data=o.data.copy();ob.name='Reference_'+o.name;bpy.context.collection.objects.link(ob);world=ob.matrix_world.copy();ob.parent=ref;ob.matrix_world=world
 for mod in ob.modifiers:
  if mod.type=='ARMATURE':mod.object=ref
 # Preserve eyes and smile, recoloring the warm face texture back to neutral.
 if o.name=='Somangi_Body':
  with bpy.data.libraries.load(str(P.parent/'somangi-walk-v4/somangi-walk.blend'),link=False) as (a,b):b.materials=['Material_0']
  ob.data.materials.clear();ob.data.materials.append(b.materials[0])
 else:
  mat=bpy.data.materials.new('Reference white');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.9,.9,.9,1);bs.inputs['Roughness'].default_value=.82;ob.data.materials.clear();ob.data.materials.append(mat)
 refs.append(ob)
rig.location.x=-.78;ref.location.x=.78;bpy.context.view_layer.update()
# Both cushions share the exact z=0 seat plane.
for x in [-.78,.78]:
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,0,-.08));c=bpy.context.object;c.scale=(1.45,1.2,.16);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);m=c.modifiers.new('Rounded seat','BEVEL');m.width=.06;m.segments=4
 mat=bpy.data.materials.new('Sage seat');mat.diffuse_color=(.3,.4,.3,1);mat.use_nodes=True;mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.3,.4,.3,1);c.data.materials.append(mat)
s.render.resolution_x=1100;s.render.resolution_y=800;s.camera.data.ortho_scale=3.5;target=Vector((0,0,.8))
for name,pos in [('comparison-front',(0,-6,.8)),('comparison-angle',(2,-6,2.1))]:
 cam=s.camera;cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'comparison.blend'))
(P/'match.json').write_text(json.dumps({'body_scale_both':1,'body_meshes_identical':True,'seat_plane_both':0,'leg_rotation_degrees':-76,'foot_center_y':-.42,'foot_center_z':.16,'leaf_excluded_from_scale_reference':True,'note':'Existing legacy bench model and current shared torso have different seating rigs. New common bench clips use current shared body for both.'},indent=2))
