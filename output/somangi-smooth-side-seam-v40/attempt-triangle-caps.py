import bpy,bmesh,numpy as np,json,sys,math,heapq,collections
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'));body=bpy.data.objects['Somangi_SmoothBody'];bpy.context.scene.frame_set(136);mesh=body.data
saved=[n.vector.copy() for n in mesh.corner_normals];bm=bmesh.new();bm.from_mesh(mesh);deform=bm.verts.layers.deform.active;nl=bm.loops.layers.float_vector.new('OriginalNormals');original=bm.verts.layers.int.new('SourceVertex');marker=bm.verts.layers.int.new('OperationVertex');patch=bm.faces.layers.int.new('PatchID')
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
 iteration=len(report)+1
 result=bmesh.ops.holes_fill(bm,edges=edges,sides=0)
 initial_faces=result.get('faces',[])
 for f in initial_faces:f.material_index=2;f.smooth=True;f[patch]=iteration
 if initial_faces:
  bmesh.ops.triangulate(bm,faces=list(initial_faces))
 capfaces={f for f in bm.faces if f[patch]==iteration}
 internal={e for f in capfaces for e in f.edges if len(e.link_faces)==2 and all(a[patch]==iteration for a in e.link_faces)}
 before=[v.co.copy() for v in bm.verts]
 for j,v in enumerate(bm.verts):v[marker]=j+1
 if internal:bmesh.ops.subdivide_edges(bm,edges=list(internal),cuts=2,use_grid_fill=True)
 fresh={v for v in bm.verts if v[marker]<=0 or (v.co-before[v[marker]-1]).length>1e-8}
 faces={f for f in bm.faces if f[patch]==iteration}
 boundary={v for e in bm.edges if any(f[patch]==iteration for f in e.link_faces) and any(f[patch]!=iteration for f in e.link_faces) for v in e.verts}
 for f in faces:f.material_index=2;f.smooth=True
 if part==0:
  selected=list(boundary|fresh);lookup={v:j for j,v in enumerate(selected)};xyz=np.array([v.co[:] for v in selected]);Y=xyz[:,1]/.15;Z=(xyz[:,2]+.2)/.2
  fitted=np.array([sum(c*y**a*z**b for c,(a,b) in zip(fits[sign],terms)) for y,z in zip(Y,Z)])*sign
  residual=np.zeros(len(selected));fixed=np.array([v in boundary for v in selected]);residual[fixed]=xyz[fixed,0]-fitted[fixed]
  rows=[];cols=[];weights=[]
  for v,j in lookup.items():
   for e in v.link_edges:
    u=e.other_vert(v)
    if u in lookup:
     k=lookup[u];d=np.linalg.norm(xyz[j,1:]-xyz[k,1:]);rows.append(j);cols.append(k);weights.append(1/max(d,.0005))
  rows=np.array(rows);cols=np.array(cols);weights=np.array(weights);den=np.bincount(rows,weights=weights,minlength=len(selected))
  for _ in range(800):
   avg=np.bincount(rows,weights=weights*residual[cols],minlength=len(selected))/np.maximum(den,1e-8);residual[~fixed]=avg[~fixed]
  for v in fresh:
   j=lookup[v];v.co.x=float(fitted[j]+residual[j]);x,y,z=v.co
   v[deform].clear();radius=max(abs(x)/.41,abs(y)/.28);ease=lambda t:np.clip(t,0,1)**3*(np.clip(t,0,1)*(np.clip(t,0,1)*6-15)+10);w=float(ease((z+.24)/.215)*(1-ease((radius-.9)/.35)))
   if w<1:v[deform][body.vertex_groups['Body'].index]=1-w
   if w>0:v[deform][body.vertex_groups['Head'].index]=w
 else:
  key=str(part);axis=(Vector(meta['palms'][key])-Vector(meta['centers'][key])).normalized();dist={v:0. for v in boundary};queue=[];counter=0
  for v in boundary:heapq.heappush(queue,(0,counter,v));counter+=1
  selected=boundary|fresh
  while queue:
   d,_,v=heapq.heappop(queue)
   if d>dist[v]+1e-8:continue
   for e in v.link_edges:
    u=e.other_vert(v)
    if u not in selected:continue
    nd=d+e.calc_length()
    if nd<dist.get(u,1e9):dist[u]=nd;heapq.heappush(queue,(nd,counter,u));counter+=1
  for v in fresh:
   amount=.09*math.sqrt(min(dist.get(v,0)/.065,1))*float(np.clip((v.co.z+.29)/.12,0,1));v.co-=axis*amount;v[deform].clear();v[deform][next(g for g,k in arm_groups.items() if k==part)]=1
 for v in fresh:v[original]=0
 report.append(dict(owner=part,boundaryEdges=len(edges),newVertices=len(fresh),newFaces=len(faces)));print(report[-1])
bm.normal_update();near={v for f in bm.faces if f.material_index==2 for v in f.verts}
for _ in range(2):near.update(v for a in list(near) for e in a.link_edges for v in e.verts)
for v in near:
 for l in v.link_loops:l[nl]=v.normal
normal=[l[nl][:] for f in bm.faces for l in f.loops];bm.verts.index_update();mapping={str(v[original]-1):v.index for v in bm.verts if v[original]>0};remaining=sum(e.is_boundary for e in bm.edges);bm.to_mesh(mesh);bm.free();mesh.update();mesh.normals_split_custom_set(normal)
ids={n:[v.index for v in mesh.vertices if any(g.group==body.vertex_groups[n].index and g.weight>.999 for g in v.groups)] for n in ['Arm.L','Arm.R']};(P/'arm-vertices.json').write_text(json.dumps(ids));(P/'vertex-map.json').write_text(json.dumps(mapping));(P/'topology-repair.json').write_text(json.dumps(dict(patches=report,remainingBoundaryEdges=remaining),indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True);merge_clip(P/'somangi-eat.glb','RebuiltSmoothSockets_RigidArms')

