"""Replace accumulated front dents with one smooth continuous sculpted channel."""
import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-base-face-v6';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'Anna-clean-face.blend'))
o=bpy.data.objects['Anna_BaseBody'];m=o.data;before=np.array([v.co[:] for v in m.vertices]);rawnorm=np.array([v.normal[:] for v in m.vertices]);leafids=set(i for p in m.polygons if p.material_index==1 for i in p.vertices);rawleaf=np.zeros(len(before),dtype=bool);rawleaf[list(leafids)]=True
_,inv=np.unique(np.round(before,6),axis=0,return_inverse=True);count=np.bincount(inv);n=len(count);v=np.zeros((n,3));norm=np.zeros_like(v);np.add.at(v,inv,before);np.add.at(norm,inv,rawnorm);v/=count[:,None];norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],1e-12);start=v.copy();leaf=np.bincount(inv,weights=rawleaf,minlength=n)>0
x,y,z=v.T
def smooth(t):t=np.clip(t,0,1);return t*t*(3-2*t)
# Establish the broad leaf curvature from the undented flanks, not from the old trough.
center=.704+.94*x-.98*x*x
distance=z-center
front=leaf&(norm[:,1]<-.18)&(z>.714)&(x<.315)
flank=front&(abs(distance)>.034)&(abs(distance)<.115)&(x>.025)
X=(x-.17)/.17;Z=(z-.82)/.15
D=np.column_stack([np.ones(n),X,Z,X*X,X*Z,Z*Z])
coef=np.linalg.lstsq(D[flank],y[flank],rcond=None)[0];surface=D@coef
# A single analytic channel, with a smooth longitudinal fade and broad soft walls.
along=smooth((x-.025)/.055)*smooth((.315-x)/.080)
groove=.023*np.exp(-.5*(distance/.020)**2)*along
target=surface+groove
blend=front*smooth((.315-x)/.045)*smooth((z-.714)/.045)*np.clip((-norm[:,1]-.18)/.45,0,1)
v[:,1]+=np.clip(target-v[:,1],-.045,.045)*blend
after=before.copy();allowed=rawleaf&(before[:,2]>.714)&(before[:,0]<.315)&(rawnorm[:,1]<-.18);after[allowed]+=(v-start)[inv][allowed]
for p,co in zip(m.vertices,after):p.co=co
m.update()
tri=np.array([p.vertices[:] for p in m.polygons]);cross=np.cross(after[tri[:,1]]-after[tri[:,0]],after[tri[:,2]]-after[tri[:,0]]);sums=np.zeros((n,3))
for k in range(3):np.add.at(sums,inv[tri[:,k]],cross)
sums/=np.maximum(np.linalg.norm(sums,axis=1)[:,None],1e-12);normals=rawnorm.copy();normals[rawleaf]=sums[inv[rawleaf]];m.normals_split_custom_set_from_vertices(normals.tolist())
assert np.array_equal(before[~allowed],after[~allowed])
s=bpy.context.scene;s.cycles.samples=40;cam=s.camera
for name,delta,target,scale,res in [('sprout-front',(0,-4,.5),(.19,0,.80),.65,800),('sprout-back',(0,4,.5),(.19,0,.80),.65,800),('distant',(0,-4,0),(0,0,0),2.28,320)]:
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.resolution_x=res;s.render.resolution_y=res;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-clean-face.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-clean-face.glb'),use_selection=True,export_format='GLB',export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps({'method':'smooth quadratic leaf surface plus one analytic rounded groove','groove_depth':.023,'groove_width':.020,'outside_front_patch_unchanged':True,'topology_unchanged':True,'source_preserved':True},indent=2));print('CLEAN_SINGLE_GROOVE_COMPLETE')
