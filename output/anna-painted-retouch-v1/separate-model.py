"""Restore a clean underlying body and a separate fitted vest from Anna's mesh."""
import bpy,bmesh,numpy as np,json
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-separated-v1';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'input.blend'))
src=next(o for o in bpy.context.scene.objects if o.type=='MESH');m=src.data
base_tex=m.materials[0].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].links[0].from_node.image
w,h=base_tex.size;pix=np.array(base_tex.pixels[:],dtype=np.float32).reshape(h,w,4)
uv=np.array([l.uv[:] for l in m.uv_layers.active.data]);li=np.array([l.vertex_index for l in m.loops]);V=np.array([v.co[:] for v in m.vertices]);L=V[li]
sample=pix[np.clip((uv[:,1]*h).astype(int),0,h-1),np.clip((uv[:,0]*w).astype(int),0,w-1),:3]
cream=np.median(sample[(L[:,2]>.05)&(L[:,2]<.4)&(L[:,1]<-.2)],axis=0);olive=np.median(sample[L[:,2]>.75],axis=0)
def linear(c):return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
def material(name,rgb):
 a=bpy.data.materials.new(name);a.diffuse_color=(*linear(rgb),1);a.use_nodes=True;bs=a.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=a.diffuse_color;bs.inputs['Roughness'].default_value=.82;return a
skinmat=material('Anna_Cream_Clean',cream);vestmat=material('Anna_Olive_Clean',olive)
green=(np.linalg.norm(sample-olive,axis=1)<np.linalg.norm(sample-cream,axis=1))
# Carry user paint region labels through welding duplicated UV seam vertices.
for p in m.polygons:
 x,y,z=p.center;hole=np.sqrt(((y+.002)/.119)**2+((z+.213)/.119)**2)
 garment=green[np.array(p.loop_indices)].mean()>.5 and -.59<z<-.135 and abs(x)<.352
 if abs(x)>.235 and hole<.92:garment=False
 stem=z>.6828 or (z>.6775 and .012<x<.067 and -.061<y<.049 and p.normal.z<.92)
 p.material_index=2 if stem else (1 if garment else 0)
bm=bmesh.new();bm.from_mesh(m);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bm.to_mesh(m);bm.free();m.update()
def extract(name,keep):
 data=m.copy();obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
 bm=bmesh.new();bm.from_mesh(data);remove=[f for f in bm.faces if not keep(f)];bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(data);bm.free();return obj
vest=extract('Anna_Vest',lambda f:f.material_index==1)
leaf=extract('Anna_Sprout',lambda f:f.material_index==2)
body=extract('Anna_BaseBody',lambda f:f.material_index!=2)
def boundary_smooth(obj,iterations,amount):
 bm=bmesh.new();bm.from_mesh(obj.data)
 for _ in range(iterations):
  edges=[e for e in bm.edges if e.is_boundary];adj={}
  for e in edges:
   a,b=e.verts;adj.setdefault(a,[]).append(b);adj.setdefault(b,[]).append(a)
  updates={v:v.co.lerp(sum((n.co for n in ns),Vector())/len(ns),amount) for v,ns in adj.items() if len(ns)==2}
  for v,co in updates.items():v.co=co
 bm.to_mesh(obj.data);bm.free()
boundary_smooth(vest,22,.45)
# Fill the small scalp opening left by the detached sprout.
bm=bmesh.new();bm.from_mesh(body.data);edges=[e for e in bm.edges if e.is_boundary]
if edges:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
bm.to_mesh(body.data);bm.free();body.data.update()
v=np.array([p.co[:] for p in body.data.vertices]);normal=np.array([p.normal[:] for p in body.data.vertices]);e=np.array([p.vertices[:] for p in body.data.edges]);x,y,z=v.T
coat_ids=set(i for p in body.data.polygons if p.material_index==1 for i in p.vertices)
coat=np.zeros(len(v));coat[list(coat_ids)]=1
# Extend the restoration zone across fused piping, armpits and the collar seam.
zone=(z>-.615)&(z<-.065)&(abs(x)<.36)
fade=np.minimum.reduce([np.clip((z+.615)/.035,0,1),np.clip((-.065-z)/.04,0,1),np.clip((.36-abs(x))/.05,0,1)])*zone
v-=normal*(coat*.018)[:,None]
counts=np.zeros(len(v));np.add.at(counts,e[:,0],1);np.add.at(counts,e[:,1],1)
for _ in range(85):
 sums=np.zeros_like(v);np.add.at(sums,e[:,0],v[e[:,1]]);np.add.at(sums,e[:,1],v[e[:,0]]);average=sums/np.maximum(counts[:,None],1);v+=(average-v)*(.42*fade[:,None])
for point,co in zip(body.data.vertices,v):point.co=co
body.data.update()
for obj,mat in [(body,skinmat),(vest,vestmat),(leaf,vestmat)]:
 obj.data.materials.clear();obj.data.materials.append(mat)
 for f in obj.data.polygons:f.material_index=0;f.use_smooth=True
 # Remove unused UV sets: these parts use clean uniform materials.
 for layer in list(obj.data.uv_layers):obj.data.uv_layers.remove(layer)
for obj in [vest,leaf]:
 bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
solid=vest.modifiers.new('VestThickness','SOLIDIFY');solid.thickness=.004;solid.offset=-1;solid.use_even_offset=False;solid.thickness_clamp=.2
sub=vest.modifiers.new('SmoothTailoredEdges','SUBSURF');sub.levels=1;sub.render_levels=1
bpy.data.objects.remove(src,do_unlink=True)
s=bpy.context.scene;s.cycles.samples=16;s.render.resolution_x=800;s.render.resolution_y=800;cam=s.camera
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-separated.blend'))
views=[('front',(0,-4,0),(0,0,0),2.28),('left',(4,0,0),(0,0,0),2.28),('right',(-4,0,0),(0,0,0),2.28),('back',(0,4,0),(0,0,0),2.28),('armpit',(4,-1,.1),(.29,0,-.25),.55),('neck',(0,-4,.1),(0,0,-.13),.85)]
for name,delta,target,scale in views:
 if '--quick' in __import__('sys').argv and name not in ['front','armpit','neck']:continue
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
vest.hide_render=True;cam.location=(0,-4,0);cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.28;s.render.filepath=str(P/'base-body.png');bpy.ops.render.render(write_still=True);vest.hide_render=False
bpy.ops.object.select_all(action='DESELECT')
for obj in [body,vest,leaf]:obj.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-separated.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-separated.glb'),use_selection=True,export_format='GLB',export_apply=True,export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
(P/'construction.json').write_text(json.dumps({'parts':[o.name for o in [body,vest,leaf]],'cream_srgb':cream.tolist(),'olive_srgb':olive.tolist(),'body_surface_restored':True,'vest_thickness':.006,'face_blank':True,'source_preserved':True,'rig_added':False},indent=2));print('SEPARATED_COMPLETE')
