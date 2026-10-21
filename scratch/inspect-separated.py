import bpy,numpy as np
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/anna-separated-v1/Anna-separated.blend')
for o in [o for o in bpy.context.scene.objects if o.type=='MESH']:
 v=np.array([v.co[:] for v in o.data.vertices]);print(o.name,len(v),len(o.data.polygons),'RAW',v.min(0),v.max(0))
 e=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=e.to_mesh();a=np.array([v.co[:] for v in m.vertices]);print('EVAL',len(a),a.min(0),a.max(0));e.to_mesh_clear()
