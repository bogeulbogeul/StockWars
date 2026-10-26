import bpy,numpy as np,sys,json
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,bake_shapes
from contact import head_tree,prop_samples,safe_shift,transform
from arm_surface import prepare,pose,FairArm
from merge_clip import merge_clip
from cover import clean_cover

bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3/somangi-bread.blend'))
original=bpy.data.objects['Somangi_SmoothBody'];rest=np.array([tuple(v.co) for v in original.data.vertices])
parts={}
for name in ['Head','Arm.L','Arm.R']:
    group=original.vertex_groups['Part.'+name].index
    ids={v.index for v in original.data.vertices if any(g.group==group for g in v.groups)}
    parts[name]=(ids,[list(f.vertices) for f in original.data.polygons if all(i in ids for i in f.vertices)])
palms=json.loads((P.parent/'somangi-eat-drink-grip-v3/bread-metadata.json').read_text())['palmVertexIds']
head_ids=sorted(parts['Head'][0]);head_map={i:j for j,i in enumerate(head_ids)}
head_faces=[[head_map[i] for i in f] for f in parts['Head'][1]]
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-belly-contour-v13/somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop'];scene=bpy.context.scene
metadata=json.loads((P.parent/'somangi-eat-belly-contour-v13/validation.json').read_text())
start=metadata['torso']['torsoVertexStart'];base=np.array([tuple(v.co) for v in body.data.vertices])
body_tree=BVHTree.FromPolygons([Vector(p) for p in base[start:]],
    [[i-start for i in f.vertices] for f in body.data.polygons if f.material_index==2],all_triangles=False)
samples=prop_samples(root);source=[];traces=[];required=[]
for frame in range(1,92):
    scene.frame_set(frame);coords=points(body);source.append(coords)
    hands=[Vector(coords[palms[s]].mean(0)) for s in ['L','R']]
    midpoint=(hands[0]+hands[1])*.5;axis=(hands[0]-hands[1]).normalized()
    up=Vector((0,-.35,.93675));up=(up-axis*up.dot(axis)).normalized()
    forward=up.cross(axis).normalized();up=axis.cross(forward).normalized()
    q=Matrix((axis,forward,up)).transposed().to_quaternion()
    rx=.20*root.scale.x;ry=.105*root.scale.y;rz=.17*root.scale.z
    depth=rz*max(0,1-(((hands[0]-hands[1]).length*.5)/rx)**2-(.02/ry)**2)**.5
    root.rotation_quaternion=q;root.location=midpoint-q@Vector((0,.02,-depth))
    bpy.context.view_layer.update()
    tree=head_tree(coords[head_ids],head_faces)
    required.append(float(safe_shift(tree,transform(samples,root.matrix_world))))
    traces.append((root.location.copy(),root.rotation_quaternion.copy(),root.scale.copy()))
kernel=np.array([1,3,6,7,6,3,1])/27
shifts=np.maximum(required,np.convolve(np.pad(required,(3,3),mode='edge'),kernel,mode='valid'))+.002
root.animation_data_clear();cache=[]
new_base,layouts=prepare(body,rest,parts)
fairers=[FairArm(new_base,layout) for layout in layouts.values()]
for i in range(91):
    frame=i+1;scene.frame_set(frame);coords=source[i];loc,q,scale=traces[i]
    delta=np.array([0,-shifts[i],0],dtype=np.float32)
    root.location=loc+Vector(delta);root.rotation_quaternion=q;root.scale=scale
    for path in ['location','rotation_quaternion','scale']:root.keyframe_insert(path,frame=frame)
    if i%3:continue
    corrected=pose(coords,new_base,layouts,delta,palms)
    for fairer in fairers:fairer.solve(corrected)
    cache.append(corrected)
for fairer in fairers:fairer.close()
bake_shapes(body,cache,'ShoulderCleanEat')
for layer in body.data.shape_keys.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for point in curve.keyframe_points:point.co.x=1+(point.co.x-1)*3
clean_cover(body,bpy.data.objects['Somangi_TemporarySmileCover'])
scene.frame_set(1);scene.name='Eat_Bread';bpy.ops.object.select_all(action='DESELECT')
objects=[body,root,bpy.data.objects['Somangi_OriginalRig'],*root.children,
         bpy.data.objects['Somangi_AnimatedMouth'],bpy.data.objects['Somangi_TemporarySmileCover']]
for ob in objects:ob.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
options=dict(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_cameras=False,export_lights=False,export_morph=True)
if 'export_try_sparse_sk' in bpy.ops.export_scene.gltf.get_rna_type().properties:options['export_try_sparse_sk']=True
bpy.ops.export_scene.gltf(**options);merge_clip(P/'somangi-eat.glb','Eat_Bread')
(P/'metadata.json').write_text(json.dumps({'headIds':head_ids,'headFaces':head_faces,
    'palmIds':palms,'sourcePalms':{s:[coords[ids].mean(0).tolist() for coords in source] for s,ids in palms.items()},
    'foodForwardShift':shifts.tolist(),'requiredForwardShift':required,
    'maximumFoodShift':float(max(shifts)),'torsoVertexStart':start,'torsoVertexEnd':len(base),
    'headClearanceAlongY':.012,'bodySampleFrames':list(range(1,92,3)),'gameInstalled':False},indent=2))
print('MAXIMUM FOOD SHIFT',max(shifts))
