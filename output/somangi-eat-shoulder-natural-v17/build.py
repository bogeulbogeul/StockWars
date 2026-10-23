import bpy,numpy as np,json,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,bake_shapes
from local_surface import restore_back,Shoulder
from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-grip-v3/somangi-bread.blend'))
ob=bpy.data.objects['Somangi_SmoothBody'];rest=np.array([tuple(v.co) for v in ob.data.vertices]);parts={}
for name in ['Root','Arm.L','Arm.R']:
    group=ob.vertex_groups['Part.'+name].index
    ids={v.index for v in ob.data.vertices if any(g.group==group for g in v.groups)}
    parts[name]=(ids,[list(f.vertices) for f in ob.data.polygons if all(i in ids for i in f.vertices)])
source=P.parent/'somangi-eat-sealed-junction-v16';meta=json.loads((source/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(source/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;scene.frame_set(1);base=points(body)
back_delta=restore_back(base,meta['torsoVertexStart'],meta['torsoVertexEnd'],rest,parts['Root'][1],
    [list(f.vertices) for f in body.data.polygons])
arm_ids=parts['Arm.L'][0]|parts['Arm.R'][0]
smoother=Shoulder(body,base,rest,arm_ids,meta['torsoVertexEnd'],meta['originalVertexCount'])
cache=[];maximum=0
for frame in range(1,92,3):
    scene.frame_set(frame);coords=points(body)
    hand_ids=[i for ids in meta['palmIds'].values() for i in ids];hands=coords[hand_ids].copy()
    maximum=max(maximum,smoother.solve(coords));coords[hand_ids]=hands
    coords+=back_delta;cache.append(coords)
bake_shapes(body,cache,'SmoothShoulderOriginalBack')
for layer in body.data.shape_keys.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for point in curve.keyframe_points:point.co.x=1+(point.co.x-1)*3
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT');root=bpy.data.objects['bread_Prop']
for ob in [body,root,*root.children,bpy.data.objects['Somangi_OriginalRig'],
    bpy.data.objects['Somangi_AnimatedMouth'],bpy.data.objects['Somangi_TemporarySmileCover']]:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
meta.update({'backChangedIds':np.where(np.linalg.norm(back_delta,axis=1)>1e-8)[0].tolist(),
    'shoulderAllowedIds':[int(i) for i,w in zip(smoother.ids,smoother.mask) if w>0],
    'maximumShoulderChange':maximum,'maximumBackChange':float(np.linalg.norm(back_delta,axis=1).max())})
(P/'metadata.json').write_text(json.dumps(meta,indent=2));print('SHOULDER MAX',maximum,'BACK MAX',meta['maximumBackChange'])
