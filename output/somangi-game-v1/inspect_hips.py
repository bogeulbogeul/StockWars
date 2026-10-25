import bpy,bmesh,json,collections,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-walk.blend'))
o=bpy.data.objects['Somangi_SmoothBody'];m=o.data;bm=bmesh.new();bm.from_mesh(m)
boundary=[e for e in bm.edges if len(e.link_faces)==1 and max(v.co.z for v in e.verts)<-.45]
print('vertices',len(m.vertices),'boundary edges lower',len(boundary))
print('boundary samples',[[list(v.co) for v in e.verts] for e in boundary[::max(1,len(boundary)//12)]])
seen=set();components=[]
for v in bm.verts:
 if v.index in seen:continue
 stack=[v];seen.add(v.index);indices=[]
 while stack:
  a=stack.pop();indices.append(a.index)
  for e in a.link_edges:
   b=e.other_vert(a)
   if b.index not in seen:seen.add(b.index);stack.append(b)
 points=np.array([m.vertices[i].co[:] for i in indices]);components.append(dict(n=len(indices),min=points.min(0).tolist(),max=points.max(0).tolist()))
print('components',json.dumps(sorted(components,key=lambda x:-x['n'])[:15]))
groups=collections.defaultdict(list)
for v in m.vertices:
 if v.co.z<-.45:groups[tuple(round(c,5) for c in v.co)].append(v.index)
different=[]
for p,ids in groups.items():
 if len(ids)<2:continue
 weights=[{o.vertex_groups[g.group].name:round(g.weight,5) for g in m.vertices[i].groups if g.weight>1e-5} for i in ids]
 if any(w!=weights[0] for w in weights):different.append([p,ids,weights])
print('different coincident weights',len(different),json.dumps(different[:6]))
