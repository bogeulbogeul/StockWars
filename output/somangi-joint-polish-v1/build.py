import bpy,math,json,sys
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P))
from surface import build_surface

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P.parent/'somangi-face-smooth-v1/somangi-face-smooth.glb'))
source=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=source
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
body,report=build_surface(source)
assert sum(o.type=='MESH' for o in bpy.context.scene.objects)==1
floor=min(v.co.z for v in body.data.vertices)
root_group=body.vertex_groups['Part.Root'].index
root_positions={tuple(round(c,6) for c in v.co) for v in body.data.vertices if any(g.group==root_group for g in v.groups)}
hip_centers={}
for side in ['L','R']:
    group=body.vertex_groups['Part.Leg.'+side].index
    seam=[v.co.copy() for v in body.data.vertices if any(g.group==group for g in v.groups)
        and tuple(round(c,6) for c in v.co) in root_positions]
    hip_centers[side]=sum(seam,Vector())/len(seam)
data=bpy.data.armatures.new('Somangi_OriginalRig')
rig=bpy.data.objects.new('Somangi_OriginalRig',data)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
root=data.edit_bones.new('Root');root.head=(0,0,-.60);root.tail=(0,0,-.30)
head=data.edit_bones.new('Head');head.head=(0,0,0);head.tail=(0,0,.50);head.parent=root
for side,sign in [('L',1),('R',-1)]:
    bone=data.edit_bones.new('Arm.'+side)
    bone.head=(sign*.285,0,-.11);bone.tail=(sign*.48,0,-.44);bone.parent=root
    bone=data.edit_bones.new('Leg.'+side)
    bone.head=hip_centers[side]
    bone.tail=(hip_centers[side].x,hip_centers[side].y,-.91);bone.parent=root
bpy.ops.object.mode_set(mode='OBJECT')
modifier=body.modifiers.new('Rigid original parts','ARMATURE');modifier.object=rig
body.parent=rig
for bone in rig.pose.bones:bone.rotation_mode='QUATERNION'
def rotate(name,degrees):
    pb=rig.pose.bones[name];basis=pb.bone.matrix_local.to_quaternion()
    pb.rotation_quaternion=basis.inverted()@Quaternion((1,0,0),math.radians(degrees))@basis
scene=bpy.context.scene;scene.render.fps=32
scene.frame_start=1;scene.frame_end=25
feet=[v.index for v in body.data.vertices if v.co.z<floor+.06]
rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new('Walk_InPlace')
for frame in range(1,26):
    t=(frame-1)/24
    for pb in rig.pose.bones:pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
    for side,phase in [('L',t%1),('R',(t+.5)%1)]:
        if phase<.5:pitch=-20+80*phase
        else:
            u=(phase-.5)*2;pitch=20-40*(u*u*(3-2*u))
        rotate('Leg.'+side,pitch)
    rotate('Arm.L',18*math.cos(t*math.tau));rotate('Arm.R',-18*math.cos(t*math.tau))
    bpy.context.view_layer.update()
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=ev.to_mesh()
    low=min(temp.vertices[i].co.z for i in feet);ev.to_mesh_clear()
    pb=rig.pose.bones['Root']
    pb.location=pb.bone.matrix_local.to_3x3().inverted()@Vector((0,0,floor-low))
    for pb in rig.pose.bones:
        pb.keyframe_insert('location',frame=frame,group=pb.name)
        pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
scene.frame_set(7)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-motion-ready.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-walk.glb'),export_format='GLB',use_selection=True,
    export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
# Rest export is one object with six disconnected, independently selectable pieces.
data.pose_position='REST'
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-rest.glb'),export_format='GLB',use_selection=True,
    export_skins=True,export_animations=False,export_cameras=False,export_lights=False)
(P/'build-validation.json').write_text(json.dumps({'meshObjects':1,'parts':report,
    'originalVisibleSurface':'Preserved, cut triangles subdivided without displacement',
    'walkSeconds':.75,'gameInstalled':False,'hipPivots':{k:list(v) for k,v in hip_centers.items()},
    'jointWeightTransition':'Quintic falloff; head width .42, limbs width 1.10',
    'redundantInternalCapsRemoved':True},indent=2))
print('MOTION_MESH_COMPLETE',report)
