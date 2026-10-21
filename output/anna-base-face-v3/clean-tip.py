"""Fair both sides of the leaf tip together, removing a pinched/intersecting rim."""
import bpy,numpy as np,json,hashlib
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-base-face-v4';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC.parent/'anna-base-face-v2/Anna-clean-face.blend'))
original=np.array([v.co[:] for v in bpy.data.objects['Anna_BaseBody'].data.vertices])
bpy.ops.wm.open_mainfile(filepath=str(SRC/'Anna-clean-face.blend'))
o=bpy.data.objects['Anna_BaseBody'];m=o.data;before=np.array([v.co[:] for v in m.vertices])
leafids=set(i for p in m.polygons if p.material_index==1 for i in p.vertices);leaf=np.zeros(len(before),dtype=bool);leaf[list(leafids)]=True
_,inv=np.unique(np.round(original,6),axis=0,return_inverse=True);size=int(inv.max())+1;count=np.bincount(inv)
v=np.zeros((size,3));ref=np.zeros_like(v);np.add.at(v,inv,before);np.add.at(ref,inv,original);v/=count[:,None];ref/=count[:,None];start=v.copy()
u=np.clip((ref[:,0]-.305)/.065,0,1);restore=u*u*(3-2*u);v=v*(1-restore[:,None])+ref*restore[:,None]
active=(np.bincount(inv,weights=leaf,minlength=size)>0)&(ref[:,0]>.305)
weight=np.clip((ref[:,0]-.305)/.05,0,1);weight=weight*weight*(3-2*weight)*active
edges=np.unique(np.sort(inv[np.array([e.vertices[:] for e in m.edges])],axis=1),axis=0);edges=edges[edges[:,0]!=edges[:,1]];degree=np.zeros(size);np.add.at(degree,edges[:,0],1);np.add.at(degree,edges[:,1],1)
# A paired fairing pass reduces edge noise without flattening the tip to a knife.
for _ in range(28):
 for rate in [.38,-.39]:
  sums=np.zeros_like(v);np.add.at(sums,edges[:,0],v[edges[:,1]]);np.add.at(sums,edges[:,1],v[edges[:,0]]);v+=(sums/np.maximum(degree[:,None],1)-v)*(rate*weight[:,None])
for _ in range(60):
 sums=np.zeros_like(v);np.add.at(sums,edges[:,0],v[edges[:,1]]);np.add.at(sums,edges[:,1],v[edges[:,0]]);v+=(sums/np.maximum(degree[:,None],1)-v)*(.32*weight[:,None])
allowed=leaf&(original[:,0]>.305)
after=before.copy();after[allowed]+=(v-start)[inv][allowed]
for point,co in zip(m.vertices,after):point.co=co
m.update()
# Share smooth shading across the duplicate UV seam vertices on the sprout.
tri=np.array([p.vertices[:] for p in m.polygons]);cross=np.cross(after[tri[:,1]]-after[tri[:,0]],after[tri[:,2]]-after[tri[:,0]]);sums=np.zeros((size,3))
for corner in range(3):np.add.at(sums,inv[tri[:,corner]],cross)
sums/=np.maximum(np.linalg.norm(sums,axis=1)[:,None],1e-12)
smooth=np.array([p.normal[:] for p in m.vertices]);smooth[leaf]=sums[inv[leaf]];m.normals_split_custom_set_from_vertices(smooth.tolist())
assert np.array_equal(before[~allowed],after[~allowed])
report={'tip_vertices_changed':int((np.linalg.norm(after-before,axis=1)>1e-7).sum()),'outside_tip_positions_identical':True,'deep_central_groove_unchanged':bool(np.array_equal(before[original[:,0]<=.305],after[original[:,0]<=.305])),'maximum_tip_adjustment':float(np.linalg.norm(after-before,axis=1).max()),'front_and_back_faired_together':True,'topology_unchanged':True}
s=bpy.context.scene;s.cycles.samples=40;cam=s.camera
views=[('tip-front',(0,-4,.15),(.365,0,.895),.21),('tip-back',(0,4,.15),(.365,0,.895),.21),('sprout-front',(0,-4,.5),(.19,0,.80),.65),('sprout-back',(0,4,.5),(.19,0,.80),.65)]
for name,delta,target,scale in views:
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-clean-face.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-clean-face.glb'),use_selection=True,export_format='GLB',export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps(report,indent=2));print('TIP_CLEANED',report)
