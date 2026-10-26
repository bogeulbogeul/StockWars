import bpy,bmesh,json,collections
from pathlib import Path
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];bm=bmesh.new();bm.from_mesh(b.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index==2],context='FACES_ONLY');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');es=[e for e in bm.edges if e.is_boundary];adj=collections.defaultdict(list)
for e in es:
 for v in e.verts:adj[v].append(e)
print('BOUNDARY',len(es),'DEGREE',collections.Counter(len(v) for v in adj.values()));pending=set(es);components=[]
while pending:
 q=[pending.pop()];part=[]
 while q:
  e=q.pop();part.append(e)
  for v in e.verts:
   for a in adj[v]:
    if a in pending:pending.remove(a);q.append(a)
 components.append(part)
print('COMPONENTS',[(len(c),tuple(sum((sum((v.co for v in e.verts),__import__('mathutils').Vector())/2 for e in c),__import__('mathutils').Vector())/len(c))) for c in components])
