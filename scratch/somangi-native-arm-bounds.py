import bpy,numpy as np
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-black-eyes-v1/somangi-black-eyes.blend')
b=bpy.data.objects['Somangi_SmoothBody'];g=b.vertex_groups['Part.Arm.L'].index;p=np.array([v.co[:] for v in b.data.vertices if any(w.group==g for w in v.groups)])
for lo,hi in [(-.1,.1),(-.16,-.1),(-.25,-.16)]:
 a=p[(p[:,2]>lo)&(p[:,2]<hi)];print(lo,hi,len(a),np.min(a,0),np.max(a,0))
