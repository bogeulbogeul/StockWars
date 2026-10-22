import bpy,numpy as np
from collections import Counter
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-eat-drink-grip-v3/somangi-bread.blend')
o=bpy.data.objects['Somangi_SmoothBody'];g=o.vertex_groups['Part.Root'].index
ids={v.index for v in o.data.vertices if any(a.group==g for a in v.groups)}
a=np.array([tuple(o.data.vertices[i].co) for i in ids])
for z in np.arange(-.5,.05,.025):
 b=a[(a[:,2]>=z)&(a[:,2]<z+.025)&(a[:,0]>.15)]
 if len(b):print('SLICE',round(z,3),len(b),np.round(b.min(0),3),np.round(b.max(0),3))
