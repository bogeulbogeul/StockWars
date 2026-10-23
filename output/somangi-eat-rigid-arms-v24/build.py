import bpy,numpy as np,json,sys,math
from pathlib import Path
from mathutils import Matrix,Vector
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,ease
from merge_clip import merge_clip
S=P.parent/'somangi-eat-arm-clearance-v23';meta=json.loads((S/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop']
scene.frame_set(1);base=points(body);parts={};poses={s:[] for s in ['L','R']};food_matrices=[]
for side in poses:
    ids=set(meta['armRigidIds'][side]);used=sorted(set(i for p in body.data.polygons if all(i in ids for i in p.vertices) for i in p.vertices))
    palms=sorted(set(used)&set(meta['palmIds'][side]))
    parts[side]=(np.array(sorted(ids)),np.array(used),np.array(palms))
for frame in range(1,92):
    scene.frame_set(frame);target=points(body);t=(frame-1)/30
    weight=float(ease(t/.65)*(1-ease((t-2.35)/.65)))
    pivot=Vector((0,0,.05));extra=Matrix.Translation(pivot)@Matrix.Rotation(math.radians(10)*weight,4,'X')@Matrix.Translation(-pivot)
    food_matrices.append(extra@root.matrix_world)
    for side,(ids,used,palms) in parts.items():
        a=base[used].astype(float);b=target[used].astype(float)
        u,_,vt=np.linalg.svd((a-a.mean(0)).T@(b-b.mean(0)))
        r=vt.T@u.T
        if np.linalg.det(r)<0:vt[-1]*=-1;r=vt.T@u.T
        translation=target[palms].mean(0)-r@base[palms].mean(0)
        m=np.eye(4);m[:3,:3]=r;m[:3,3]=translation;poses[side].append(extra@Matrix(m))
# Freeze every arm morph to precisely the same original surface. Skinning is rigid weight 1.
all_ids=np.array(sorted(set(meta['armRigidIds']['L']+meta['armRigidIds']['R'])))
for key in body.data.shape_keys.key_blocks:
    coords=np.empty(len(base)*3,dtype=np.float32);key.data.foreach_get('co',coords);coords=coords.reshape(-1,3)
    coords[all_ids]=base[all_ids];key.data.foreach_set('co',coords.ravel())
coords=np.empty(len(base)*3,dtype=np.float32);body.data.vertices.foreach_get('co',coords);coords=coords.reshape(-1,3)
coords[all_ids]=base[all_ids];body.data.vertices.foreach_set('co',coords.ravel());body.data.update()
bpy.ops.object.select_all(action='DESELECT')
data=bpy.data.armatures.new('Rigid original arm skeleton');rig=bpy.data.objects.new('Somangi_RigidArms',data);scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
rootbone=data.edit_bones.new('Body');rootbone.head=(0,0,0);rootbone.tail=(0,0,.1)
for side in poses:
    bone=data.edit_bones.new('Arm.'+side);anchor=Vector(base[meta['armAnchorIds'][side]])
    bone.head=anchor;bone.tail=anchor+Vector((0,0,.2));bone.parent=rootbone
bpy.ops.object.mode_set(mode='OBJECT');body.vertex_groups.clear()
armset=set(all_ids.tolist());body.vertex_groups.new(name='Body').add([i for i in range(len(base)) if i not in armset],1,'REPLACE')
for side,(ids,_,_) in parts.items():body.vertex_groups.new(name='Arm.'+side).add(ids.tolist(),1,'REPLACE')
modifier=body.modifiers.new('Rigid arms, no blended weights','ARMATURE');modifier.object=rig
body.parent=rig;body.matrix_parent_inverse=rig.matrix_world.inverted()
for frame in range(1,92):
    scene.frame_set(frame)
    root.matrix_world=food_matrices[frame-1];root.keyframe_insert('location',frame=frame);root.keyframe_insert('rotation_quaternion',frame=frame)
    for side in poses:
        bone=rig.pose.bones['Arm.'+side];bone.rotation_mode='QUATERNION'
        bone.matrix=poses[side][frame-1]@bone.bone.matrix_local
        bone.keyframe_insert('location',frame=frame);bone.keyframe_insert('rotation_quaternion',frame=frame)
for layer in rig.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:key.interpolation='LINEAR'
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
for ob in [body,rig,root,*root.children_recursive,bpy.data.objects['Somangi_AnimatedMouth'],bpy.data.objects['Somangi_TemporarySmileCover']]:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
meta['rigidArmUsedIds']={s:used.tolist() for s,(_,used,_) in parts.items()};meta['rigidArmPalmIds']={s:palms.tolist() for s,(_,_,palms) in parts.items()}
(P/'metadata.json').write_text(json.dumps(meta));print('RIGID ARM BUILD COMPLETE')
