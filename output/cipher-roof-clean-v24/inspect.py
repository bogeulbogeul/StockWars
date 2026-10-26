import bpy
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/cipher-roof-clean-v24/CipherSecurities-clean-roof.blend')
s=bpy.context.scene
for x,y in [(-1.15,1.49),(-.90,1.2),(1.58,1.1),(-1.02,-1.5)]:
 hit,p,n,i,o,m=s.ray_cast(bpy.context.evaluated_depsgraph_get(),Vector((x,y,20)),Vector((0,0,-1)))
 print('HIT',x,y,o.name,tuple(p))
