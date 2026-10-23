import bpy,numpy as np,json,sys,math
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,bake_shapes,ease
from merge_clip import merge_clip
S=P.parent/'somangi-eat-equal-bites-v22';meta=json.loads((S/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop']
ids=np.array(sorted(set(meta['armRigidIds']['L']+meta['armRigidIds']['R'])))
source=[];matrices=[]
for f in range(1,92):
    scene.frame_set(f);source.append(points(body));matrices.append(root.matrix_world.copy())
pivot=Vector((0,0,.05));cache=[];report=[]
for f,coords in enumerate(source,1):
    t=(f-1)/30;weight=float(ease(t/.65)*(1-ease((t-2.35)/.65)))
    angle=math.radians(24)*weight;rotation=Matrix.Rotation(angle,4,'X')
    transform=Matrix.Translation(pivot)@rotation@Matrix.Translation(-pivot)
    result=coords.copy();m=np.array(transform)
    result[ids]=coords[ids]@m[:3,:3].T+m[:3,3]
    cache.append(result)
    scene.frame_set(f);root.matrix_world=transform@matrices[f-1]
    root.keyframe_insert('location',frame=f);root.keyframe_insert('rotation_quaternion',frame=f)
    head=BVHTree.FromPolygons([Vector(p) for p in result[meta['headIds']]],meta['headFaces'],all_triangles=True)
    worst=0.;count=0
    for side in ['L','R']:
        arm=np.array(meta['armRigidIds'][side]);anchor=coords[meta['armAnchorIds'][side]]
        distal=arm[np.linalg.norm(coords[arm]-anchor,axis=1)>.13]
        for v in result[distal][::3]:
            hit,normal,_,distance=head.find_nearest(Vector(v))
            signed=(Vector(v)-hit).dot(normal)
            if signed<-.002:count+=1;worst=min(worst,signed)
    report.append(dict(frame=f,distalInsideSamples=count,depth=worst))
body.shape_key_clear();body.data.vertices.foreach_set('co',cache[0].ravel());body.data.update()
bake_shapes(body,cache,'ArmFaceClearance')
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
for ob in [body,root,*root.children_recursive,bpy.data.objects['Somangi_OriginalRig'],bpy.data.objects['Somangi_AnimatedMouth'],bpy.data.objects['Somangi_TemporarySmileCover']]:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
(P/'metadata.json').write_text(json.dumps(meta));(P/'arm-check.json').write_text(json.dumps(report,indent=2))
print('ARM CHECK',max(r['distalInsideSamples'] for r in report),min(r['depth'] for r in report))
