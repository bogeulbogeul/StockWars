import bpy,bmesh,json,collections
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];bm=bmesh.new();bm.from_mesh(b.data)
for kind in ['head','torso']:
 fs=[f for f in bm.faces if f.material_index==0] if kind=='head' else [f for f in bm.faces if f.material_index==5]
 selected=set(fs);edges=[e for e in bm.edges if sum(f in selected for f in e.link_faces)==1]
 adjacency=collections.defaultdict(set)
 for e in edges:
  a,c=e.verts;adjacency[a].add(c);adjacency[c].add(a)
 pending=set(adjacency);parts=[]
 while pending:
  q=[pending.pop()];part=set(q)
  while q:
   for v in adjacency[q.pop()]:
    if v in pending:pending.remove(v);part.add(v);q.append(v)
  parts.append(part)
 print(kind,'EDGES',len(edges),'LOOPS',[(len(p),[round(min(v.co[a] for v in p),4) for a in range(3)],[round(max(v.co[a] for v in p),4) for a in range(3)],collections.Counter(len(adjacency[v]) for v in p)) for p in sorted(parts,key=len,reverse=True)[:12]])
