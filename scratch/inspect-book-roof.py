import bpy
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/bookstore-roof-clean-v3/Bookstore-clean-aerial-roof.blend')
for o in bpy.data.objects:
 if o.name.startswith('Clean_Pitched_Roof_Wing_Rear'):print('BASE',[(round(v.co.x,4),round(v.co.y,4),round(v.co.z,4)) for v in o.data.vertices][:20])
