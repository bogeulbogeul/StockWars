import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-wave-v3/somangi-wave.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];mesh=bpy.data.objects['Somangi_Body'];rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
image=bpy.data.images.load(str(P.parent/'somangi-smile-v1/base-original.png'));image.pack();mesh.data.materials[0].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].links[0].from_node.image=image
sole={side:[v.index for v in mesh.data.vertices if v.co.z<-.88 and (v.co.x>0 if side=='L' else v.co.x<0)] for side in ['L','R']};ground=min(v.co.z for v in mesh.data.vertices)
def rotate(name,q):
 pb=rig.pose.bones[name];basis=pb.bone.matrix_local.to_quaternion();pb.rotation_quaternion=basis.inverted()@q@basis
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Walk_InPlace');rows=[]
for frame in range(1,26):
 t=(frame-1)/24
 for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
 pitches={}
 for side,phase in [('L',t%1),('R',(t+.5)%1)]:
  if phase<.5:pitch=-24+96*phase
  else:
   u=(phase-.5)*2;pitch=24-48*(u*u*(3-2*u))
  pitches[side]=pitch;rotate('Leg.'+side,Quaternion((1,0,0),math.radians(pitch)))
 bpy.context.view_layer.update();sole_heights={}
 for side in ['L','R']:
  pb=rig.pose.bones['Leg.'+side];transform=pb.matrix@pb.bone.matrix_local.inverted();sole_heights[side]=min((transform@mesh.data.vertices[i].co).z for i in sole[side])
 root_height=ground-min(sole_heights.values());rig.pose.bones['Root'].location=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((0,0,root_height))
 rotate('Arm.L',Quaternion((1,0,0),math.radians(18*math.cos(t*math.tau))));rotate('Arm.R',Quaternion((1,0,0),math.radians(-18*math.cos(t*math.tau))))
 for pb in rig.pose.bones:pb.keyframe_insert('location',frame=frame,group=pb.name);pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
 rows.append({'frame':frame,'pitch':pitches,'root_height':root_height})
s.frame_start=1;s.frame_end=25;s.render.fps=32;s.frame_set(7);s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=16;cam=s.camera;target=Vector((0,-.1,0))
for name,pos in [('walk-front',(0,-6,0)),('walk-side',(6,-.1,0))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.7;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-walk.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-walk.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
(P/'motion.json').write_text(json.dumps(rows,indent=2));print('LARGER_WALK_COMPLETE')
