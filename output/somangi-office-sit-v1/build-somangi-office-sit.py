"""Office-seat motion on the current walk v4 body; no old body restoration."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector,Quaternion
root=Path('C:/GitHub/StockWars');out=root/'output/somangi-office-sit-v1';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/somangi-walk-v4/somangi-walk.blend'))
rig=bpy.data.objects['Somangi_Rig']
objects=[rig]+[o for o in bpy.context.scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' and m.object==rig for m in o.modifiers)]
for obj in list(bpy.context.scene.objects):
    if obj not in objects:bpy.data.objects.remove(obj,do_unlink=True)
for obj in objects:
    obj.animation_data_clear()
    if obj.type=='MESH' and obj.data.shape_keys:obj.data.shape_keys.animation_data_clear()
for bone in rig.pose.bones:
    bone.rotation_mode='QUATERNION';bone.rotation_quaternion=Quaternion();bone.location=(0,0,0);bone.scale=(1,1,1)
def points(obj):
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
    result=[evaluated.matrix_world@v.co for v in mesh.vertices];evaluated.to_mesh_clear();return result
bpy.context.view_layer.update()
rig.location.z-=min(p.z for obj in objects if obj.type=='MESH' for p in points(obj))
action=bpy.data.actions.new('Office_Sit');rig.animation_data_create();rig.animation_data.action=action
scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=25
for frame in range(1,26):
    t=(frame-1)/24;t=t*t*(3-2*t)
    for name in ['Leg.L','Leg.R']:
        bone=rig.pose.bones[name];bone.rotation_quaternion=Quaternion((1,0,0),math.radians(-72)*t)
        bone.location=bone.bone.matrix_local.to_3x3().inverted()@Vector((0,0,.12*t))
    for name in ['Arm.L','Arm.R']:
        bone=rig.pose.bones[name]
        axis=bone.bone.matrix_local.to_3x3().inverted()@Vector((1,0,0))
        bone.rotation_quaternion=Quaternion(axis,math.radians(-12)*t)
    for bone in rig.pose.bones:
        bone.keyframe_insert(data_path='location',frame=frame);bone.keyframe_insert(data_path='rotation_quaternion',frame=frame)
scene.frame_set(25);bpy.context.view_layer.update()
torso=bpy.data.objects.get('Eating_Torso')
if torso:
    torso_points=points(torso)
else:
    body=bpy.data.objects['Somangi_Body'];index=body.vertex_groups['Body'].index
    ids=[v.index for v in body.data.vertices if any(g.group==index and g.weight>.8 for g in v.groups)]
    body_points=points(body);torso_points=[body_points[i] for i in ids]
bottom=min(p.z for p in torso_points)
contact_points=[p for p in torso_points if p.z<bottom+.025]
contact=Vector(((min(p.x for p in contact_points)+max(p.x for p in contact_points))/2,
                (min(p.y for p in contact_points)+max(p.y for p in contact_points))/2,bottom))
metadata={'clip':'Office_Sit','duration':1,'contact':[contact.x,contact.z,-contact.y],
          'source':'somangi-walk-v4','scale':100/1.95,'seatHeight':49}
(out/'office-sit.json').write_text(json.dumps(metadata,indent=2))
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Somangi-office-sit.blend'))
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'Somangi-office-sit.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='ACTIVE_ACTIONS',export_frame_range=True)
exec(compile((root/'scratch/name-office-sit-clip.py').read_text(),'<clip-name>','exec'))
# Inspect the actual seat alignment in the same native scale as the chair.
holder=bpy.data.objects.new('Seat_Fit_Preview',None);bpy.context.collection.objects.link(holder)
holder.scale=(1/1.95,)*3
for obj in objects:
    if obj.parent not in objects:obj.parent=holder
holder.location=Vector((0,-.035,.491))-contact/1.95
bpy.ops.import_scene.gltf(filepath=str(root/'output/cipher-office-chair-v1/Cipher-office-chair.glb'))
scene.frame_set(25)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Chair-somangi-preview.blend'))
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.7
bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=400;bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2,-3,1.8));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.8))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=1.8;scene.camera=camera
scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'seated-preview.png');bpy.ops.render.render(write_still=True)
print('SEAT_METADATA',json.dumps(metadata))
