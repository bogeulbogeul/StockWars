import bpy,sys,json
import numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parent;sys.path.insert(0,str(ROOT))
sys.path.append(str(ROOT.parent/'cipher-exterior-blender-v1'));sys.path.append(str(ROOT.parent/'cipher-roof-traced-v17'))
from projection import design
from roof import plane
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'CipherSecurities-reference.blend'))
d=design();h=plane([d['peak'],d['rear'],d['right']]);rows=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH' or not o.name.startswith('Roof_') or 'Central_Right' not in o.name:continue
 p=[o.matrix_world@v.co for v in o.data.vertices]
 offsets=[v.z-h(v.x,v.y) for v in p]
 rows.append({'name':o.name,'lo':min(offsets),'hi':max(offsets),'vertices':len(p)})
(ROOT/'plane-depths.json').write_text(json.dumps(rows,indent=2))
print(sorted(rows,key=lambda r:r['hi'],reverse=True)[:5])
print(sorted(rows,key=lambda r:r['lo'])[:5])
