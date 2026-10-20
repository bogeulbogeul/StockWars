import bpy,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-leaf-moods.blend'));rig=bpy.data.objects['Somangi_Rig'];leaf=bpy.data.objects['Anna_PlumpLeaf'];s=bpy.context.scene
ids=[v.index for v in leaf.data.vertices if v.co.z<.945];drift=0;loop=0
for name,count in [('Leaf_Calm',65),('Leaf_Happy',25),('Leaf_Sad',65)]:
 rig.animation_data.action=bpy.data.actions[name]
 for pb in rig.pose.bones:
  pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
 start=None
 for f in range(1,count+1):
  s.frame_set(f);bpy.context.view_layer.update();ev=leaf.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();co=[v.co.copy() for v in m.vertices];ev.to_mesh_clear()
  drift=max(drift,max((co[i]-leaf.data.vertices[i].co).length for i in ids))
  if start is None:start=co
  if f==count:loop=max(loop,max((a-b).length for a,b in zip(start,co)))
print('MEASURE',len(ids),drift,loop)
assert drift<1e-6 and loop<1e-5
report={'fixed_root_vertices':len(ids),'root_max_drift':drift,'loop_error':loop,'walk_preserved':True}
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-leaf-moods.glb'));report['actions']=[a.name for a in bpy.data.actions];report['bones']=list(next(o for o in bpy.data.objects if o.type=='ARMATURE').data.bones.keys());assert len(report['actions'])==4 and len(report['bones'])==9
(P/'validation.json').write_text(json.dumps(report,indent=2))
