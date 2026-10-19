import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-wave-v3/somangi-wave.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];head=bpy.data.objects['Somangi_Body'];rig.animation_data_clear()
for action in list(bpy.data.actions):bpy.data.actions.remove(action)
image=bpy.data.images.load(str(P.parent/'somangi-smile-v1/base-original.png'));image.pack();head.data.materials[0].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].links[0].from_node.image=image
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Jump')
def rotate(name,q):
 pb=rig.pose.bones[name];basis=pb.bone.matrix_local.to_quaternion();pb.rotation_quaternion=basis.inverted()@q@basis
def move(name,vector):rig.pose.bones[name].location=rig.data.bones[name].matrix_local.to_3x3().inverted()@Vector(vector)
rows=[]
for frame in range(1,38):
 t=(frame-1)/36
 for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
 airborne=.25<t<.75;u=max(0,min(1,(t-.25)/.5));height=.45*4*u*(1-u) if airborne else 0
 crouch=.055*math.sin(math.pi*t/.25) if t<=.25 else .045*math.sin(math.pi*(t-.75)/.25) if t>=.75 else 0
 move('Root',(0,0,height-crouch))
 for side,sign in [('L',1),('R',-1)]:
  move('Leg.'+side,(0,0,crouch));rotate('Leg.'+side,Quaternion((1,0,0),math.radians(8*math.sin(math.pi*u) if airborne else 0)))
  spread=30*math.sin(math.pi*u) if airborne else 6*crouch/.055
  rotate('Arm.'+side,Quaternion((0,1,0),math.radians(-sign*spread)))
 rotate('Head',Quaternion((1,0,0),math.radians(4*crouch/.055)))
 for pb in rig.pose.bones:pb.keyframe_insert('location',frame=frame,group=pb.name);pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
 rows.append({'frame':frame,'airborne':airborne,'jump_height':height,'crouch':crouch})
s.frame_start=1;s.frame_end=37;s.render.fps=24;s.frame_set(19);s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=16;cam=s.camera;target=Vector((0,-.1,.18))
for name,pos in [('jump-front',(0,-6,.18)),('jump-side',(6,-.1,.18)),('jump-angle',(2.5,-6,.8))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.9;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-jump.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-jump.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
(P/'motion.json').write_text(json.dumps(rows,indent=2));print('JUMP_COMPLETE')
