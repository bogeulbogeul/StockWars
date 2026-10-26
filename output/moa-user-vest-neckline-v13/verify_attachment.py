"""Verify the delivered GLB keeps shoulders attached throughout its walk."""
import bpy,json,math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'moa.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
rig.animation_data_create()
for track in rig.animation_data.nla_tracks:track.mute=True
action=next(a for a in bpy.data.actions if a.name.startswith('Walk_InPlace'))
rig.animation_data.action=action
rig.animation_data.action_slot=action.slots[0]
start,end=action.frame_range
errors=[];poses=[]
for i in range(31):
    frame=start+(end-start)*i/30
    bpy.context.scene.frame_set(math.floor(frame),subframe=frame-math.floor(frame))
    bpy.context.view_layer.update()
    for name in ('Arm.L','Arm.R'):
        pb=rig.pose.bones[name]
        expected=rig.pose.bones['Body'].matrix@rig.data.bones['Body'].matrix_local.inverted()@pb.bone.head_local
        errors.append((pb.head-expected).length)
    poses.append({p.name:list(p.matrix.translation) for p in rig.pose.bones})
loop=max(math.dist(poses[0][n],poses[-1][n]) for n in poses[0])
result=dict(samples=31,maximumShoulderRootError=max(errors),maximumBoneLoopPositionError=loop,
            leafMoodClips=len([a for a in bpy.data.actions if a.name.startswith('Moa_Leaf_')]))
assert max(errors)<1e-5 and loop<1e-5 and result['leafMoodClips']==5
(P/'delivered-attachment-check.json').write_text(json.dumps(result,indent=2))
print(result)
