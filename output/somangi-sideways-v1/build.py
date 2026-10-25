import bpy,json,math,numpy as np
from pathlib import Path
from mathutils import Matrix,Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-game-v1/somangi-walk.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig']
raw=np.array([v.co[:] for v in body.data.vertices]);rig.animation_data_clear()
for bone in rig.pose.bones:
 bone.rotation_mode='QUATERNION';bone.rotation_quaternion=(1,0,0,0);bone.location=(0,0,0);bone.scale=(1,1,1)
scene.render.fps=40;scene.frame_start=1;scene.frame_end=31
def leg_pose(name,angle,lift):
 bone=rig.pose.bones[name];rest=bone.bone.matrix_local;pivot=rest.translation
 bone.matrix=Matrix.Translation((0,0,lift))@Matrix.Translation(pivot)@Matrix.Rotation(angle,4,'Y')@Matrix.Translation(-pivot)@rest
 bone.keyframe_insert('rotation_quaternion');bone.keyframe_insert('location')
for frame in range(1,32):
 scene.frame_set(frame);wave=math.sin(2*math.pi*(frame-1)/30)
 root=rig.pose.bones['Body'];root.location=(0,0,0);bpy.context.view_layer.update()
 for side,sign in [('L',1),('R',-1)]:leg_pose('Leg.'+side,math.radians(6)*wave*sign,.012*max(0,wave*sign))
 bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh();minimum=min(v.co.z for v in mesh.vertices);ev.to_mesh_clear()
 root.location=root.bone.matrix_local.to_3x3().inverted()@Vector((0,0,-.95064157-minimum));root.keyframe_insert('location')
rig.animation_data.action.name='Sideways'
for layer in rig.animation_data.action.layers:
 for strip in layer.strips:
  for bag in strip.channelbags:
   for curve in bag.fcurves:
    for key in curve.keyframe_points:key.interpolation='LINEAR'
scene.frame_set(1);assert np.array_equal(raw,np.array([v.co[:] for v in body.data.vertices]))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);body.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-sideways.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'sideways.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False)
print('SAVED SIDEWAYS: original geometry and hip weights unchanged; no new joints')
