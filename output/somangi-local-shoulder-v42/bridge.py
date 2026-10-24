"""Replace only the upper torso shell with a continuous head-to-body surface."""
import bmesh,numpy as np
from math import atan2,pi
from mathutils import Vector

def connect(body,head_ids):
 mesh=body.data;bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table()
 heads={bm.verts[i] for i in head_ids}
 headfaces={f for f in bm.faces if all(v in heads for v in f.verts)}
 edges=[e for e in bm.edges if sum(f in headfaces for f in e.link_faces)==1]
 # Select the single lower rim, excluding facial feature loops.
 edges=[e for e in edges if all(v.co.z<.06 for v in e.verts)]
 rim=list({v for e in edges for v in e.verts})
 assert len(rim)>250
 adjacency={v:[] for v in rim}
 for e in edges:
  a,c=e.verts;adjacency[a].append(c);adjacency[c].append(a)
 assert all(len(v)==2 for v in adjacency.values())
 start=min(rim,key=lambda v:atan2(v.co.y-.015,v.co.x)%(2*pi))
 ordered=[start];previous=None;current=start
 while True:
  nxt=next(v for v in adjacency[current] if v!=previous)
  if nxt==start:break
  ordered.append(nxt);previous,current=current,nxt
 assert len(ordered)==len(rim)
 if sum(a.co.x*c.co.y-c.co.x*a.co.y for a,c in zip(ordered,ordered[1:]+ordered[:1]))<0:ordered=[ordered[0]]+ordered[:0:-1]
 rim=ordered
 torso=[f for f in bm.faces if f.material_index==5]
 geom=set(torso)
 for f in torso:geom.update(f.edges);geom.update(f.verts)
 cut=bmesh.ops.bisect_plane(bm,geom=list(geom),dist=1e-7,plane_co=(0,0,-.15),plane_no=(0,0,1),clear_outer=True,clear_inner=False)
 bm.normal_update()
 cutedges=[e for e in bm.edges if e.is_boundary and all(abs(v.co.z+.15)<1e-5 for v in e.verts)]
 pending=set(cutedges);loops=[]
 while pending:
  edge=pending.pop();part={edge};q=list(edge.verts)
  while q:
   for e in q.pop().link_edges:
    if e in pending:pending.remove(e);part.add(e);q.extend(e.verts)
  loops.append(part)
 assert len(loops)==2,len(loops)
 # The larger ring is the outer side of the thin torso shell.
 loops.sort(key=lambda es:np.mean([v.co.x**2+v.co.y**2 for e in es for v in e.verts]),reverse=True)
 base=list({v for e in loops[0] for v in e.verts})
 bmesh.ops.holes_fill(bm,edges=list(loops[1]),sides=0)
 center=.015
 angle=lambda v:atan2(v.co.y-center,v.co.x)%(2*pi)
 base.sort(key=angle)
 ba=np.array([angle(v) for v in base]);bc=np.array([v.co[:] for v in base]);hc=np.array([v.co[:] for v in rim])
 arc=np.linalg.norm(np.roll(hc,-1,axis=0)-hc,axis=1)
 ha=angle(rim[0])+np.r_[0,np.cumsum(arc[:-1])]/sum(arc)*2*pi
 bottom=np.column_stack([np.interp(ha,np.r_[ba[-1]-2*pi,ba,ba[0]+2*pi],np.r_[bc[-1,k],bc[:,k],bc[0,k]]) for k in range(3)])
 def lowpass(a):
  basis=np.column_stack([np.ones(len(ha))]+[f(k*ha) for k in range(1,5) for f in [np.cos,np.sin]])
  return basis@np.linalg.lstsq(basis,a,rcond=None)[0]
 sh=lowpass(hc);sb=lowpass(bottom)
 print('HEAD RIM SMOOTHING DISTANCE',np.quantile(np.linalg.norm(hc-sh,axis=1),[.5,.95,1]),flush=True)
 groups={n:body.vertex_groups[n].index for n in ['Body','Head']};deform=bm.verts.layers.deform.verify()
 ease=lambda t:max(0,min(1,t))**3*(max(0,min(1,t))*(max(0,min(1,t))*6-15)+10)
 for v in {v for edges in loops for e in edges for v in e.verts}:
  w=ease((-.15+.24)/.215);v[deform].clear();v[deform][groups['Body']]=1-w;v[deform][groups['Head']]=w
 rows=[];newfaces=[];custom={}
 # Low frequency tangent field prevents the old jagged cut rim from making
 # vertical shading bands in an otherwise smooth connecting surface.
 basis=np.column_stack([np.ones(len(ha))]+[f(k*ha) for k in range(1,5) for f in [np.cos,np.sin]])
 derivative=np.column_stack([np.zeros(len(ha))]+[v for k in range(1,5) for v in [-k*np.sin(k*ha),k*np.cos(k*ha)]])
 db=derivative@np.linalg.lstsq(basis,bottom,rcond=None)[0]
 dh=derivative@np.linalg.lstsq(basis,hc,rcond=None)[0]
 hn=lowpass(np.array([v.normal[:] for v in rim]))
 normal0=np.cross(db,sh-sb);normal0/=np.maximum(np.linalg.norm(normal0,axis=1,keepdims=True),1e-9)
 normalcoef=np.linalg.lstsq(basis,normal0,rcond=None)[0]
 for v in bm.verts:
  if -.21<v.co.z<=-.14999 and any(f.material_index==5 for f in v.link_faces):
   theta=angle(v);vec=np.array([1.]+[f(k*theta) for k in range(1,5) for f in [np.cos,np.sin]])@normalcoef
   if v.normal.dot(Vector((v.co.x,v.co.y-center,0)))>0:
    w=ease((v.co.z+.21)/.06);n=np.array(v.normal)*(1-w)+vec*w;custom[v]=n/max(np.linalg.norm(n),1e-9)
 for j in range(1,25):
  t=j/24
  if j==24:row=rim
  else:
   # A short, broad bridge follows the former body outline without a new neck.
   coords=sb*(1-t)+sh*t+(bottom-sb)*(1-t)**8+(hc-sh)*t**8
   row=[bm.verts.new(Vector(co)) for co in coords]
   for v in row:
    baseweight=ease((-.15+.24)/.215)
    w=baseweight+(1-baseweight)*t
    if w<1:v[deform][groups['Body']]=1-w
    if w>0:v[deform][groups['Head']]=w
  if rows:
   prev=rows[-1]
   for i in range(len(row)):
    f=bm.faces.new((prev[i],prev[(i+1)%len(row)],row[(i+1)%len(row)],row[i]));f.material_index=5;f.smooth=True;newfaces.append(f)
  rows.append(row)
  for k,v in enumerate(row):
   n=np.cross(db[k]*(1-t)+dh[k]*t,sh[k]-sb[k]);n/=max(np.linalg.norm(n),1e-9)
   # The head rim uses the same shared normal as the new bridge.
   blend=ease((t-.55)/.45);n=n*(1-blend)+hn[k]*blend;n/=max(np.linalg.norm(n),1e-9)
   custom[v]=n
 # Zipper triangulation preserves the existing body ring while joining its
 # unequal vertex count to the resampled bridge ring.
 a=base;c=rows[0];i=k=0
 while i<len(a) or k<len(c):
  an=ba[(i+1)%len(a)]+(2*pi if i+1>=len(a) else 0) if i<len(a) else 1e9
  cn=ha[(k+1)%len(c)]+(2*pi if k+1>=len(c) else 0) if k<len(c) else 1e9
  if an<cn:
   verts=(a[i%len(a)],a[(i+1)%len(a)],c[k%len(c)]);i+=1
  else:
   verts=(a[i%len(a)],c[(k+1)%len(c)],c[k%len(c)]);k+=1
  f=bm.faces.new(verts);f.material_index=5;f.smooth=True;newfaces.append(f)
 bm.normal_update()
 for f in newfaces:
  co=f.calc_center_median()
  if f.normal.dot(Vector((co.x,co.y-center,0)))<0:f.normal_flip()
 bm.verts.index_update();normalmap={v.index:n for v,n in custom.items()}
 bm.to_mesh(mesh);bm.free();mesh.update()
 normals=[normalmap.get(v.index,tuple(v.normal)) for v in mesh.vertices]
 mesh.normals_split_custom_set_from_vertices(normals)
