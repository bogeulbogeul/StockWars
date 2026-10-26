import bpy,json,numpy as np,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,bake_shapes,ease
from junction import pose
from merge_clip import merge_clip
S=P.parent/'somangi-eat-surface-polish-v18';meta=json.loads((S/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'));body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene
scene.frame_set(1);base=points(body);layout=meta['junction'];a=meta['torsoVertexStart'];b=meta['torsoVertexEnd']
body_ids=set(range(a,b))|{item[0] for item in layout['cuts']}
faces=[list(f.vertices) for f in body.data.polygons if all(i in body_ids for i in f.vertices)]
tree=BVHTree.FromPolygons([Vector(p) for p in base],faces)
levels=np.linspace(-.65,-.0951,120);radii=[]
for z in levels:
    right=tree.ray_cast(Vector((0,0,z)),Vector((1,0,0)),1)[0]
    left=tree.ray_cast(Vector((0,0,z)),Vector((-1,0,0)),1)[0]
    assert right is not None and left is not None,float(z)
    radii.append((right.x-left.x)*.5)
hip_z=-.48;hip_radius=float(np.interp(hip_z,levels,radii));top_radius=.255
delta=np.zeros_like(base);z=base[a:b,2]
target=hip_radius-(hip_radius-top_radius)*((z-hip_z)/(-.095-hip_z))**2
weight=ease((z+.58)/.10)*(1-ease((z+.03)/.06))
scale=1+weight*(target/np.interp(z,levels,radii)-1)
delta[a:b,0]=base[a:b,0]*(scale-1)
cache=[]
for frame in range(1,92,3):
    scene.frame_set(frame);coords=points(body)+delta
    cache.append(pose(coords,coords,layout))
bake_shapes(body,cache,'SoftReferenceWaistEat')
for layer in body.data.shape_keys.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for point in curve.keyframe_points:point.co.x=1+(point.co.x-1)*3
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT');root=bpy.data.objects['bread_Prop']
for ob in [body,root,*root.children,bpy.data.objects['Somangi_OriginalRig'],bpy.data.objects['Somangi_AnimatedMouth'],bpy.data.objects['Somangi_TemporarySmileCover']]:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
meta.update({'waistEditedIds':np.where(np.linalg.norm(cache[0]-base,axis=1)>1e-8)[0].tolist(),
    'waistCurve':{'hipZ':hip_z,'hipHalfWidth':hip_radius,'upperHalfWidth':top_radius},
    'waistReferenceLevels':levels.tolist(),'previousHalfWidths':radii,
    'referenceImage':'codex-clipboard-19d07913-6541-4023-8f61-38d67d8e144b.png'})
(P/'metadata.json').write_text(json.dumps(meta,indent=2));print('MAXIMUM WAIST ADJUSTMENT',float(np.abs(delta).max()))
