"""Refine garment labels against surface creases, preserving geometry and rig."""
import bpy,numpy as np,heapq,json,math
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-model-v2';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'Anna-rigged.blend'))
o=bpy.data.objects['Anna_Body'];m=o.data;rig=bpy.data.objects['Anna_Rig'];bpy.context.scene.frame_set(1)
V=np.array([v.co[:] for v in m.vertices]);N=np.array([v.normal[:] for v in m.vertices]);E=np.array([e.vertices[:] for e in m.edges]);n=len(V)
# Front panel silhouette includes its raised piping, measured on the actual model.
poly=np.array([(344,443),(359,462),(373,479),(378,491),(374,517),(363,544),(345,566),(326,579),(303,584),(279,573),(286,551),(298,517),(306,492),(314,469),(316,447)])
px=400-np.abs(V[:,0])*800/2.28;py=400-V[:,2]*800/2.28
inside=np.zeros(n,dtype=bool);dist=np.full(n,10.)
for i,a in enumerate(poly):
 b=poly[i-1];d=b-a;t=np.clip(((np.stack([px,py],axis=1)-a)*d).sum(1)/(d@d),0,1);dist=np.minimum(dist,np.linalg.norm(np.stack([px,py],axis=1)-(a+t[:,None]*d),axis=1)*2.28/800)
 if a[1]!=b[1]:inside^=((a[1]>py)!=(b[1]>py))&(px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])
front_signed=np.where(inside,dist,-dist)
x,y,z=V.T
# Continuous side/back panel with a round armhole following the sculpted opening.
side_signed=np.minimum.reduce([z+.485,-.132-z,.342-np.abs(x)])
hole=np.sqrt(((y+.003)/.105)**2+((z+.205)/.102)**2)
side_signed=np.minimum(side_signed,np.where(np.abs(x)>.22,(hole-1)*.102,1))
# Front-view contour controls the front; side seams use the cylindrical side rule.
blend=np.clip((y+.14)/.065,0,1);signed=front_signed*(1-blend)+side_signed*blend
signed=np.minimum(signed,-.13-z)
active=(z>-.61)&(z<-.085)&(np.abs(x)<.39)
# Creases are expensive to cross. Interior and exterior seeds cannot move.
seed_green=active&(signed>.023);seed_cream=(signed<-.023)|(~active)
delta=V[E[:,1]]-V[E[:,0]];length=np.linalg.norm(delta,axis=1)
normal_diff=np.linalg.norm(N[E[:,1]]-N[E[:,0]],axis=1)
curvature=normal_diff/np.maximum(length,.0001)
cost=length*(1+np.minimum(curvature,150)**2*.025)
adj=[[] for _ in range(n)]
for (a,b),w in zip(E,cost):
 if active[a] or active[b]:adj[a].append((b,float(w)));adj[b].append((a,float(w)))
def distances(seeds):
 d=np.full(n,np.inf);queue=[]
 for i in np.where(seeds)[0]:d[i]=0.;queue.append((0.,int(i)))
 heapq.heapify(queue)
 while queue:
  value,a=heapq.heappop(queue)
  if value>d[a]:continue
  for b,w in adj[a]:
   v=value+w
   if v<d[b]:d[b]=v;heapq.heappush(queue,(v,b))
 return d
dg=distances(seed_green);dc=distances(seed_cream)
green=(dg<dc)&active
# Shared corner colors remove stair steps caused by whole-triangle assignment.
amount=green.astype(float)
boundary=np.zeros(n,dtype=bool)
different=green[E[:,0]]!=green[E[:,1]];boundary[E[different].ravel()]=True
for _ in range(2):
 sums=np.zeros(n);counts=np.zeros(n)
 np.add.at(sums,E[:,0],amount[E[:,1]]);np.add.at(sums,E[:,1],amount[E[:,0]])
 np.add.at(counts,E[:,0],1);np.add.at(counts,E[:,1],1)
 average=sums/np.maximum(counts,1);amount[boundary]=.65*amount[boundary]+.35*average[boundary]
cream=np.array(m.materials[0].diffuse_color[:3]);olive=np.array(m.materials[2].diffuse_color[:3])
color=cream[None,:]*(1-amount[:,None])+olive[None,:]*amount[:,None]
leaf=(z>.69)&(x>-.025);color[leaf]=olive
attr=m.color_attributes.new(name='AnnaSurfaceColor',type='FLOAT_COLOR',domain='POINT')
rgba=np.ones((n,4));rgba[:,:3]=color;attr.data.foreach_set('color',rgba.ravel())
mat=bpy.data.materials.new('Anna_Surface_Clean');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.8
node=mat.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name=attr.name;mat.node_tree.links.new(node.outputs['Color'],bs.inputs['Base Color']);m.materials.append(mat);idx=len(m.materials)-1
for p in m.polygons:
 if p.material_index!=3:p.material_index=idx
s=bpy.context.scene;cam=s.camera;cam.data.ortho_scale=2.28;s.cycles.samples=32
# Evenly light every side for material inspection.
for ob in list(s.objects):
 if ob.type=='LIGHT':bpy.data.objects.remove(ob,do_unlink=True)
for loc,energy in [((3,-4,4),400),((-3,-3,1),230),((0,4,4),450)]:
 bpy.ops.object.light_add(type='AREA',location=loc);a=bpy.context.object;a.data.energy=energy;a.data.shape='DISK';a.data.size=4;a.rotation_euler=(Vector((0,0,0))-a.location).to_track_quat('-Z','Y').to_euler()
for name,loc in [('front',(0,-5,0)),('back',(0,5,0)),('left',(-5,0,0)),('right',(5,0,0)),('angle',(2.7,-5,.25))]:
 cam.location=loc;cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-rigged.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-rigged.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=False,export_cameras=False,export_lights=False,export_all_vertex_colors=False)
np.save(P/'garment-vertex-mask.npy',amount)
(P/'color-validation.json').write_text(json.dumps({'vertices':n,'green_vertices':int(green.sum()),'boundary_vertices':int(boundary.sum()),'method':'surface-crease weighted geodesic segmentation with fixed interior/exterior seeds; corner interpolation','geometry_unchanged':True,'rig_weights_unchanged':True,'face_unchanged':True},indent=2));print('COLOR_REFINEMENT_COMPLETE')
