import bpy
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-eat-drink-v1/somangi-drink.blend')
bpy.context.scene.frame_set(42)
o=bpy.data.objects['Somangi_SmoothBody'];ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();c=[]
for f in m.polygons:
 if f.material_index==1:
  p=sum((m.vertices[i].co for i in f.vertices),Vector())/len(f.vertices)
  if abs(p.x)<.08 and p.z>.1 and p.y<0:c.append(p)
print('MOUTH',sum(c,Vector())/len(c))
print('CUP',bpy.data.objects['drink_Prop'].location)
print('HAND',bpy.data.objects['Somangi_OriginalRig'].pose.bones['Arm.R'].tail)
