import bpy,numpy as np,json,sys,math
from pathlib import Path
from mathutils import Matrix,Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,ease
from merge_clip import merge_clip
S=P.parent/'somangi-eat-rigid-arms-v24';meta=json.loads((S/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_RigidArms'];food=bpy.data.objects['bread_Prop']
base=np.array([v.co[:] for v in body.data.vertices]);traces=[];sources=[];foods=[]
for f in range(1,92):
    scene.frame_set(f);sources.append(points(body));foods.append(food.matrix_world.copy())
    traces.append({s:rig.pose.bones['Arm.'+s].matrix@rig.data.bones['Arm.'+s].matrix_local.inverted() for s in ['L','R']})
armset=set(meta['armRigidIds']['L']+meta['armRigidIds']['R'])
bodyfaces=[list(p.vertices) for p in body.data.polygons if not any(i in armset for i in p.vertices)]
rest={}
for s,sign in [('L',1),('R',-1)]:
    anchor=Vector(base[meta['armAnchorIds'][s]]);palm=Vector(base[meta['rigidArmPalmIds'][s]].mean(0))
    q=(palm-anchor).rotation_difference(Vector((sign*.24,-.015,-.43)))
    rest[s]=Matrix.Translation(anchor+Vector((sign*.025,-.015,-.015)))@q.to_matrix().to_4x4()@Matrix.Translation(-anchor)
report=[]
for f in range(1,92):
    scene.frame_set(f);t=(f-1)/30;amount=float(ease((t-1.9)/.8));matrices={}
    tree=BVHTree.FromPolygons([Vector(v) for v in sources[f-1]],bodyfaces)
    for s in ['L','R']:
        sign=1 if s=='L' else -1
        anchor=Vector(base[meta['armAnchorIds'][s]]);palm=Vector(base[meta['rigidArmPalmIds'][s]].mean(0))
        attachment=anchor+Vector((sign*.025,-.015,-.015));oldpalm=traces[f-1][s]@palm
        dx=float(np.clip(oldpalm.x-attachment.x,-.22,.22));radius=math.sqrt(max(.001,(palm-anchor).length_squared-dx*dx))
        direction=Vector((dx,-radius*math.sin(math.radians(57)),-radius*math.cos(math.radians(57))))
        eating=(palm-anchor).rotation_difference(direction)
        source=Matrix.Translation(attachment)@eating.to_matrix().to_4x4()@Matrix.Translation(-anchor);target=rest[s]
        q=source.to_quaternion().slerp(target.to_quaternion(),amount)
        location=source.translation.lerp(target.translation,amount)
        matrices[s]=Matrix.Translation(location)@q.to_matrix().to_4x4()
    shift=0.
    for s,m in matrices.items():
        ids=np.array(meta['rigidArmUsedIds'][s]);anchor=base[meta['armAnchorIds'][s]]
        ids=ids[np.linalg.norm(base[ids]-anchor,axis=1)>.18]
        a=np.array(m);coords=base[ids]@a[:3,:3].T+a[:3,3]
        for x,y,z in coords[::2]:
            if z>-.08:continue
            hit,_,_,_=tree.ray_cast(Vector((x,-2,z)),Vector((0,1,0)),4)
            if hit is not None:shift=max(shift,float(y-hit.y+.012))
    # Apply the same forward offset to both hands and their prop; arm shape is unchanged.
    correction=Matrix.Translation((0,-shift,0))
    for s,m in matrices.items():
        bone=rig.pose.bones['Arm.'+s];bone.matrix=correction@m@bone.bone.matrix_local
        bone.keyframe_insert('location',frame=f);bone.keyframe_insert('rotation_quaternion',frame=f)
    oldcenter=sum((traces[f-1][s]@Vector(base[meta['rigidArmPalmIds'][s]].mean(0)) for s in ['L','R']),Vector())/2
    newcenter=sum((matrices[s]@Vector(base[meta['rigidArmPalmIds'][s]].mean(0)) for s in ['L','R']),Vector())/2
    food.matrix_world=correction@Matrix.Translation(newcenter-oldcenter)@foods[f-1];food.keyframe_insert('location',frame=f)
    report.append(dict(frame=f,forwardClearanceOffset=shift,attentionBlend=amount))
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
for ob in [body,rig,food,*food.children_recursive,bpy.data.objects['Somangi_AnimatedMouth'],bpy.data.objects['Somangi_TemporarySmileCover']]:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread_Then_Attention')
(P/'metadata.json').write_text(json.dumps(meta));(P/'clearance-offsets.json').write_text(json.dumps(report,indent=2));print('MAX SHIFT',max(r['forwardClearanceOffset'] for r in report),'FINAL SHIFT',report[-1])
