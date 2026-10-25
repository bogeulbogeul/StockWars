import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'VivianStore-crafted-roof.blend'))
rows=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH' or not (o.name.startswith(('Left_Display','Right_Display')) or any(t in o.name.lower() for t in ('foundation','plinth','base_trim'))):continue
 points=[o.matrix_world@Vector(c) for c in o.bound_box]
 rows.append({'name':o.name,'min':[min(p[i] for p in points) for i in range(3)],'max':[max(p[i] for p in points) for i in range(3)]})
print(json.dumps(rows,indent=2));(ROOT/'panel-bounds.json').write_text(json.dumps(rows,indent=2))
