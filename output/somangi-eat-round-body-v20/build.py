import bpy,json,numpy as np,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,bake_shapes,ease
from fair import Fair
from merge_clip import merge_clip
S=P.parent/'somangi-eat-soft-waist-v19';meta=json.loads((S/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'));body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene
scene.frame_set(1);base=points(body);a=meta['torsoVertexStart'];b=meta['torsoVertexEnd']
body_ids=set(range(a,b))|{item[0] for item in meta['junction']['cuts']}
faces=[list(f.vertices) for f in body.data.polygons if all(i in body_ids for i in f.vertices)]
mask=np.zeros(len(base));ids=np.array(sorted(body_ids));z=base[ids,2]
mask[ids]=ease((z+.66)/.13)*(1-ease((z+.205)/.10))
fair=Fair(faces,mask);smooth=base.copy();fair.solve(smooth,850)
delta=smooth-base;length=np.linalg.norm(delta,axis=1)
delta*=((.012*np.tanh(length/.012))/np.maximum(length,1e-12))[:,None]
cache=[]
for f in range(1,92,3):scene.frame_set(f);cache.append(points(body)+delta)
bake_shapes(body,cache,'SoftRoundedBodyEat')
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
meta.update({'roundBodyEditedIds':np.where(np.linalg.norm(delta,axis=1)>1e-8)[0].tolist(),
    'maximumRoundBodyChange':float(np.linalg.norm(delta,axis=1).max())})
(P/'metadata.json').write_text(json.dumps(meta,indent=2));print('MAXIMUM ROUNDING',meta['maximumRoundBodyChange'])
