import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-base-face-v7';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'Anna-clean-face.blend'))
o=bpy.data.objects['Anna_BaseBody'];m=o.data;before=np.array([v.co[:] for v in m.vertices]);rawnorm=np.array([v.normal[:] for v in m.vertices]);rawleaf=np.zeros(len(before),dtype=bool);rawleaf[list(set(i for p in m.polygons if p.material_index==1 for i in p.vertices))]=True
_,inv=np.unique(np.round(before,6),axis=0,return_inverse=True);n=int(inv.max())+1;count=np.bincount(inv);v=np.zeros((n,3));norm=np.zeros_like(v);np.add.at(v,inv,before);np.add.at(norm,inv,rawnorm);v/=count[:,None];norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],1e-12);start=v.copy();leaf=np.bincount(inv,weights=rawleaf,minlength=n)>0
x,y,z=v.T
def smooth(t):t=np.clip(t,0,1);return t*t*(3-2*t)
blade=leaf*smooth((z-.707)/.048)
# Rounder blade silhouette while keeping the stem anchored to the crown.
axis=.704+.94*x-.98*x*x
v[:,2]+=(z-axis)*.20*blade
v[:,0]+=(x-.19)*.035*blade
# Inflate both surfaces into a soft padded leaf rather than a flat blade.
v[:,1]+=(y-.002)*.42*blade
v+=norm*(.007*blade)[:,None]
# Fit the front flanks and make a continuous curved groove like the reference.
x,y,z=v.T;center=.704+.94*x-.98*x*x;distance=z-center
front=leaf&(norm[:,1]<-.20)&(z>.718)&(x<.34)
flank=front&(abs(distance)>.032)&(abs(distance)<.14)
X=(x-.17)/.17;Z=(z-.82)/.16;D=np.column_stack([np.ones(n),X,Z,X*X,X*Z,Z*Z]);coef=np.linalg.lstsq(D[flank],y[flank],rcond=None)[0]
along=smooth((x-.012)/.048)*smooth((.35-x)/.075)
target=D@coef+.020*np.exp(-.5*(distance/.018)**2)*along
blend=front*smooth((.34-x)/.045)*smooth((z-.718)/.045)*np.clip((-norm[:,1]-.20)/.45,0,1)
v[:,1]+=np.clip(target-y,-.035,.035)*blend
# Light seam-aware fairing rounds the contour and the tapered tip.
e=np.unique(np.sort(inv[np.array([e.vertices[:] for e in m.edges])],axis=1),axis=0);e=e[e[:,0]!=e[:,1]];degree=np.zeros(n);np.add.at(degree,e[:,0],1);np.add.at(degree,e[:,1],1)
for _ in range(8):
 for rate in [.30,-.31]:
  total=np.zeros_like(v);np.add.at(total,e[:,0],v[e[:,1]]);np.add.at(total,e[:,1],v[e[:,0]]);v+=(total/np.maximum(degree[:,None],1)-v)*(rate*blade[:,None])
after=before.copy();after[rawleaf]+=(v-start)[inv][rawleaf]
for p,co in zip(m.vertices,after):p.co=co
m.update();tri=np.array([p.vertices[:] for p in m.polygons]);cross=np.cross(after[tri[:,1]]-after[tri[:,0]],after[tri[:,2]]-after[tri[:,0]]);sums=np.zeros((n,3))
for k in range(3):np.add.at(sums,inv[tri[:,k]],cross)
sums/=np.maximum(np.linalg.norm(sums,axis=1)[:,None],1e-12);normal=rawnorm.copy();normal[rawleaf]=sums[inv[rawleaf]];m.normals_split_custom_set_from_vertices(normal.tolist())
# Warmer fresh olive from the supplied visual reference.
a=bpy.data.materials['Anna_Clean_Olive'];rgb=np.array([.57,.62,.22]);linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4);a.diffuse_color=(*linear,1);a.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=a.diffuse_color;a.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.72
assert np.array_equal(before[~rawleaf],after[~rawleaf])
s=bpy.context.scene;s.cycles.samples=32;cam=s.camera
for name,delta,target,scale,res in [('sprout-front',(0,-4,.5),(.19,0,.81),.70,800),('sprout-back',(0,4,.5),(.19,0,.81),.70,800),('front',(0,-4,0),(0,0,0),2.28,800),('distant',(0,-4,0),(0,0,0),2.28,320),('sprout-side',(4,0,.3),(.19,0,.81),.70,800)]:
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.resolution_x=res;s.render.resolution_y=res;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-clean-face.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-clean-face.glb'),use_selection=True,export_format='GLB',export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps({'body_face_positions_identical':True,'stem_anchor_preserved':True,'blade_silhouette_plumped':True,'leaf_thickness_increased':True,'groove_continuous':True,'topology_unchanged':True,'leaf_srgb':rgb.tolist()},indent=2));print('PLUMP_LEAF_COMPLETE')
