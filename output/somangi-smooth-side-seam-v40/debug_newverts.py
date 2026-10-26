import bpy,bmesh,numpy as np,json,sys,math,heapq,collections
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'));body=bpy.data.objects['Somangi_SmoothBody'];bpy.context.scene.frame_set(136);mesh=body.data
saved=[n.vector.copy() for n in mesh.corner_normals];bm=bmesh.new();bm.from_mesh(mesh);deform=bm.verts.layers.deform.active;nl=bm.loops.layers.float_vector.new('OriginalNormals');original=bm.verts.layers.int.new('SourceVertex')
for v in bm.verts:v[original]=v.index+1
for f,src in zip(bm.faces,mesh.polygons):
 for l,j in zip(f.loops,src.loop_indices):l[nl]=saved[j]
arm_groups={body.vertex_groups['Arm.L'].index:1,body.vertex_groups['Arm.R'].index:2}
def owner(v):return next((k for g,k in arm_groups.items() if v[deform].get(g,0)>.999),0)
terms=[(a,c) for a in range(5) for c in range(5-a)];fits={}
for sign in [-1,1]:
 ids={v for f in bm.faces if f.material_index==2 and all(owner(v)==0 for v in f.verts) for v in f.verts if v.co.x*sign>0};v=np.array([p.co[:] for p in ids]);y=v[:,1]/.15;z=(v[:,2]+.2)/.2;A=np.column_stack([y**a*z**c for a,c in terms]);fits[sign]=np.linalg.lstsq(A,np.abs(v[:,0]),rcond=1e-6)[0]
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index==2],context='FACES_ONLY');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
es=[e for e in bm.edges if e.is_boundary];adj=collections.defaultdict(list)
for e in es:
 for v in e.verts:adj[v].append(e)
pending=set(es);loops=[]
while pending:
 q=[pending.pop()];part=[]
 while q:
  e=q.pop();part.append(e)
  for v in e.verts:
   for a in adj[v]:
    if a in pending:pending.remove(a);q.append(a)
 loops.append(part)
meta=json.loads((P.parent/'somangi-whole-root-base-v35/metadata.json').read_text());report=[];allnew=set()
for edges in loops:
 boundary={v for e in edges for v in e.verts};part=collections.Counter(owner(v) for v in boundary).most_common(1)[0][0];sign=1 if sum(v.co.x for v in boundary)>0 else -1
 if len(edges)%2:
  e=max(edges,key=lambda e:e.calc_length());newedge,v=bmesh.utils.edge_split(e,e.verts[0],.5);edges.append(newedge);boundary.add(v);v[original]=0
 old=set(bm.verts);oldfaces=set(bm.faces)
 result=bmesh.ops.holes_fill(bm,edges=edges,sides=0)
 initial_faces=set(bm.faces)-oldfaces
 for f in initial_faces:f.material_index=2;f.smooth=True
 if initial_faces:
  bmesh.ops.triangulate(bm,faces=list(initial_faces))
  capfaces=set(bm.faces)-oldfaces
  internal={e for f in capfaces for e in f.edges if len(e.link_faces)==2 and all(a in capfaces for a in e.link_faces)}
  if internal:bmesh.ops.subdivide_edges(bm,edges=list(internal),cuts=2,use_grid_fill=True)
 print('DEBUG',len(bm.verts),len(old),len(set(bm.verts)-old),sum(v[original]==0 for v in bm.verts),sum(v[original]>0 for v in bm.verts));print('SOURCE_IDS',[v[original] for v in list(bm.verts)[:10]]);raise SystemExit
