import bpy,numpy as np
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-eat-drink-grip-v3/somangi-bread.blend')
o=bpy.data.objects['Somangi_SmoothBody']
for name in ['Part.Root','Part.Arm.L','Part.Arm.R','Part.Leg.L','Part.Leg.R']:
 g=o.vertex_groups[name].index;a=np.array([tuple(v.co) for v in o.data.vertices if any(a.group==g for a in v.groups)])
 print(name,a.min(0),a.max(0))
