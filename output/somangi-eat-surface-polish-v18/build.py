import bpy,numpy as np,json,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,bake_shapes,ease
from fair import Fair
from junction import prepare,pose
from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3/somangi-bread.blend'))
old=bpy.data.objects['Somangi_SmoothBody'];rest=np.array([tuple(v.co) for v in old.data.vertices]);arm_ids=set()
for side in ['L','R']:
    group=old.vertex_groups['Part.Arm.'+side].index
    arm_ids|={v.index for v in old.data.vertices if any(g.group==group for g in v.groups)}
S=P.parent/'somangi-eat-shoulder-natural-v17';meta=json.loads((S/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'));body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene
scene.frame_set(1);base=points(body);n=len(base);a=meta['torsoVertexStart'];b=meta['torsoVertexEnd'];arm_end=meta['originalVertexCount']
body_faces=[list(f.vertices) for f in body.data.polygons if all(a<=i<b for i in f.vertices)]
mask=np.zeros(n);z=base[a:b,2];mask[a:b]=ease((z+.32)/.10)*(1-ease((z+.14)/.05))
body_fair=Fair(body_faces,mask);smoothed=base.copy();body_fair.solve(smoothed,320);body_delta=smoothed-base
allowed=arm_ids|set(range(b,arm_end));arm_faces=[list(f.vertices) for f in body.data.polygons if all(i in allowed for i in f.vertices)]
mask=np.zeros(n)
for i in allowed:
    if i<len(rest):
        sign=1 if rest[i,0]>0 else -1;direction=np.array([sign*.195,0,-.33]);direction/=np.linalg.norm(direction)
        along=(rest[i]-np.array([sign*.285,0,-.11]))@direction
        mask[i]=1-ease((along-.25)/.09)
    else:mask[i]=ease((.035-base[i,2])/.08)
arm_fair=Fair(arm_faces,mask);cache=[];maximum=0
for frame in range(1,92,3):
    scene.frame_set(frame);coords=points(body);hands={i:coords[i].copy() for ids in meta['palmIds'].values() for i in ids}
    original=coords.copy();arm_fair.solve(coords,130)
    for i,p in hands.items():coords[i]=p
    maximum=max(maximum,float(np.linalg.norm(coords-original,axis=1).max()));coords+=body_delta;cache.append(coords)
new_base,faces,materials,uv,layout=prepare(body,cache[0],meta)
cache=[pose(co,new_base,layout) for co in cache]
old=body.data;data=bpy.data.meshes.new('Continuous smooth neck chest and shoulder surface');data.from_pydata(new_base,[],faces);data.update()
for mat in old.materials:data.materials.append(mat)
layer=data.uv_layers.new(name='UVMap')
for i,p in enumerate(uv):layer.data[i].uv=p
for f,mat in zip(data.polygons,materials):f.material_index=mat;f.use_smooth=True
body.shape_key_clear();body.data=data;bake_shapes(body,cache,'ContinuousSurfaceEat')
for layer in data.shape_keys.animation_data.action.layers:
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
meta.update({'junction':layout,'upperBodyEditedIds':np.where(np.linalg.norm(body_delta,axis=1)>1e-8)[0].tolist(),
    'armEditedIds':[int(i) for i in arm_fair.ids if mask[i]>0],'sourceVertexCount':n,
    'maximumUpperBodyChange':float(np.linalg.norm(body_delta,axis=1).max()),'maximumArmChange':maximum})
(P/'metadata.json').write_text(json.dumps(meta,indent=2,default=float));print('NEW CONTINUOUS JUNCTION',len(layout['lower']),'BODY MAX',meta['maximumUpperBodyChange'],'ARM MAX',maximum)
