import bpy,json,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-continuous-shoulder-v41/somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];mesh=b.data
head=set(json.loads((P.parent/'somangi-continuous-shoulder-v41/head-indices.json').read_text()))
print('HEADFORMAT',type(head),len(head))
a=np.array([mesh.vertices[i].co[:] for i in head]);print('NATIVE HEAD',a.min(0),a.max(0))
for n in ['Head','Body','Arm.L','Arm.R']:
 gi=b.vertex_groups[n].index;ix=[v.index for v in mesh.vertices if any(g.group==gi and g.weight>.999 for g in v.groups)]
 a=np.array([mesh.vertices[i].co[:] for i in ix]);print(n,len(ix),a.min(0),a.max(0))
 if n=='Head':
  for z in [-.15,-.10,-.07,-.05,-.03,0,.03,.05,.1]:
   sub=a[a[:,2]<z];print('BELOW',z,len(sub),sub.min(0) if len(sub) else None,sub.max(0) if len(sub) else None)
print('MATS',[(i,m.name) for i,m in enumerate(mesh.materials)])
print('MODS',[(m.name,m.type) for m in b.modifiers])
