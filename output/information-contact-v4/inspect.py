import bpy,json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'information-roof-crafted-v3/Information-crafted-roof.blend'))
for o in bpy.context.scene.objects:
 if o.type=='MESH' and not o.name.startswith(('Main_Sage','Porch_Sage','Main_Ridge','Porch_Ridge','Preview_')):
  p=[o.matrix_world@Vector(v) for v in o.bound_box]
  print('BOUND',o.name,[(round(min(q[i] for q in p),5),round(max(q[i] for q in p),5)) for i in range(3)])
