import bpy
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-eat-belly-contour-v13/somangi-eat.blend')
o=bpy.data.objects['Somangi_SmoothBody']
from collections import Counter
print('FACES',Counter(p.material_index for p in o.data.polygons))
for i,m in enumerate(o.data.materials):print('MAT',i,m.name)
