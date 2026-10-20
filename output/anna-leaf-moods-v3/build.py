import bpy,math,json,runpy
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-leaf-moods-v2/Anna-leaf-moods.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];leaf=bpy.data.objects['Anna_PlumpLeaf']
a=bpy.data.actions['Leaf_Sad'];rig.animation_data.action=None;bpy.data.actions.remove(a);a=bpy.data.actions.new('Leaf_Sad');rig.animation_data.action=a
# Character front is -Y. Tilt around +X toward the face, with a slight forward nod.
for pb in rig.pose.bones:pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
for f in range(1,66):
 t=(f-1)/64;angle=27+2*math.sin(t*math.tau);pb=rig.pose.bones['Leaf_Stem'];b=pb.bone.matrix_local.to_quaternion();pb.rotation_quaternion=b.inverted()@Quaternion((1,0,0),math.radians(angle))@b;pb.keyframe_insert('rotation_quaternion',frame=f,group=pb.name)
a.use_fake_user=True
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-leaf-moods.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']:bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-leaf-moods.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
runpy.run_path(str(P/'filter-clips.py'))
cam=s.camera;target=Vector((.13,0,1.04));cam.location=target+Vector((3,-4,.25));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=.92
s.render.resolution_x=480;s.render.resolution_y=480
for j in range(12):
 s.frame_set(1+j*64//12);s.render.filepath=str(P/('sad-%02d.png'%j));bpy.ops.render.render(write_still=True)
