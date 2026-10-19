import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-v3/somangi-eat.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];head=bpy.data.objects['Somangi_Body'];rig.animation_data_clear()
bpy.data.objects.remove(bpy.data.objects['Food_Bun'],do_unlink=True)
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones['Food']);bpy.ops.object.mode_set(mode='OBJECT')
image=bpy.data.images.load(str(P.parent/'somangi-smile-v2/happy-basecolor.png'));image.pack();bs=head.data.materials[0].node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].links[0].from_node.image=image
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Wave_Happy')
def smooth(a,b,t):
 u=max(0,min(1,(t-a)/(b-a)));return u*u*(3-2*u)
def world_rotation(name,q):
 pb=rig.pose.bones[name];basis=pb.bone.matrix_local.to_quaternion();pb.rotation_quaternion=basis.inverted()@q@basis
native=Vector((.566,-.015,-.387))-rig.data.bones['Arm.L'].head_local
rows=[]
for frame in range(1,62):
 t=(frame-1)/60
 for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
 lift=smooth(.08,.25,t)*(1-smooth(.78,.96,t));wave=smooth(.25,.30,t)*(1-smooth(.70,.77,t))*math.sin(6*math.pi*(t-.25)/.5)
 angle=math.radians(22+10*wave);raised=Vector((math.cos(angle),-.40,math.sin(angle))).normalized()
 target=native.normalized().lerp(raised,lift).normalized();world_rotation('Arm.L',native.rotation_difference(target))
 world_rotation('Head',Quaternion((0,1,0),math.radians(-5*lift)))
 for pb in rig.pose.bones:pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name);pb.keyframe_insert('location',frame=frame,group=pb.name)
 rows.append({'frame':frame,'lift':lift,'wave':wave})
s.frame_start=1;s.frame_end=61;s.render.fps=24;s.frame_set(25);s.render.resolution_x=640;s.render.resolution_y=640;s.cycles.samples=16;cam=s.camera;target=Vector((0,-.05,0))
for name,pos in [('wave-front',(0,-6,0)),('wave-side',(6,-.1,0)),('wave-angle',(2.5,-6,.7))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.7;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-wave.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-wave.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
(P/'motion.json').write_text(json.dumps(rows,indent=2));print('WAVE_COMPLETE')
