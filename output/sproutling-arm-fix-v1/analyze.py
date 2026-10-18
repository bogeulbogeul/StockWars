import bpy,bmesh,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'original.blend'))
o=next(o for o in bpy.data.objects if o.type=='MESH')
bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=0.00001);bm.to_mesh(o.data);bm.free()
adj=[[] for v in o.data.vertices]
for e in o.data.edges:
 a,b=e.vertices;adj[a].append(b);adj[b].append(a)
seen=set();groups=[]
for i in range(len(adj)):
 if i in seen:continue
 stack=[i];seen.add(i);ids=[]
 while stack:
  k=stack.pop();ids.append(k)
  for j in adj[k]:
   if j not in seen:seen.add(j);stack.append(j)
 vs=[o.data.vertices[j].co for j in ids]
 groups.append({'n':len(ids),'bounds':[[round(min(v[a] for v in vs),4),round(max(v[a] for v in vs),4)] for a in range(3)]})
print(json.dumps(sorted(groups,key=lambda x:-x['n'])[:30]))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'welded.blend'))
