import bpy
from mathutils import Vector
for path,action,frame in [('somangi-bench-sit-v2/somangi-bench-sit.blend','Bench_Seated',1),('anna-meshy-short-vest-v7/Anna-meshy-short-vest.blend','Seated',1)]:
 bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/'+path);rig=bpy.data.objects['Somangi_Rig'];rig.animation_data.action=bpy.data.actions[action];bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
 print('MODEL',path,'rig',rig.matrix_world[:],'bones',[(n,tuple(rig.data.bones[n].head_local),tuple(rig.pose.bones[n].location)) for n in ['Root','Leg.L','Arm.L']])
 for name in ['Somangi_Body','Eating_Torso']:
  o=bpy.data.objects.get(name)
  if not o:continue
  e=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=e.to_mesh();print(name,[(min(v.co[i] for v in m.vertices),max(v.co[i] for v in m.vertices)) for i in range(3)]);e.to_mesh_clear()
