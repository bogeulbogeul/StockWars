import bpy,json,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-rigid-whole-arms-v38/somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];v=np.array([v.co[:] for v in b.data.vertices]);g={}
for n in ['Body','Head','Arm.L','Arm.R']:
 idx=b.vertex_groups[n].index;ids=[p.index for p in b.data.vertices if any(x.group==idx and x.weight>.999 for x in p.groups)];g[n]=ids
 for mat in range(len(b.data.materials)):
  fs=[f for f in b.data.polygons if f.material_index==mat and all(i in set(ids) for i in f.vertices)] if False else []
 print(n,len(ids),v[ids].min(0),v[ids].max(0))
for mat in range(len(b.data.materials)):
 fs=[f for f in b.data.polygons if f.material_index==mat];ix=list({i for f in fs for i in f.vertices});print('MAT',mat,b.data.materials[mat].name,len(fs),v[ix].min(0),v[ix].max(0))
np.savez(P/'mesh.npz',vertices=v,faces=np.array([[f.vertices[0],f.vertices[j],f.vertices[j+1]] for f in b.data.polygons for j in range(1,len(f.vertices)-1)]),materials=np.array([f.material_index for f in b.data.polygons]),**g)

