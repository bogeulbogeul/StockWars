import bpy,json,numpy as np,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
S=P.parent/'somangi-eat-arm-clearance-v23';meta=json.loads((S/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];bpy.context.scene.frame_set(1);a=points(b)
print('MODIFIERS',[(m.name,m.type) for m in b.modifiers])
for s in ['L','R']:
    ids=set(meta['armRigidIds'][s]);used=set(i for p in b.data.polygons if all(i in ids for i in p.vertices) for i in p.vertices)
    coords=a[sorted(used)];anchor=a[meta['armAnchorIds'][s]]
    print(s,'used',len(used),'all',len(ids),'range',coords.min(0),coords.max(0),'anchor',anchor,'palm',a[meta['palmIds'][s]].mean(0),'palmUsed',len(used&set(meta['palmIds'][s])))
