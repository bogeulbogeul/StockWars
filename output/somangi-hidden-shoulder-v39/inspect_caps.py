import bpy,json,collections
from pathlib import Path
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));m=bpy.data.objects['Somangi_SmoothBody'];arms=set(sum(json.loads((P/'arm-vertices.json').read_text()).values(),[]))
faces=[f for f in m.data.polygons if f.material_index==2 and not any(i in arms for i in f.vertices)];adj=collections.defaultdict(list)
for f in faces:
 for i in f.vertices:adj[i].append(f.index)
pending={f.index for f in faces};components=[]
while pending:
 q=[pending.pop()];part=[]
 while q:
  f=q.pop();part.append(f)
  for i in m.data.polygons[f].vertices:
   for j in adj[i]:
    if j in pending:pending.remove(j);q.append(j)
 components.append(part)
print('COMPONENTS',[(len(c),tuple(sum((m.data.polygons[i].center for i in c),__import__('mathutils').Vector())/len(c))) for c in components])
