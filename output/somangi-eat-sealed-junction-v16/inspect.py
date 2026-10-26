import bpy,collections,json,numpy as np
from pathlib import Path
P=Path('C:/GitHub/StockWars/output/somangi-eat-original-collar-v15')
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
meta=json.loads((P/'metadata.json').read_text());ids=set(meta['headIds']);ob=bpy.data.objects['Somangi_SmoothBody']
edges=collections.Counter(tuple(sorted((a,b))) for f in ob.data.polygons if all(i in ids for i in f.vertices) for a,b in zip(f.vertices,list(f.vertices)[1:]+[f.vertices[0]]))
bound=[e for e,n in edges.items() if n==1];vids=sorted({i for e in bound for i in e});co=np.array([tuple(ob.data.vertices[i].co) for i in vids])
print('HEAD BOUNDARY',len(bound),'BOUNDS',co.min(0),co.max(0),'MEAN',co.mean(0))
print('LOW',sorted(co.tolist(),key=lambda p:p[2])[:5])
