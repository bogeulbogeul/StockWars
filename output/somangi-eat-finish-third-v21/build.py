import bpy,json,sys,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import ease
from merge_clip import merge_clip
S=P.parent/'somangi-eat-round-body-v20'
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
scene=bpy.context.scene;root=bpy.data.objects['bread_Prop'];children=list(root.children)
consumption=bpy.data.objects.new('Food_ThirdBiteConsumption',None);scene.collection.objects.link(consumption)
consumption.parent=root
for child in children:
    basis=child.matrix_basis.copy();inverse=child.matrix_parent_inverse.copy()
    child.parent=consumption;child.matrix_parent_inverse=inverse;child.matrix_basis=basis
for frame in range(1,92):
    t=(frame-1)/30
    remaining=0.0 if frame>=58 else float(np.clip(1-ease((t-1.77)/.13),0,1))
    consumption.scale=(remaining,remaining,remaining);consumption.keyframe_insert('scale',frame=frame)
for layer in consumption.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                if curve.data_path=='scale':
                    for point in curve.keyframe_points:point.interpolation='LINEAR'
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT');body=bpy.data.objects['Somangi_SmoothBody']
for ob in [body,root,*root.children_recursive,bpy.data.objects['Somangi_OriginalRig'],bpy.data.objects['Somangi_AnimatedMouth'],bpy.data.objects['Somangi_TemporarySmileCover']]:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
meta=json.loads((S/'metadata.json').read_text());meta.update({'thirdBiteShrinkStartsSeconds':1.77,
    'foodGoneSeconds':1.9,'foodGoneFrame':58,'characterMotionEdited':False,
    'foodConsumptionNode':consumption.name})
(P/'metadata.json').write_text(json.dumps(meta,indent=2));print('FOOD GONE AT FRAME 58, ALL CHARACTER MOTION PRESERVED')
