import bpy,json,math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-walk.blend'));s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];head=bpy.data.objects['Somangi_Body'];body=bpy.data.objects['Eating_Torso']
feet=[v.index for v in head.data.vertices if v.co.z<-.73];footset=set(feet);edges=[e for e in head.data.edges if all(i in footset for i in e.vertices)];base=[v.co.copy() for v in head.data.vertices];bodybase=[v.co.copy() for v in body.data.vertices];floor=min(base[i].z for i in feet);penetration=0;gap=0;length_error=0;belly_error=0;ends={}
for sample in range(97):
 time=1+sample/4;s.frame_set(int(time),subframe=time-int(time));dg=bpy.context.evaluated_depsgraph_get();obj=head.evaluated_get(dg);m=obj.to_mesh();coords=[v.co.copy() for v in m.vertices];assert all(math.isfinite(c) for v in coords for c in v)
 low=min(coords[i].z for i in feet);penetration=max(penetration,floor-low);gap=max(gap,low-floor)
 for e in edges:
  a,b=e.vertices;length_error=max(length_error,abs((coords[a]-coords[b]).length-(base[a]-base[b]).length))
 if sample in [0,96]:ends[sample]=coords
 obj.to_mesh_clear();obj=body.evaluated_get(dg);m=obj.to_mesh();delta=m.vertices[0].co-bodybase[0];belly_error=max(belly_error,max((v.co-p-delta).length for v,p in zip(m.vertices,bodybase)));obj.to_mesh_clear()
 assert all(rig.pose.bones['Leg.'+side].location.length<1e-7 for side in ['L','R'])
loop=max((a-b).length for a,b in zip(ends[0],ends[96]));report={'samples':97,'leg_swing_degrees':24,'arm_swing_degrees':18,'cycle_seconds':.75,'floor_penetration':penetration,'support_gap':gap,'leg_edge_error':length_error,'belly_shape_error':belly_error,'loop_error':loop}
assert penetration<.003 and gap<.003 and length_error<1e-5 and belly_error<1e-5 and loop<1e-5,report
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'somangi-walk.glb'));report['clips']=[a.name for a in bpy.data.actions];assert 'Walk_InPlace' in report['clips'];(P/'validation.json').write_text(json.dumps(report,indent=2));print('WALK_VALIDATION',json.dumps(report))
