import bpy,numpy as np,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];head=set(json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds']);arms=set(sum(json.loads((P/'arm-vertices.json').read_text()).values(),[]))
points=[]
for v in b.data.vertices:
 x,y,z=v.co
 if v.index not in head and v.index not in arms and z>-.16 and abs(x)>.16:points.append([v.index,x,y,z,[(b.vertex_groups[g.group].name,g.weight) for g in v.groups]])
(P/'shoulder-points.json').write_text(json.dumps(points));print(len(points));print(points[::max(1,len(points)//16)])
