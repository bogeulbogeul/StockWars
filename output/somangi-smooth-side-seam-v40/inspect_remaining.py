import bpy,bmesh,collections,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];bm=bmesh.new();bm.from_mesh(b.data);d=bm.verts.layers.deform.active;arms=[b.vertex_groups[n].index for n in ['Arm.L','Arm.R']]
def owner(v):
 return next((i+1 for i,g in enumerate(arms) if v[d].get(g,0)>.999),0)
for k in [0,1,2]:
 es=[e for e in bm.edges if e.is_boundary and all(owner(v)==k for v in e.verts)];print('OWNER',k,len(es));p=np.array([v.co[:] for e in es for v in e.verts]);print('BOUNDS',p.min(0) if len(p) else '',p.max(0) if len(p) else '')
