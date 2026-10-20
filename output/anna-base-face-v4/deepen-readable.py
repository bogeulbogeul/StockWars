"""Broaden/deepen the front fold, with rear thickness and cleaned tip protected."""
import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector,kdtree
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-base-face-v5';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'Anna-clean-face.blend'))
o=bpy.data.objects['Anna_BaseBody'];m=o.data;before=np.array([v.co[:] for v in m.vertices]);rawnorm=np.array([v.normal[:] for v in m.vertices])
leafids=set(i for p in m.polygons if p.material_index==1 for i in p.vertices);leaf=np.zeros(len(before),dtype=bool);leaf[list(leafids)]=True
_,inv=np.unique(np.round(before,6),axis=0,return_inverse=True);size=int(inv.max())+1;count=np.bincount(inv);v=np.zeros((size,3));norm=np.zeros_like(v);np.add.at(v,inv,before);np.add.at(norm,inv,rawnorm);v/=count[:,None];norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],1e-9);start=v.copy();leaves=np.bincount(inv,weights=leaf,minlength=size)>0
curve=np.array([[.018,.704],[.075,.754],[.145,.802],[.225,.840],[.305,.867],[.377,.888]]);q=v[:,[0,2]];dist=np.full(size,10.)
for a,b in zip(curve[:-1],curve[1:]):
 d=b-a;t=np.clip(((q-a)*d).sum(1)/(d@d),0,1);dist=np.minimum(dist,np.linalg.norm(q-(a+t[:,None]*d),axis=1))
x,y,z=v.T
def smooth(t):t=np.clip(t,0,1);return t*t*(3-2*t)
fade=smooth((z-.715)/.040)*smooth((.305-x)/.065)
front=leaves&(norm[:,1]<-.25)&(x<.305)&(z>.715)
extra=.021*np.exp(-.5*(dist/.025)**2)*fade*front
# Keep front indentation at least 0.01 units away from the rear skin.
rear=np.where(leaves&(norm[:,1]>.25))[0];tree=kdtree.KDTree(len(rear))
for k,i in enumerate(rear):tree.insert((v[i,0],v[i,2],0),int(i))
tree.balance();limited=0
for i in np.where(extra>1e-7)[0]:
 co,j,d=tree.find((v[i,0],v[i,2],0))
 if d<.025:
  safe=max(0,v[j,1]-v[i,1]-.010)
  if extra[i]>safe:extra[i]=safe;limited+=1
v[:,1]+=extra
after=before+(v-start)[inv];changed=(extra[inv]>1e-7)&leaf
after[~changed]=before[~changed]
for point,co in zip(m.vertices,after):point.co=co
m.update()
# Continuous normals across duplicated UV seams keep the broad groove clean.
tri=np.array([p.vertices[:] for p in m.polygons]);cross=np.cross(after[tri[:,1]]-after[tri[:,0]],after[tri[:,2]]-after[tri[:,0]]);sums=np.zeros((size,3))
for k in range(3):np.add.at(sums,inv[tri[:,k]],cross)
sums/=np.maximum(np.linalg.norm(sums,axis=1)[:,None],1e-12);normals=rawnorm.copy();normals[leaf]=sums[inv[leaf]];m.normals_split_custom_set_from_vertices(normals.tolist())
protected=~leaf|(before[:,0]>=.305)|(rawnorm[:,1]>=-.25)
assert np.array_equal(before[protected],after[protected])
s=bpy.context.scene;s.cycles.samples=32;cam=s.camera
for name,delta,target,scale,res in [('sprout-front',(0,-4,.5),(.19,0,.80),.65,800),('front',(0,-4,0),(0,0,0),2.28,800),('distant',(0,-4,0),(0,0,0),2.28,320),('sprout-back',(0,4,.5),(.19,0,.80),.65,800)]:
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.resolution_x=res;s.render.resolution_y=res;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-clean-face.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-clean-face.glb'),use_selection=True,export_format='GLB',export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps({'extra_depth_max':float(extra.max()),'groove_width_sigma':.025,'changed_vertices':int(changed.sum()),'protected_rear_tip_body_positions_identical':True,'thickness_limited_vertices':limited,'topology_unchanged':True},indent=2));print('READABLE_GROOVE_COMPLETE')
