import bpy,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];m=b.data;coords=np.array([v.co[:] for v in m.vertices]);a=np.zeros_like(coords);c=np.zeros(len(a))
for mat in m.materials:
 for node in mat.node_tree.nodes:
  if node.type=='BSDF_PRINCIPLED':print('SHADER',mat.name,[(s.name,s.default_value if isinstance(s.default_value,(int,float)) else str(s.default_value)) for s in node.inputs if s.name in ['Subsurface Weight','Roughness','Metallic','Transmission Weight','Alpha']])
for loop,n in zip(m.loops,m.corner_normals):a[loop.vertex_index]+=n.vector;c[loop.vertex_index]+=1
a/=np.maximum(c[:,None],1)
for z in np.arange(-.25,.11,.02):
 mask=(abs(coords[:,0])<.06)&(coords[:,1]>.07)&(abs(coords[:,2]-z)<.01)&(a[:,1]>.2)
 if np.any(mask):print(round(z,3),int(sum(mask)),np.mean(a[mask],axis=0))
