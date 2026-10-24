import bpy,bmesh,json,sys,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];bpy.context.scene.frame_set(136);mesh=body.data
normals=[n.vector.copy() for n in mesh.corner_normals];bm=bmesh.new();bm.from_mesh(mesh);deform=bm.verts.layers.deform.active;layer=bm.loops.layers.float_vector.new('PreservedNormal')
for f,source in zip(bm.faces,mesh.polygons):
 for l,i in zip(f.loops,source.loop_indices):l[layer]=normals[i]
arm_groups={body.vertex_groups['Arm.L'].index:1,body.vertex_groups['Arm.R'].index:2}
def owner(v):
 for g,k in arm_groups.items():
  if v[deform].get(g,0)>.999:return k
 return 0
initial=sum(e.is_boundary for e in bm.edges);report=[]
for tolerance in [0.000003,0.00003,0.0002,0.001]:
 boundary=[e for e in bm.edges if e.is_boundary];vertices=list({v for e in boundary for v in e.verts});trees={};lists={}
 for part in [0,1,2]:
  candidates=[v for v in vertices if owner(v)==part];lists[part]=candidates;t=KDTree(len(candidates))
  for i,v in enumerate(candidates):t.insert(v.co,i)
  t.balance();trees[part]=t
 target={};split_count=0
 # Split original outer edges first, leaving every original outer vertex fixed.
 boundary.sort(key=lambda e:e.link_faces[0].material_index)
 used=set()
 for edge in boundary:
  if not edge.is_valid:continue
  a,b=edge.verts;part=owner(a)
  if owner(b)!=part:continue
  A=a.co.copy();B=b.co.copy();axis=B-A;length=axis.length
  if length<1e-7:continue
  options=[]
  for point,j,d in trees[part].find_range((A+B)/2,length/2+tolerance):
   v=lists[part][j]
   if v in [a,b] or v in used or not v.is_valid:continue
   t=(point-A).dot(axis)/(length*length)
   if not 1e-5<t<1-1e-5:continue
   distance=(point-(A+axis*t)).length
   if distance<=tolerance:options.append((t,v))
  previous=0.;remaining=edge;last=a
  for t,v in sorted(options,key=lambda p:p[0]):
   if t-previous<1e-5:continue
   newedge,new=bmesh.utils.edge_split(remaining,last,(t-previous)/(1-previous));new.co=A+axis*t
   # The existing outer vertex takes precedence over cap geometry.
   native=any(f.material_index==0 for f in v.link_faces)
   if native:
    target[new]=v
   else:
    target[v]=new;used.add(v)
   split_count+=1;previous=t;last=new
   remaining=next((e for e in new.link_edges if b in e.verts),None)
   if remaining is None:break
 if target:bmesh.ops.weld_verts(bm,targetmap=target)
 # Match coincident cap vertices to outer vertices without moving outer geometry.
 boundary=[e for e in bm.edges if e.is_boundary];vs=list({v for e in boundary for v in e.verts});target={}
 for part in [0,1,2]:
  native=[v for v in vs if owner(v)==part and any(f.material_index==0 for f in v.link_faces)];tree=KDTree(len(native))
  for i,v in enumerate(native):tree.insert(v.co,i)
  tree.balance()
  for v in vs:
   if owner(v)!=part or v in native or not native:continue
   co,i,d=tree.find(v.co)
   if d<=tolerance:target[v]=native[i]
 if target:bmesh.ops.weld_verts(bm,targetmap=target)
 report.append(dict(tolerance=tolerance,splits=split_count,remainingBoundary=sum(e.is_boundary for e in bm.edges)));print(report[-1])
# Consistent smooth normals only around the stitched attachment surfaces.
bm.normal_update()
near={v for e in bm.edges if len(e.link_faces)==2 and len({f.material_index for f in e.link_faces})>1 and any(f.material_index==2 for f in e.link_faces) for v in e.verts}
for _ in range(2):near.update(v for a in list(near) for e in a.link_edges for v in e.verts)
for v in near:
 for l in v.link_loops:l[layer]=v.normal
newnormals=[l[layer][:] for f in bm.faces for l in f.loops];bm.to_mesh(mesh);bm.free();mesh.update();mesh.normals_split_custom_set(newnormals)
ids={name:[v.index for v in mesh.vertices if any(g.group==body.vertex_groups[name].index and g.weight>.999 for g in v.groups)] for name in ['Arm.L','Arm.R']}
(P/'arm-vertices.json').write_text(json.dumps(ids));(P/'topology-repair.json').write_text(json.dumps(dict(initialBoundaryEdges=initial,passes=report),indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True);merge_clip(P/'somangi-eat.glb','StitchedShoulder_RigidArms')

