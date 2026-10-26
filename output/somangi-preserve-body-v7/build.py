import bpy,numpy as np,sys,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points,ratio,bake_shapes
from mouth import replace_mouth
from merge_clip import merge_clip
from rigid_joints import prepare_joints
sys.path.insert(0,str(P.parent/'somangi-bench-down-v1'))
from rig_utils import surface_hash
SOURCE=P.parent/'somangi-eat-drink-grip-v3'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'somangi-bread.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_OriginalRig'];root=bpy.data.objects['bread_Prop']
original=surface_hash(body);base=np.array([tuple(v.co) for v in body.data.vertices])
meta=json.loads((SOURCE/'bread-metadata.json').read_text());ids=meta['palmVertexIds']
scene=bpy.context.scene;scene.frame_set(41);peak=points(body)
anchors={side:root.matrix_world.inverted()@Vector(peak[indices].mean(0)) for side,indices in ids.items()}
scale=root.scale.copy();source=[];transforms=[]
for frame in range(1,92):
    scene.frame_set(frame);source.append(points(body));transforms.append((root.location.copy(),root.rotation_quaternion.copy()))
root.animation_data_clear();root.rotation_mode='QUATERNION';cache=[]
base_all,arm_ids,preservation=prepare_joints(body)
static_shape=base_all.copy()
static=np.ones(len(base_all),dtype=bool)
for indices in arm_ids.values():static[indices]=False
for i,coords in enumerate(source):
    frame=i+1;s=ratio(i/30);loc,q=transforms[i];new_scale=scale*s
    corrected=static_shape.copy()
    for side in ['L','R']:
        a=anchors[side];target=loc+q@Vector((a.x*new_scale.x,a.y*new_scale.y,a.z*new_scale.z))
        old=Vector(base[ids[side]].mean(0));pivot=rig.data.bones['Arm.'+side].head_local.copy()
        rotation=(old-pivot).rotation_difference(target-pivot)
        offset=target-(pivot+rotation@(old-pivot))
        matrix=np.array(rotation.to_matrix())
        indices=arm_ids[side]
        corrected[indices]=(base_all[indices]-np.array(pivot))@matrix.T+np.array(pivot+offset)
    cache.append(corrected.astype(np.float32))
    root.location=loc;root.rotation_quaternion=q;root.scale=new_scale
    for path in ['location','rotation_quaternion','scale']:root.keyframe_insert(path,frame=frame)
fixed_ids=np.flatnonzero(static[:len(base)])
maximum_static_displacement=max(float(np.max(np.abs(c[fixed_ids]-base[fixed_ids]))) for c in cache)
assert maximum_static_displacement==0, maximum_static_displacement
bake_shapes(body,cache,'TwoHandEat')
mouth,mouth_cache=replace_mouth(body,base_all,cache);bake_shapes(mouth,mouth_cache,'Mouth')
assert np.max(np.abs(np.array([tuple(v.co) for v in body.data.vertices])[:len(base)]-base))==0
scene.name='Eat_Bread';scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
for o in [body,rig,root,mouth,*root.children]:o.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,
    export_skins=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,
    export_cameras=False,export_lights=False,export_morph=True)
merge_clip(P/'somangi-eat.glb','Eat_Bread')
(P/'metadata.json').write_text(json.dumps({'originalSurfaceAndUvPreserved':True,'originalMeshHash':original,'durationSeconds':3,
    'foodScales':[1,.82,.64,.46],'twoHands':True,'animatedMouth':True,'palmVertexIds':ids,
    'maximumTorsoHeadLegDisplacement':maximum_static_displacement,
    'gripAnchors':{s:list(a) for s,a in anchors.items()},'preservation':preservation,'gameInstalled':False},indent=2))
