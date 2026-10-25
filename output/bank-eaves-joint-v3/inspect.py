import bpy
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/bank-eaves-joint-v3/Bank-eaves-joint.blend')
s=bpy.context.scene;c=s.camera
c.location=(3,-5,3);c.data.ortho_scale=.85;c.rotation_euler=(Vector((.66,-1.06,1.43))-c.location).to_track_quat('-Z','Y').to_euler();bpy.context.view_layer.update()
for x,y in [(515,687),(510,675),(520,700),(540,650)]:
 origin=c.matrix_world@Vector(((x/1200-.5)*.85,(.5-y/1000)*.85*1000/1200,0))
 d=c.matrix_world.to_3x3()@Vector((0,0,-1))
 hit,p,n,i,o,m=s.ray_cast(bpy.context.evaluated_depsgraph_get(),origin,d)
 print('HIT',x,y,o.name if o else None,tuple(p),i,[a.name for a in o.data.materials] if o else [])
