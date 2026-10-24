"""Add a short straight-leg walk to the accepted model, without moving rest vertices."""
import bpy,json,math,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-story-expressions-v6/somangi-expressions.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];raw=np.array([v.co[:] for v in body.data.vertices])
rig.animation_data_clear()
for p in rig.pose.bones:p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0);p.scale=(1,1,1)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
for name,sign in [('Leg.L',1),('Leg.R',-1)]:
 b=rig.data.edit_bones.new(name);b.head=(sign*.14,0,-.56);b.tail=(sign*.14,0,-.82);b.parent=rig.data.edit_bones['Body'];b.use_connect=False
bpy.ops.object.mode_set(mode='OBJECT')
groups={name:body.vertex_groups.new(name=name) for name in ['Leg.L','Leg.R']};bg=body.vertex_groups['Body']
for v in body.data.vertices:
 if v.co.z>=-.54:continue
 t=max(0,min(1,(-v.co.z-.54)/.10));weight=t*t*(3-2*t)
 groups['Leg.L' if v.co.x>0 else 'Leg.R'].add([v.index],weight,'REPLACE')
 if weight<1:bg.add([v.index],1-weight,'REPLACE')
 else:bg.remove([v.index])
scene.render.fps=40;scene.frame_start=1;scene.frame_end=31
def world_pose(name,angle,shift=0):
 pb=rig.pose.bones[name];rest=pb.bone.matrix_local;pivot=rest.translation
 pb.rotation_mode='QUATERNION';pb.matrix=Matrix.Translation((0,0,shift))@Matrix.Translation(pivot)@Matrix.Rotation(angle,4,'X')@Matrix.Translation(-pivot)@rest
 pb.keyframe_insert('rotation_quaternion');pb.keyframe_insert('location')
for frame in range(1,32):
 scene.frame_set(frame);phase=2*math.pi*(frame-1)/30;wave=math.sin(phase)
 root=rig.pose.bones['Body'];root.location=(0,0,0)
 for side,sign in [('L',1),('R',-1)]:
  world_pose('Leg.'+side,math.radians(18)*wave*sign,.030*max(0,wave*sign))
  world_pose('Arm.'+side,-math.radians(8)*wave*sign)
 bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh();minimum=min(v.co.z for v in mesh.vertices);ev.to_mesh_clear()
 correction=-.95064157-minimum;root.location=root.bone.matrix_local.to_3x3().inverted()@Vector((0,0,correction));root.keyframe_insert('location')
rig.animation_data.action.name='Walk_InPlace'
for layer in rig.animation_data.action.layers:
 for strip in layer.strips:
  for bag in strip.channelbags:
   for curve in bag.fcurves:
    for point in curve.keyframe_points:point.interpolation='LINEAR'
scene.frame_set(1);assert np.array_equal(raw,np.array([v.co[:] for v in body.data.vertices]))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);body.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-walk.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'walk.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False)
(P/'walk-build.json').write_text(json.dumps(dict(source='somangi-story-expressions-v6',restVerticesUnchanged=True,bones=list(rig.pose.bones.keys()),seconds=.75,straightArms=True),indent=2))
