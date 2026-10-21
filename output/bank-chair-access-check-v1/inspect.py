import bpy
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/bank-open-front-v2/Bank-furnished-room.blend')
for o in bpy.context.scene.objects:
 if o.type=='MESH' and ('Executive' in o.name or 'Desk' in o.name or 'Counter' in o.name):
  p=[o.matrix_world@Vector(c) for c in o.bound_box]
  print(o.name,[round(min(v[i] for v in p),3) for i in range(3)],[round(max(v[i] for v in p),3) for i in range(3)])
