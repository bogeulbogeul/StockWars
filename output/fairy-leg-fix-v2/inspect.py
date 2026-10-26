import bpy,json
from pathlib import Path
p=Path('C:/GitHub/StockWars/output/fairy-leg-fix-v2')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(p.parent/'fairy-body-narrow-v1/somangi-walk.glb'))
out={}
for name in ['Somangi_Body','Eating_Torso']:
 o=bpy.data.objects[name];m=o.data;adj=[[] for v in m.vertices]
 for e in m.edges:
  a,b=e.vertices;adj[a].append(b);adj[b].append(a)
 seen=set();cs=[]
 for i in range(len(adj)):
  if i in seen:continue
  todo=[i];seen.add(i);ids=[]
  while todo:
   k=todo.pop();ids.append(k)
   for n in adj[k]:
    if n not in seen:seen.add(n);todo.append(n)
  if len(ids)>20:
   vs=[m.vertices[k] for k in ids]
   cs.append({'n':len(ids),'bounds':[[min(v.co[j] for v in vs),max(v.co[j] for v in vs)] for j in range(3)],'groups':list(set(o.vertex_groups[g.group].name for v in vs for g in v.groups if g.weight>.5))})
 out[name]=cs
print(json.dumps(out,indent=2));(p/'components.json').write_text(json.dumps(out,indent=2))
