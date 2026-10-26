import bpy,bmesh,json,collections,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];bm=bmesh.new();bm.from_mesh(b.data);layer=bm.verts.layers.deform.active
edges=[e for e in bm.edges if e.is_boundary];print('BOUNDARY EDGES',len(edges),collections.Counter(e.link_faces[0].material_index for e in edges));print('ROOT BOUNDARY',len([e for e in edges if -.45<e.calc_center_median().z<.04]) if False else '')
for mat in [0,2]:
 es=[e for e in edges if e.link_faces[0].material_index==mat];print('MAT',mat,'edges',len(es),'bounds',np.array([v.co[:] for e in es for v in e.verts]).min(0) if es else '',np.array([v.co[:] for e in es for v in e.verts]).max(0) if es else '')
