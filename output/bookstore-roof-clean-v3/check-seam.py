import bpy,json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(R/'Bookstore-clean-aerial-roof.blend'))
s=bpy.context.scene;bad=[]
for i in range(101):
 y=-1.025+i*2.08/100;x=-.94+(2.47-(2.035-.30*abs(y-.015)))/.95
 for dx in (-.012,0,.012):
  hit,p,n,f,o,m=s.ray_cast(bpy.context.evaluated_depsgraph_get(),Vector((x+dx,y,10)),Vector((0,0,-1)))
  if not hit or not o.name.startswith('Clean_'):bad.append({'x':x+dx,'y':y,'object':o.name if o else None})
(R/'seam-samples.json').write_text(json.dumps({'samples':303,'unexpectedSurfaces':bad},indent=2));print('SEAM',len(bad),bad[:8])
