import bpy,json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];old=np.array([v.co[:] for v in b.data.vertices]);headids=set(json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds']);main={}
for name in ['Arm.L','Arm.R']:
 group=b.vertex_groups[name].index;valid={v.index for v in b.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)};adj={}
 for f in b.data.polygons:
  if f.material_index==0 and all(i in valid for i in f.vertices):
   for i in f.vertices:adj.setdefault(i,set()).update(f.vertices)
 pending=set(adj);parts=[]
 while pending:
  q=[pending.pop()];part=set(q)
  while q:
   for i in adj[q.pop()]:
    if i in pending:pending.remove(i);part.add(i);q.append(i)
  parts.append(part)
 main[name]=max(parts,key=len)
sourcecoords=dict(Head=old[list(headids)],**{n:old[list(ids)] for n,ids in main.items()});arms=set(sum(json.loads((P.parent/'somangi-hidden-shoulder-v39/arm-vertices.json').read_text()).values(),[]));faces=[list(f.vertices) for f in b.data.polygons if not any(i in headids or i in arms for i in f.vertices)];reference=BVHTree.FromPolygons([Vector(p) for p in old],faces)
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];report={};headmap=[]
for name,coords in sourcecoords.items():
 group=b.vertex_groups[name].index;ids=[v.index for v in b.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)];tree=KDTree(len(ids))
 for j,i in enumerate(ids):tree.insert(b.data.vertices[i].co,j)
 tree.balance();dist=[]
 for co in coords:
  _,j,d=tree.find(co);dist.append(d)
  if name=='Head':headmap.append(ids[j])
 report[name]=dict(originalVertices=len(coords),maximumOriginalPositionDifference=max(dist))
(P/'head-indices.json').write_text(json.dumps(headmap))
material=max(f.material_index for f in b.data.polygons);bf=[list(f.vertices) for f in b.data.polygons if f.material_index==material];tree=BVHTree.FromPolygons([v.co for v in b.data.vertices],bf);dist=[]
for direction in [(1,0,0),(-1,0,0),(0,1,0),(0,-1,0)]:
 for z in np.linspace(-.93,-.065,100):
  for u in np.linspace(-.35,.35,80):
   start=Vector((direction[0]*2,u,z)) if direction[0] else Vector((u,direction[1]*2,z));hit,_,_,_=tree.ray_cast(start,Vector(direction)*-1)
   if hit is not None:
    _,_,_,d=reference.find_nearest(hit);dist.append(d)
report['visibleTorsoSurface']=dict(samples=len(dist),maximumSurfaceDistance=max(dist),p99SurfaceDistance=float(np.quantile(dist,.99)),p95SurfaceDistance=float(np.quantile(dist,.95)))
report['materials']=[m.name for m in b.data.materials];(P/'appearance.json').write_text(json.dumps(report,indent=2));print(report)
assert all(report[n]['maximumOriginalPositionDifference']<1e-6 for n in ['Head','Arm.L','Arm.R'])
