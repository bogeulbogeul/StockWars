import bpy,bmesh,math,numpy as np,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-sit-v1/Anna-sit.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Somangi_Rig'];torso=bpy.data.objects['Eating_Torso'];old=bpy.data.objects['Anna_Vest'];bpy.data.objects.remove(old,do_unlink=True)
rig.data.pose_position='REST'
rings=np.array([v.co[:] for v in torso.data.vertices]).reshape(97,64,3);zs=rings[:,0,2];rx=np.max(abs(rings[:,:,0]),axis=1);ry=np.max(abs(rings[:,:,1]+.01),axis=1)
def point(theta,z,offset=.024):
 x=float(np.interp(z,zs,rx))+offset;y=float(np.interp(z,zs,ry))+offset
 return (x*math.cos(theta),-.01+y*math.sin(theta),z)
U=160;V=90;verts=[];faces=[]
for j in range(V+1):
 t=j/V
 for i in range(U+1):
  u=i/U;alpha=.25+.13*(1-t)+.10*math.sin(t*math.pi);theta=-math.pi/2+alpha+u*(2*math.pi-2*alpha)
  bottom=-.40-.10*(math.exp(-((u-.065)/.08)**2)+math.exp(-((u-.935)/.08)**2))+.045*(math.exp(-(u/.02)**2)+math.exp(-((1-u)/.02)**2))
  z=bottom*(1-t)+.12*t;verts.append(point(theta,z))
for j in range(V):
 for i in range(U):
  ids=[j*(U+1)+i,j*(U+1)+i+1,(j+1)*(U+1)+i+1,(j+1)*(U+1)+i]
  q=sum((Vector(verts[k]) for k in ids),Vector())/4;theta=math.atan2(q.y+.01,q.x);side=min(abs(theta),abs(abs(theta)-math.pi))
  if (side/.65)**2+((q.z+.055)/.16)**2<1:continue
  faces.append(tuple(ids))
data=bpy.data.meshes.new('Tailored short vest surface');data.from_pydata(verts,[],faces);data.update();o=bpy.data.objects.new('Anna_Vest',data);bpy.context.collection.objects.link(o)
bm=bmesh.new();bm.from_mesh(data);bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
edgeverts=[v for v in bm.verts if v.is_boundary]
for _ in range(130):bmesh.ops.smooth_vert(bm,verts=edgeverts,factor=.4,use_axis_x=True,use_axis_y=True,use_axis_z=True)
for v in bm.verts:
 theta=math.atan2(v.co.y+.01,v.co.x);v.co=point(theta,v.co.z)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
def linear(v):return ((v+.055)/1.055)**2.4 if v>.04045 else v/12.92
mat=bpy.data.materials.new('Anna soft olive cloth');mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=tuple(linear(v) for v in [.55,.59,.255])+(1,);bs.inputs['Roughness'].default_value=.85;data.materials.append(mat)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
mod=o.modifiers.new('Smooth rounded tailoring','SUBSURF');mod.levels=1;bpy.ops.object.modifier_apply(modifier=mod.name)
# Fine rounded binding follows each actual neckline, armhole and hem boundary.
bm=bmesh.new();bm.from_mesh(o.data);edges=set(e for e in bm.edges if e.is_boundary);loops=[]
while edges:
 e=edges.pop();start=e.verts[0];cur=e.verts[1];loop=[start.co.copy(),cur.co.copy()]
 while cur!=start:
  candidates=[e for e in cur.link_edges if e in edges]
  if not candidates:break
  e=candidates[0];edges.remove(e);cur=e.other_vert(cur);loop.append(cur.co.copy())
 loops.append(loop)
bm.free();curves=[]
for k,loop in enumerate(loops):
 c=bpy.data.curves.new('Vest edge binding','CURVE');c.dimensions='3D';c.bevel_depth=.008;c.bevel_resolution=3;sp=c.splines.new('POLY');sp.points.add(len(loop)-1)
 for p,co in zip(sp.points,loop):p.co=(*co,1)
 ob=bpy.data.objects.new('Binding'+str(k),c);bpy.context.collection.objects.link(ob);c.materials.append(mat);curves.append(ob)
mod=o.modifiers.new('Real cloth thickness','SOLIDIFY');mod.thickness=.012;mod.offset=0;bpy.ops.object.modifier_apply(modifier=mod.name)
for ob in curves:
 bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.convert(target='MESH')
bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
for ob in curves:ob.select_set(True)
bpy.context.view_layer.objects.active=o;bpy.ops.object.join()
for f in o.data.polygons:f.use_smooth=True
o.parent=rig;g=o.vertex_groups.new(name='Body');g.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Shared Body bone','ARMATURE');mod.object=rig
rig.data.pose_position='POSE';target=Vector((0,0,.1));cam=s.camera;cam.data.ortho_scale=2.6;s.render.resolution_x=700;s.render.resolution_y=700
for name,action,frame,pos in [('front','Walk_InPlace',7,(0,-5,.3)),('side','Walk_InPlace',7,(5,0,.3)),('back','Walk_InPlace',7,(0,5,.3)),('seated','Seated',1,(2.8,-5,.6))]:
 rig.animation_data.action=bpy.data.actions[action];s.frame_set(frame);cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
rig.animation_data.action=bpy.data.actions['Walk_InPlace'];s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-short-vest.blend'))
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for n in ['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']:bpy.data.objects[n].select_set(True)
bpy.context.view_layer.objects.active=rig;bpy.ops.export_scene.gltf(filepath=str(P/'Anna-short-vest.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
source=(P/'filter-clips.py').read_text().replace('Anna-leaf-moods.glb','Anna-short-vest.glb');exec(compile(source,str(P/'filter-clips.py'),'exec'))
s.render.resolution_x=420;s.render.resolution_y=420;cam.location=(2.8,-5,.5);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
for action,count,step,prefix in [('Walk_InPlace',25,2,'walk'),('Sit_Demo',97,4,'sit')]:
 rig.animation_data.action=bpy.data.actions[action]
 for f in range(1,count,step):s.frame_set(f);s.render.filepath=str(P/(prefix+'-%03d.png'%f));bpy.ops.render.render(write_still=True)
