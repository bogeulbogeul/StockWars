import bpy,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-rigged.blend'))
o=bpy.data.objects['Anna_Body'];m=o.data
np.savez(P/'surface.npz',vertices=np.array([v.co[:] for v in m.vertices]),normals=np.array([v.normal[:] for v in m.vertices]),edges=np.array([e.vertices[:] for e in m.edges]),faces=np.array([p.vertices[:] for p in m.polygons]),labels=np.array([p.material_index for p in m.polygons]))
