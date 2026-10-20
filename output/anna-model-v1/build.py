import bpy,math,json,numpy as np
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'inspection.blend'))
mesh=next(o for o in bpy.data.objects if o.type=='MESH');mesh.name='Anna_Body';m=mesh.data
def linear(c):return ((c+.055)/1.055)**2.4 if c>.04045 else c/12.92
cream=tuple(linear(c) for c in (1,.88,.65));green=tuple(linear(c) for c in (.52,.57,.25))
def mat(name,color):
 a=bpy.data.materials.new(name);a.diffuse_color=(*color,1);a.use_nodes=True;p=a.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.8;return a
body=mat('Anna_Cream',cream);leaf=mat('Anna_Leaf',green);vest=mat('Anna_Vest',green)
m.materials.clear()
for a in [body,leaf,vest]:m.materials.append(a)
outline=[(344,441),(364,467),(380,487),(378,514),(368,541),(351,563),(330,580),(303,586),(278,574),(286,550),(299,513),(307,490),(313,462),(318,442)]
def inside_polygon(x,y,poly):
 hit=False
 for i,(a,b) in enumerate(poly):
  c,d=poly[i-1]
  if (b>y)!=(d>y) and x<(c-a)*(y-b)/(d-b)+a:hit=not hit
 return hit
def vest_mask(x,y,z):
 if y<-.13:
  px=400-abs(x)*800/2.28;py=400-z*800/2.28
  return inside_polygon(px,py,outline)
 if not -.49<z<-.16 or abs(x)>.337:return False
 if abs(x)>.24 and z>-.32 and abs(y)<.15:return False
 return True
for p in m.polygons:
 x,y,z=p.center;p.material_index=1 if z>.695 else (2 if vest_mask(x,y,z) else 0);p.use_smooth=True
# Planar head texture, cream background and a readable simple face.
N=1024;yy,xx=np.mgrid[0:N,0:N];X=xx/(N-1)*1.0-.5;Z=yy/(N-1)*1.0-.15
ink=np.zeros((N,N),dtype=np.float32)
for cx in [-.155,.155]:
 d=np.sqrt(((X-cx)/.035)**2+((Z-.23)/.055)**2);ink=np.maximum(ink,np.clip((1-d)*50,0,1))
# Small U-shaped smile; expression remains on a separate texture.
dist=np.full((N,N),10.)
for t in np.linspace(-1,1,140):dist=np.minimum(dist,np.sqrt((X-.058*t)**2+(Z-(.115+.028*t*t))**2))
ink=np.maximum(ink,np.clip((.008-dist)/.0015,0,1))
rgba=np.ones((N,N,4),dtype=np.float32);rgba[:,:,:3]=np.array(cream)[None,None,:]*(1-ink[:,:,None])+np.array([.025,.015,.008])[None,None,:]*ink[:,:,None]
im=bpy.data.images.new('Anna_Face_BaseColor',width=N,height=N,alpha=True);im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(rgba.ravel());im.filepath_raw=str(P/'face-basecolor.png');im.file_format='PNG';im.save();im.pack()
face=mat('Anna_Face',cream);tex=face.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im;face.node_tree.links.new(tex.outputs['Color'],face.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);m.materials.append(face)
uv=m.uv_layers.new(name='AnnaFaceUV')
for p in m.polygons:
 if p.center.z>-.08 and p.center.y<-.22 and p.material_index==0:p.material_index=3
 for li in p.loop_indices:
  v=m.vertices[m.loops[li].vertex_index].co;uv.data[li].uv=((v.x+.5),v.z+.15)
# Simple seven-bone rig, with smooth shoulder and hip transitions.
bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='Anna_Rig';bpy.ops.object.mode_set(mode='EDIT');eb=rig.data.edit_bones;eb.remove(eb[0])
spec=[('Root',(0,0,-.95),(0,0,-.78),None),('Body',(0,0,-.72),(0,0,-.13),'Root'),('Head',(0,0,-.13),(0,0,.60),'Body'),('Arm.L',(.29,0,-.21),(.63,0,-.21),'Body'),('Arm.R',(-.29,0,-.21),(-.63,0,-.21),'Body'),('Leg.L',(.14,0,-.69),(.14,0,-.93),'Body'),('Leg.R',(-.14,0,-.69),(-.14,0,-.93),'Body')]
for name,h,t,parent in spec:
 b=eb.new(name);b.head=h;b.tail=t
 if parent:b.parent=eb[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
groups={name:mesh.vertex_groups.new(name=name) for name,_,_,_ in spec}
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
for v in m.vertices:
 x,y,z=v.co;weights={'Body':1.}
 if abs(x)>.255 and -.36<z<-.075:
  a=smooth((abs(x)-.255)/.12);weights={'Arm.L' if x>0 else 'Arm.R':a,'Body':1-a}
 elif z>-.13:
  h=smooth((z+.13)/.05);weights={'Head':h,'Body':1-h}
 elif z<-.65:
  a=smooth((-.65-z)/.10);weights={'Leg.L' if x>0 else 'Leg.R':a,'Body':1-a}
 for name,w in weights.items():
  if w>0:groups[name].add([v.index],w,'REPLACE')
mod=mesh.modifiers.new('AnnaSkin','ARMATURE');mod.object=rig;mesh.parent=rig
s=bpy.context.scene;s.render.resolution_x=800;s.render.resolution_y=800;s.cycles.samples=24;cam=s.camera;center=Vector((0,0,0));cam.data.ortho_scale=2.28
for name,loc in [('front',(0,-5,0)),('back',(0,5,0)),('side',(5,0,0)),('angle',(2.7,-5,.25))]:
 cam.location=loc;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
# A modest motion sample for deformation inspection, delivered separately.
rig.animation_data_create();action=bpy.data.actions.new('Rig_Check');rig.animation_data.action=action
for frame,amount in [(1,0),(13,1),(25,0)]:
 for name,angle in [('Arm.L',-.35),('Arm.R',.35),('Leg.L',.15),('Leg.R',-.15)]:
  b=rig.pose.bones[name];b.rotation_mode='XYZ';b.rotation_euler=(angle*amount,0,0);b.keyframe_insert('rotation_euler',frame=frame)
s.frame_start=1;s.frame_end=25;s.render.fps=24;s.frame_set(13);cam.location=(0,-5,0);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(P/'rig-check.png');bpy.ops.render.render(write_still=True);s.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-rigged.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-rigged.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=False,export_cameras=False,export_lights=False)
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-rig-check.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_cameras=False,export_lights=False)
report={'vertices':len(m.vertices),'bones':list(groups),'materials':[a.name for a in m.materials],'source_geometry_preserved':True,'unweighted_vertices':sum(not v.groups for v in m.vertices),'max_weight_sum_error':max(abs(sum(g.weight for g in v.groups)-1) for v in m.vertices),'status':'first pass; inspect clothing boundaries and shoulder deformation before adoption'}
(P/'validation.json').write_text(json.dumps(report,indent=2));print('ANNA_COMPLETE',report)
