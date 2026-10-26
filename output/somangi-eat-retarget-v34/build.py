import bpy,json,math,sys,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
from mathutils.kdtree import KDTree
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import ease
from merge_clip import merge_clip
S=P.parent/'somangi-smooth-armpit-v33'
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-black-eyes-v1/somangi-black-eyes.blend'))
native=bpy.data.objects['Somangi_SmoothBody'];group=native.vertex_groups['Part.Head'].index
head_coords=[v.co.copy() for v in native.data.vertices if any(g.group==group for g in v.groups)]
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];food=bpy.data.objects['bread_Prop'];loaf=bpy.data.objects['Bread roll']
meta=json.loads((S/'metadata.json').read_text());scene.frame_set(1)
hold={s:(rig.pose.bones['Arm.'+s].matrix@rig.data.bones['Arm.'+s].matrix_local.inverted()).to_quaternion() for s in ['L','R']}
food_trace=[];food_centers=[]
for f in range(1,92):
    scene.frame_set(f);food_trace.append(food.matrix_world.copy());food_centers.append(sum((loaf.matrix_world@v.co for v in loaf.data.vertices),Vector())/len(loaf.data.vertices))
before=set(bpy.data.objects)
reference=P.parent/'character-assets-retired-2026-10-23/web/assets/characters/3d/somangi/eat.glb'
bpy.ops.import_scene.gltf(filepath=str(reference));imported=set(bpy.data.objects)-before
old=next(o for o in imported if o.type=='ARMATURE')
for ob in imported:
    ad=ob.animation_data
    if ad and not ad.action and ad.nla_tracks:
        strip=ad.nla_tracks[0].strips[0];ad.action=strip.action;ad.action_slot=strip.action_slot
        for track in ad.nla_tracks:track.mute=True
start,end=old.animation_data.action.frame_range
reference_rot={name:[] for name in ['Arm.L','Arm.R','Head']}
for f in range(1,92):
    u=min(1,((f-1)/30)/2.2);frame=start+(end-start)*u;scene.frame_set(int(frame),subframe=frame-int(frame))
    for name,trace in reference_rot.items():
        matrix=old.matrix_world@old.pose.bones[name].matrix@old.data.bones[name].matrix_local.inverted()@old.matrix_world.inverted()
        trace.append(matrix.to_quaternion())
for name,trace in reference_rot.items():
    initial=trace[0].copy();reference_rot[name]=[q@initial.inverted() for q in trace]
for ob in imported:bpy.data.objects.remove(ob,do_unlink=True)
# Add only a head control. There are still no elbow or forearm controls.
rig.animation_data_clear();food.animation_data_clear();scene.frame_set(91)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
bone=rig.data.edit_bones.new('Head');bone.head=(0,0,.02);bone.tail=(0,0,.22);bone.parent=rig.data.edit_bones['Body']
bpy.ops.object.mode_set(mode='OBJECT')
tree=KDTree(len(head_coords))
for i,p in enumerate(head_coords):tree.insert(p,i)
tree.balance();head_ids=[v.index for v in body.data.vertices if tree.find(v.co)[2]<3e-6]
body.vertex_groups['Body'].remove(head_ids);body.vertex_groups.new(name='Head').add(head_ids,1,'REPLACE')
for name in ['Somangi_AnimatedMouth','Somangi_TemporarySmileCover']:
    ob=bpy.data.objects[name];ob.parent=rig;ob.matrix_parent_inverse=rig.matrix_world.inverted();ob.vertex_groups.clear();ob.vertex_groups.new(name='Head').add(list(range(len(ob.data.vertices))),1,'REPLACE')
    mod=ob.modifiers.new('Follow original rigid head','ARMATURE');mod.object=rig
identity=Quaternion((1,0,0,0));angles=[]
for f in range(1,92):
    scene.frame_set(f);t=(f-1)/30;returning=float(ease((t-2.2)/.65));hands=[]
    for s,sign in [('L',1),('R',-1)]:
        anchor=Vector(meta['centers']['1' if sign==1 else '2']);palm=Vector(meta['palms']['1' if sign==1 else '2'])
        delta=identity.slerp(reference_rot['Arm.'+s][f-1],.22)
        q=(delta@hold[s]).slerp(identity,returning)
        transform=Matrix.Translation(anchor)@q.to_matrix().to_4x4()@Matrix.Translation(-anchor)
        pb=rig.pose.bones['Arm.'+s];pb.rotation_mode='QUATERNION';pb.matrix=transform@pb.bone.matrix_local
        pb.keyframe_insert('location',frame=f);pb.keyframe_insert('rotation_quaternion',frame=f);hands.append(transform@palm)
    q=identity.slerp(reference_rot['Head'][f-1],.18);angle=q.angle;angles.append(math.degrees(angle))
    pivot=Vector((0,0,.02));down=.22*abs(math.sin(angle))
    transform=Matrix.Translation(pivot+Vector((0,0,-down)))@q.to_matrix().to_4x4()@Matrix.Translation(-pivot)
    pb=rig.pose.bones['Head'];pb.rotation_mode='QUATERNION';pb.matrix=transform@pb.bone.matrix_local
    pb.keyframe_insert('location',frame=f);pb.keyframe_insert('rotation_quaternion',frame=f)
    trace=food_trace[f-1];local=trace.inverted()@food_centers[f-1];desired=(hands[0]+hands[1])/2+Vector((0,-.10,.03))
    food.matrix_world=Matrix.Translation(desired-trace@local)@trace
    for key in ['location','rotation_quaternion','scale']:food.keyframe_insert(key,frame=f)
for ob in [rig,food]:
    for layer in ob.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:key.interpolation='LINEAR'
mouth=bpy.data.objects['Somangi_AnimatedMouth']
face_tree=BVHTree.FromPolygons([v.co for v in body.data.vertices],[list(f.vertices) for f in body.data.polygons])
for key in mouth.data.shape_keys.key_blocks:
    coords=np.array([p.co[:] for p in key.data])
    if coords[:,1].min()<-.3 and np.ptp(coords[:,0])>.005:
        center=coords.mean(0);coords[:,0]=center[0]+(coords[:,0]-center[0])*.65;coords[:,2]=center[2]+(coords[:,2]-center[2])*.55
        for i,(x,y,z) in enumerate(coords):
            hit,normal,_,_=face_tree.ray_cast(Vector((x,-1,z)),Vector((0,1,0)),2)
            if hit is not None:coords[i]=hit+normal*.006
        key.data.foreach_set('co',coords.astype(np.float32).ravel())
scene.frame_start=1;scene.frame_end=91;scene.render.fps=30;scene.frame_set(91)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','PreviousEatTiming_CurrentAppearance')
(P/'metadata.json').write_text(json.dumps(dict(reference=str(reference),headMaxDegrees=max(angles),headVertices=len(head_ids),headIds=head_ids,sourceGeometryUnchanged=True,noElbows=True),indent=2))
