import bpy,numpy as np
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-eat-drink-grip-v3/somangi-bread.blend')
o=bpy.data.objects['Somangi_SmoothBody'];g=o.vertex_groups['Part.Root'].index
ids=[v.index for v in o.data.vertices if any(a.group==g for a in v.groups)];a=np.array([tuple(o.data.vertices[i].co) for i in ids])
for z in np.arange(-.5,-.09,.025):
 b=a[(abs(a[:,2]-z)<.015)&(abs(a[:,1])>.07)&(abs(a[:,0])>.07)]
 X=np.stack([b[:,0]**2,b[:,1]**2],axis=1);w=np.linalg.lstsq(X,np.ones(len(b)),rcond=None)[0]
 print(round(z,3),len(b),np.round(1/np.sqrt(w),3))
