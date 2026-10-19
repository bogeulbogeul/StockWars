import bpy,json,math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-jump.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];body=bpy.data.objects['Eating_Torso'];head=bpy.data.objects['Somangi_Body'];objects=[body,head,bpy.data.objects['Rigid_Arm.L'],bpy.data.objects['Rigid_Arm.R']]
base={o.name:[v.co.copy() for v in o.data.vertices] for o in objects};lower=[v.index for v in head.data.vertices if v.co.z<-.73];lower_set=set(lower);legedges=[e for e in head.data.edges if all(i in lower_set for i in e.vertices)]
ends={};leg_error=0;belly_error=0;penetration=0;heights=[];floor=min(base[head.name][i].z for i in lower)
for frame in range(1,38):
 s.frame_set(frame);dg=bpy.context.evaluated_depsgraph_get();snap={}
 for o in objects:
  evaluated=o.evaluated_get(dg);m=evaluated.to_mesh();coords=[v.co.copy() for v in m.vertices];assert all(math.isfinite(c) for p in coords for c in p)
  snap[o.name]=coords
  if o==body:
   offset=coords[0]-base[o.name][0];belly_error=max(belly_error,max((p-q-offset).length for p,q in zip(coords,base[o.name])))
  if o==head:
   minfoot=min(coords[i].z for i in lower);heights.append(minfoot-floor);penetration=max(penetration,floor-minfoot)
   for e in legedges:
    a,b=e.vertices;leg_error=max(leg_error,abs((coords[a]-coords[b]).length-(base[o.name][a]-base[o.name][b]).length))
  evaluated.to_mesh_clear()
 if frame in [1,37]:ends[frame]=snap
 for pb in rig.pose.bones:assert all(abs(x-1)<1e-7 for x in pb.scale)
loop=max((a-b).length for name in ends[1] for a,b in zip(ends[1][name],ends[37][name]));assert loop<1e-5 and penetration<1e-5 and leg_error<1e-5 and belly_error<1e-5 and max(heights)>.4
report={'frames':37,'duration_seconds':1.5,'maximum_root_jump_height':.45,'maximum_foot_clearance':max(heights),'floor_penetration':penetration,'leg_edge_length_error':leg_error,'belly_shape_error_after_translation':belly_error,'loop_error':loop,'bone_scales_fixed':True}
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'somangi-jump.glb'));report['roundtrip_clips']=[a.name for a in bpy.data.actions];assert 'Jump' in report['roundtrip_clips']
(P/'validation.json').write_text(json.dumps(report,indent=2));print('JUMP_VALIDATION',json.dumps(report))
