import bpy,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-sit.blend'));s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];body=bpy.data.objects['Somangi_Body'];torso=bpy.data.objects['Eating_Torso'];ground=-.950443
rig.animation_data.action=bpy.data.actions['Sit_Demo'];below=0;torsoerror=0
for f in range(1,98):
 s.frame_set(f);deps=bpy.context.evaluated_depsgraph_get()
 for obj in [body,torso]:
  ev=obj.evaluated_get(deps);m=ev.to_mesh();below=max(below,ground-min(v.co.z for v in m.vertices))
  if obj==torso:
   pb=rig.pose.bones['Body'];tr=pb.matrix@pb.bone.matrix_local.inverted();torsoerror=max(torsoerror,max((v.co-tr@old.co).length for v,old in zip(m.vertices,obj.data.vertices)))
  ev.to_mesh_clear()
# End of sit-down and start of stand-up must match the hold pose.
poses={}
for name,f in [('SitDown',25),('Seated',1),('StandUp',1)]:
 rig.animation_data.action=bpy.data.actions[name];s.frame_set(f);poses[name]=[tuple(x for row in pb.matrix for x in row) for pb in rig.pose.bones]
assert poses['SitDown']==poses['Seated']==poses['StandUp']
report={'ground_penetration_max':below,'torso_rigid_error':torsoerror,'transition_pose_match':True}
assert below<.005 and torsoerror<1e-5,report
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-sit.glb'));report['clips']=[a.name for a in bpy.data.actions];assert len(report['clips'])==8
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
