import bpy,bmesh,json,sys,collections,math,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from merge_clip import merge_clip;from socket_fairing import fair
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'));body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;scene.frame_set(136);mesh=body.data
saved=[n.vector.copy() for n in mesh.corner_normals];bm=bmesh.new();bm.from_mesh(mesh);nl=bm.loops.layers.float_vector.new('SavedNormal');origin=bm.verts.layers.int.new('Origin');eid=bm.edges.layers.int.new('Hole');marker=bm.verts.layers.int.new('Before')
for v in bm.verts:v[origin]=v.index+1
for f,src in zip(bm.faces,mesh.polygons):
 for l,j in zip(f.loops,src.loop_indices):l[nl]=saved[j]
terms=[(a,c) for a in range(5) for c in range(5-a)];fits={};armgroups={body.vertex_groups[n].index for n in ['Arm.L','Arm.R']};deform=bm.verts.layers.deform.active
for sign in [-1,1]:
 points=np.array([v.co[:] for v in bm.verts if v.co.x*sign>0 and any(f.material_index==2 for f in v.link_faces) and not any(v[deform].get(g,0)>.999 for g in armgroups)])
 y=points[:,1]/.15;z=(points[:,2]+.2)/.2;A=np.column_stack([y**a*z**c for a,c in terms]);fits[sign]=np.linalg.lstsq(A,np.abs(points[:,0]),rcond=1e-6)[0]
meta=json.loads((P.parent/'somangi-whole-root-base-v35/metadata.json').read_text())
nativehead=set(json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds'])
# Fit the original torso from front/back samples, beyond the arm surfaces.
raw=np.array([v.co[:] for v in mesh.vertices]);source_ids=[v.index for v in mesh.vertices if v.index not in nativehead and not any(g.group in armgroups and g.weight>.999 for g in v.groups)];points=raw[source_ids];heights=[];coeffs=[]
for z in np.linspace(-.46,-.015,100):
 p=points[(np.abs(points[:,2]-z)<.012)&(np.abs(points[:,1])>.14)&(np.abs(points[:,0])<.35)]
 if len(p)<15:continue
 y=p[:,1];A=np.column_stack([np.ones(len(y)),y,y*y]);c=np.linalg.lstsq(A,p[:,0]**2,rcond=None)[0]
 if c[2]>=0:continue
 heights.append(z);coeffs.append(c)
coeffs=np.array(coeffs)
for j in range(3):coeffs[:,j]=np.convolve(np.pad(coeffs[:,j],(3,3),mode='edge'),np.ones(7)/7,mode='valid')
source_tree=(np.array(heights),coeffs)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index==2],context='FACES_ONLY')
# Remove torso fragments within the replacement patch, retaining its original boundary.
deform=bm.verts.layers.deform.active
bad=[]
for f in bm.faces:
 if any(v[origin]-1 in nativehead for v in f.verts):continue
 if any(any(v[deform].get(g,0)>.999 for g in armgroups) for v in f.verts):continue
 c=f.calc_center_median()
 if abs(c.x)>.19 and abs(c.y)<.145 and -.425<c.z<-.02:bad.append(f)
bmesh.ops.delete(bm,geom=bad,context='FACES_ONLY')
# Small disconnected arm-labelled torso chips are construction remnants, not arms.
for group in armgroups:
 faces={f for f in bm.faces if all(v[deform].get(group,0)>.999 for v in f.verts)};components=[]
 while faces:
  q=[faces.pop()];part=[]
  while q:
   f=q.pop();part.append(f)
   for e in f.edges:
    for a in e.link_faces:
     if a in faces:faces.remove(a);q.append(a)
  components.append(part)
 if components:
  keep=max(components,key=len);remove=[f for c in components if c is not keep for f in c]
  if remove:bmesh.ops.delete(bm,geom=remove,context='FACES_ONLY')
bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
# Remove pinched one-vertex contacts so each replacement hole has a simple boundary.
for _ in range(8):
 degree=collections.Counter(v for e in bm.edges if e.is_boundary for v in e.verts);pinched={v for v,n in degree.items() if n>2}
 if not pinched:break
 remove={f for v in pinched for f in v.link_faces if not any(a[origin]-1 in nativehead for a in f.verts) and not any(any(a[deform].get(g,0)>.999 for g in armgroups) for a in f.verts)}
 if not remove:break
 bmesh.ops.delete(bm,geom=list(remove),context='FACES_ONLY');bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES');bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
adj=collections.defaultdict(list);pending={e for e in bm.edges if e.is_boundary}
for e in pending:
 for v in e.verts:adj[v].append(e)
count=0
while pending:
 count+=1;q=[pending.pop()]
 while q:
  e=q.pop();e[eid]=count
  for v in e.verts:
   for a in adj[v]:
    if a in pending:pending.remove(a);q.append(a)
bm.to_mesh(mesh);bm.free();bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body;bpy.ops.object.mode_set(mode='EDIT');bpy.context.tool_settings.mesh_select_mode=(False,True,False)
report=[];ag={body.vertex_groups['Arm.L'].index:1,body.vertex_groups['Arm.R'].index:2}
for k in range(1,count+1):
 bm=bmesh.from_edit_mesh(mesh);eid=bm.edges.layers.int['Hole'];origin=bm.verts.layers.int['Origin'];marker=bm.verts.layers.int['Before'];deform=bm.verts.layers.deform.active
 edges=[e for e in bm.edges if e.is_boundary and e[eid]==k]
 if not edges:continue
 verts={v for e in edges for v in e.verts};owner=lambda v:next((part for g,part in ag.items() if v[deform].get(g,0)>.999),0);part=collections.Counter(owner(v) for v in verts).most_common(1)[0][0]
 if len(edges)%2:
  e=max(edges,key=lambda e:e.calc_length());newedge,v=bmesh.utils.edge_split(e,e.verts[0],.5);newedge[eid]=k;edges.append(newedge);v[origin]=0
 for f in bm.faces:f.select=False
 for e in bm.edges:e.select=False
 for v in bm.verts:v.select=False
 for e in edges:e.select_set(True)
 before=[v.co.copy() for v in bm.verts]
 for j,v in enumerate(bm.verts):v[marker]=j+1
 bmesh.update_edit_mesh(mesh)
 try:result=bpy.ops.mesh.fill_grid(span=min(16,max(1,len(edges)//4)),offset=0,use_interp_simple=False)
 except RuntimeError:result={'CANCELLED'}
 if 'FINISHED' not in result or not any(f.select for f in bmesh.from_edit_mesh(mesh).faces):
  bpy.ops.mesh.fill();bm=bmesh.from_edit_mesh(mesh)
  for f in bm.faces:
   if f.select:f.material_index=2
  bmesh.update_edit_mesh(mesh);bpy.ops.mesh.subdivide(number_cuts=3,smoothness=0)
 bm=bmesh.from_edit_mesh(mesh);marker=bm.verts.layers.int['Before'];origin=bm.verts.layers.int['Origin'];deform=bm.verts.layers.deform.active
 fresh=[v for v in bm.verts if v[marker]<=0 or v[marker]>len(before) or (v.co-before[v[marker]-1]).length>1e-8];faces=[f for f in bm.faces if f.select]
 sign=1 if sum(v.co.x for f in faces for v in f.verts)>0 else -1
 axis=(Vector(meta['palms'][str(part)])-Vector(meta['centers'][str(part)])).normalized() if part else Vector()
 moving={v for v in fresh if all(f.material_index==2 or f.select for f in v.link_faces)}
 fair(faces,moving,part,fits[sign],terms,axis,source_tree)
 for f in faces:f.material_index=2;f.smooth=True
 for v in fresh:
  v[origin]=0
  if v not in moving:continue
  v[deform].clear()
  if part:
   v[deform][next(g for g,p in ag.items() if p==part)]=1
  else:
   x,y,z=v.co;radius=max(abs(x)/.41,abs(y)/.28);ease=lambda t:np.clip(t,0,1)**3*(np.clip(t,0,1)*(np.clip(t,0,1)*6-15)+10);w=float(ease((z+.24)/.215)*(1-ease((radius-.9)/.35)))
   if w<1:v[deform][body.vertex_groups['Body'].index]=1-w
   if w>0:v[deform][body.vertex_groups['Head'].index]=w
 report.append(dict(hole=k,owner=part,edges=len(edges),vertices=len(fresh),faces=len(faces)));print(report[-1]);bmesh.update_edit_mesh(mesh)
# Match the original torso width while keeping the rebuilt attachment surface smooth.
bm=bmesh.from_edit_mesh(mesh);origin=bm.verts.layers.int['Origin'];deform=bm.verts.layers.deform.active
heights=np.arange(-.43,-.025,.005)
for sign in [-1,1]:
 desired=[]
 for z in heights:
  sample=points[(np.abs(points[:,2]-z)<.008)&(points[:,0]*sign>0)]
  desired.append(float(np.max(sample[:,0]*sign)) if len(sample) else np.nan)
 desired=np.array(desired);valid=np.isfinite(desired);desired=np.interp(heights,heights[valid],desired[valid])
 for _ in range(2):
  current=np.array([v.co[:] for v in bm.verts if v[origin]-1 not in nativehead and not any(v[deform].get(g,0)>.999 for g in armgroups) and v.co.x*sign>0]);radii=[]
  for z in heights:
   sample=current[np.abs(current[:,2]-z)<.008];radii.append(float(np.max(sample[:,0]*sign)) if len(sample) else np.nan)
  radii=np.array(radii);valid=np.isfinite(radii);radii=np.interp(heights,heights[valid],radii[valid]);offset=desired-radii;offset=np.convolve(np.pad(offset,(1,1),mode='edge'),[.2,.6,.2],mode='valid')
  for v in bm.verts:
   if v[origin]>0 or v.co.x*sign<=0 or any(v[deform].get(g,0)>.999 for g in armgroups) or not all(f.material_index==2 for f in v.link_faces):continue
   x,y,z=v.co;fade=lambda t:float(np.clip(t,0,1)**2*(3-2*np.clip(t,0,1)));weight=fade((.145-abs(y))/.06)*fade((z+.425)/.025)*fade((-.02-z)/.025)
   v.co.x+=sign*float(np.interp(z,heights,offset))*weight
bmesh.update_edit_mesh(mesh)
# Match the original torso tangent at the shared boundary, avoiding a visible rim.
bm=bmesh.from_edit_mesh(mesh);origin=bm.verts.layers.int['Origin'];deform=bm.verts.layers.deform.active;nl=bm.loops.layers.float_vector['SavedNormal']
for sign in [-1,1]:
 boundary=[v for v in bm.verts if v.co.x*sign>0 and any(f.material_index==2 for f in v.link_faces) and any(f.material_index==0 for f in v.link_faces) and not any(v[deform].get(g,0)>.999 for g in armgroups) and -.45<v.co.z<.01]
 tree=KDTree(len(boundary));norm=[]
 for j,v in enumerate(boundary):
  tree.insert(Vector((v.co.y,v.co.z,0)),j);samples=[l[nl] for l in v.link_loops if l.face.material_index==0 and l[nl].length>.01];n=sum(samples,Vector()) if samples else v.normal.copy();norm.append(n.normalized())
 tree.balance()
 for v in bm.verts:
  if v[origin]>0 or v.co.x*sign<=0 or any(v[deform].get(g,0)>.999 for g in armgroups) or not all(f.material_index==2 for f in v.link_faces) or not boundary:continue
  co,j,d=tree.find(Vector((v.co.y,v.co.z,0)))
  if d>=.06 or abs(norm[j].x)<.2:continue
  u=boundary[j];n=norm[j];target=u.co.x-(n.y*(v.co.y-u.co.y)+n.z*(v.co.z-u.co.z))/n.x;t=min(d/.06,1);w=1-t*t*(3-2*t);v.co.x+=w*(target-v.co.x)
bmesh.update_edit_mesh(mesh)
bpy.ops.object.mode_set(mode='OBJECT');bm=bmesh.new();bm.from_mesh(mesh);bm.normal_update();nl=bm.loops.layers.float_vector['SavedNormal'];origin=bm.verts.layers.int['Origin'];near={v for f in bm.faces if f.material_index==2 for v in f.verts}
for _ in range(2):near.update(v for a in list(near) for e in a.link_edges for v in e.verts)
for v in near:
 for l in v.link_loops:l[nl]=v.normal
normal=[l[nl][:] for f in bm.faces for l in f.loops];bm.verts.index_update();mapping={str(v[origin]-1):v.index for v in bm.verts if v[origin]>0};remaining=sum(e.is_boundary for e in bm.edges);bm.to_mesh(mesh);bm.free();mesh.update();mesh.normals_split_custom_set(normal)
ids={n:[v.index for v in mesh.vertices if any(g.group==body.vertex_groups[n].index and g.weight>.999 for g in v.groups)] for n in ['Arm.L','Arm.R']};(P/'arm-vertices.json').write_text(json.dumps(ids));(P/'vertex-map.json').write_text(json.dumps(mapping));(P/'topology-repair.json').write_text(json.dumps(dict(patches=report,remainingBoundaryEdges=remaining),indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True);merge_clip(P/'somangi-eat.glb','GridClosedSockets_RigidArms')

