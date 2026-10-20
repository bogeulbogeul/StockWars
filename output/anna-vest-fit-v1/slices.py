import bpy
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/anna-base-face-v7/Anna-clean-face.blend')
o=bpy.data.objects['Anna_BaseBody']
for z in [-.7,-.6,-.5,-.4,-.3,-.2,-.1,0]:
 v=[v.co for v in o.data.vertices if abs(v.co.z-z)<.012 and abs(v.co.x)<.36]
 print(z,[(round(min(p[i] for p in v),3),round(max(p[i] for p in v),3)) for i in [0,1]])
