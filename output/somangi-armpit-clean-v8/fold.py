import bpy,numpy as np
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-eat-drink-grip-v3/somangi-bread.blend')
o=bpy.data.objects['Somangi_SmoothBody'];g=o.vertex_groups['Part.Root'].index
for v in o.data.vertices:
 if not any(a.group==g for a in v.groups):continue
 x,y,z=v.co
 if x<-.19 and -.41<z<-.24 and .03<y<.23 and v.normal.x>.1:print(v.index,tuple(round(a,3) for a in v.co),tuple(round(a,2) for a in v.normal))
