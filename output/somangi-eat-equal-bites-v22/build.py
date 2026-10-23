import bpy,numpy as np,json,sys
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,bake_shapes
from equal_bites import remaining,grip_remaining,move_arm
from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3/somangi-bread.blend'))
native=bpy.data.objects['Somangi_SmoothBody'];parts={}
for side in ['L','R']:
    group=native.vertex_groups['Part.Arm.'+side].index
    parts[side]={v.index for v in native.data.vertices if any(g.group==group for g in v.groups)}
S=P.parent/'somangi-eat-round-body-v20';meta=json.loads((S/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'));scene=bpy.context.scene
body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop'];source=[];traces=[]
for frame in range(1,92):
    scene.frame_set(frame);source.append(points(body));traces.append(root.matrix_world.copy())
initial_scale=np.array(traces[0].to_scale());base=source[0];arm_ids={};anchors={}
for side,sign in [('L',1),('R',-1)]:
    extra={i for i in range(meta['torsoVertexEnd'],meta['originalVertexCount']) if base[i,0]*sign>0}
    arm_ids[side]=np.array(sorted(parts[side]|extra))
    anchors[side]=min(extra,key=lambda i:np.linalg.norm(base[i]-[sign*.17,-.005,.05]))
children=list(root.children);consumption=bpy.data.objects.new('Food_EqualBiteConsumption',None)
scene.collection.objects.link(consumption);consumption.parent=root
for child in children:
    basis=child.matrix_basis.copy();inverse=child.matrix_parent_inverse.copy()
    child.parent=consumption;child.matrix_parent_inverse=inverse;child.matrix_basis=basis
sample_frames=sorted(set(range(1,92,3))|set(range(33,38))|set(range(45,50))|set(range(54,76)))
cache=[];targets=[];anchor_positions=[]
for frame in range(1,92):
    scene.frame_set(frame);t=(frame-1)/30;matrix=traces[frame-1];ratio=matrix.to_scale().x/initial_scale[0]
    amount=remaining(t);factor=amount/ratio;grip=grip_remaining(t,ratio)/ratio
    top=matrix.to_3x3()@Vector((0,0,.15));center=matrix.translation
    root.location=center+top*(1-factor);root.keyframe_insert('location',frame=frame)
    consumption.scale=(factor,)*3;consumption.keyframe_insert('scale',frame=frame)
    if frame not in sample_frames:continue
    coords=source[frame-1].copy();frame_targets={};frame_anchors={}
    for side in ['L','R']:
        palms=meta['palmIds'][side];p=source[frame-1][palms].mean(0)
        target=np.array(center+top*(1-grip)+(Vector(p)-center)*grip)
        frame_anchors[side]=move_arm(coords,arm_ids[side],anchors[side],palms,target).tolist()
        frame_targets[side]=target.tolist()
    cache.append(coords);targets.append(frame_targets);anchor_positions.append(frame_anchors)
for layer in consumption.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:key.interpolation='LINEAR'
body.shape_key_clear();body.data.vertices.foreach_set('co',cache[0].ravel());body.data.update()
bake_shapes(body,cache,'EqualBiteGrip')
for layer in body.data.shape_keys.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for point in curve.keyframe_points:point.co.x=sample_frames[int(round(point.co.x))-1]
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
for ob in [body,root,*root.children_recursive,bpy.data.objects['Somangi_OriginalRig'],bpy.data.objects['Somangi_AnimatedMouth'],bpy.data.objects['Somangi_TemporarySmileCover']]:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
meta.update({'biteSizeStages':[1,2/3,1/3,0],'foodGoneSeconds':1.9,'foodConsumptionNode':consumption.name,
    'armRigidIds':{s:ids.tolist() for s,ids in arm_ids.items()},'armAnchorIds':anchors,
    'sampleFrames':sample_frames,'palmTargets':targets,'anchorPositions':anchor_positions})
(P/'metadata.json').write_text(json.dumps(meta,indent=2));print('EQUAL STAGES',meta['biteSizeStages'])
