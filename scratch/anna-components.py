import bpy,json
from pathlib import Path
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/anna-model-v1/inspection.blend')
o=next(o for o in bpy.data.objects if o.type=='MESH');m=o.data
parent=list(range(len(m.vertices)))
def find(a):
 while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
 return a
for e in m.edges:
 a,b=map(find,e.vertices);parent[a]=b
groups={}
for v in m.vertices:groups.setdefault(find(v.index),[]).append(v.index)
rows=[]
for ids in groups.values():
 if len(ids)<20:continue
 rows.append({'count':len(ids),'min':[min(m.vertices[i].co[k] for i in ids) for k in range(3)],'max':[max(m.vertices[i].co[k] for i in ids) for k in range(3)]})
print('COMPONENTS',json.dumps(sorted(rows,key=lambda x:-x['count'])[:30]))
