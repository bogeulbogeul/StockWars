import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-base-face-v3';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'Anna-clean-face.blend'))
o=bpy.data.objects['Anna_BaseBody'];m=o.data;before=np.array([p.co[:] for p in m.vertices]);rawnorm=np.array([p.normal[:] for p in m.vertices])
# Deform coincident UV-seam vertices together without changing the original topology.
_,inverse=np.unique(np.round(before,6),axis=0,return_inverse=True);size=int(inverse.max())+1;counts0=np.bincount(inverse);v=np.zeros((size,3));norm=np.zeros_like(v);np.add.at(v,inverse,before);np.add.at(norm,inverse,rawnorm);v/=counts0[:,None];norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],1e-8);start=v.copy();x,y,z=v.T
leafids=set(i for p in m.polygons if p.material_index==1 for i in p.vertices);rawleaf=np.zeros(len(before),dtype=bool);rawleaf[list(leafids)]=True;leaf=np.bincount(inverse,weights=rawleaf,minlength=size)>0
# Trace the central fold from the short stem towards the tapered tip.
curve=np.array([[.018,.704],[.075,.754],[.145,.802],[.225,.840],[.305,.867],[.377,.888]])
q=v[:,[0,2]];distance=np.full(len(v),10.)
for a,b in zip(curve[:-1],curve[1:]):
 d=b-a;t=np.clip(((q-a)*d).sum(1)/(d@d),0,1);distance=np.minimum(distance,np.linalg.norm(q-(a+t[:,None]*d),axis=1))
fade=np.clip((z-.710)/.035,0,1)*np.clip((.402-x)/.055,0,1)
front=leaf&(norm[:,1]<-.2)&(z>.705)
depth=.012*np.exp(-.5*(distance/.017)**2)*fade*front
v[:,1]+=depth
# Smooth only the rear surface while holding the outline and stem fixed.
edges=np.unique(np.sort(inverse[np.array([e.vertices[:] for e in m.edges])],axis=1),axis=0);edges=edges[edges[:,0]!=edges[:,1]];rear=leaf&(norm[:,1]>.35)&(z>.716)
weight=np.clip((norm[:,1]-.35)/.45,0,1)*rear
counts=np.zeros(len(v));np.add.at(counts,edges[:,0],1);np.add.at(counts,edges[:,1],1)
for _ in range(55):
 sums=np.zeros_like(v);np.add.at(sums,edges[:,0],v[edges[:,1]]);np.add.at(sums,edges[:,1],v[edges[:,0]]);average=sums/np.maximum(counts[:,None],1);v+=(average-v)*(.30*weight[:,None])
# Replace residual rear vein relief with a single smooth low-order curved surface.
design=np.column_stack([np.ones(len(v)),v[:,0],v[:,2],v[:,0]**2,v[:,0]*v[:,2],v[:,2]**2]);coef=np.linalg.lstsq(design[rear],v[rear,1],rcond=None)[0];fit=design@coef
v[:,1]+=np.clip(fit-v[:,1],-.018,.018)*weight
result=before+(v-start)[inverse]
for p,co in zip(m.vertices,result):p.co=co
m.update()
# Use clean material on both leaf sides so the rear cannot inherit vein textures.
a=bpy.data.materials['Anna_Clean_Olive'];bs=a.node_tree.nodes.get('Principled BSDF')
for key in ['Normal','Base Color']:
 for link in list(bs.inputs[key].links):a.node_tree.links.remove(link)
bs.inputs['Base Color'].default_value=a.diffuse_color;bs.inputs['Roughness'].default_value=.76
bpy.context.view_layer.objects.active=o;o.select_set(True)
if m.has_custom_normals:bpy.ops.mesh.customdata_custom_splitnormals_clear()
assert np.array_equal(before[~rawleaf],result[~rawleaf])
s=bpy.context.scene;s.cycles.samples=32;cam=s.camera
for name,delta,target,scale in [('sprout-front',(0,-4,.5),(.19,0,.80),.65),('sprout-back',(0,4,.5),(.19,0,.80),.65),('front',(0,-4,0),(0,0,0),2.28)]:
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-clean-face.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-clean-face.glb'),use_selection=True,export_format='GLB',export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps({'front_maximum_extra_depth':float(depth.max()),'front_changed_vertices':int((depth>1e-6).sum()),'rear_smoothed_vertices':int(rear.sum()),'body_face_positions_identical':True,'rear_normal_texture_removed':True,'source_preserved':True},indent=2));print('SPROUT_DEEPENED')
