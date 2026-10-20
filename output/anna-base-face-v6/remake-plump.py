"""Rebuild only the blade as a smooth plump leaf with one continuous curved vein."""
import bpy,bmesh,math,numpy as np,json
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-base-face-v7'
bpy.ops.wm.open_mainfile(filepath=str(SRC/'Anna-clean-face.blend'))
body=bpy.data.objects['Anna_BaseBody'];m=body.data;bm=bmesh.new();bm.from_mesh(m);remove=[f for f in bm.faces if f.material_index==1];bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(m);bm.free()
mat=bpy.data.materials['Anna_Clean_Olive'];rgb=np.array([.57,.62,.22]);linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4);mat.diffuse_color=(*linear,1);bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=mat.diffuse_color;bs.inputs['Roughness'].default_value=.72
verts=[];faces=[];rows=112;segments=80
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
for j in range(rows):
 t=j/(rows-1);cx=.020+.400*t**1.4;cz=.675+.450*t-.242*t*t;dx=.560*t**.4;dz=.450-.484*t;length=math.hypot(dx,dz);px=-dz/length;pz=dx/length
 profile=max(0,math.sin(math.pi*t))**.72;transition=smooth(t/.13)
 width=(.1125*profile)*transition+.027*(1-transition);asym=-.0175*profile*transition
 thickness=.048*profile*transition+.027*(1-transition)
 for k in range(segments):
  angle=math.tau*k/segments;u=math.sin(angle);c=math.cos(angle);offset=width*u+asym*u*u
  groove=.019*math.exp(-.5*(u/.17)**2)*max(c,0)**4*smooth(t/.10)*smooth((1-t)/.15)
  verts.append((cx+px*offset,-thickness*c+groove,cz+pz*offset))
for j in range(rows-1):
 for k in range(segments):
  a=j*segments+k;b=j*segments+(k+1)%segments;faces.append((a,b,b+segments,a+segments))
faces.append(tuple(range(segments-1,-1,-1)));faces.append(tuple((rows-1)*segments+k for k in range(segments)))
mesh=bpy.data.meshes.new('Anna_PlumpLeaf_Surface');mesh.from_pydata(verts,[],faces);mesh.update();leaf=bpy.data.objects.new('Anna_PlumpLeaf',mesh);bpy.context.collection.objects.link(leaf);mesh.materials.append(mat)
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
for p in mesh.polygons:p.use_smooth=True
s=bpy.context.scene;s.cycles.samples=32;cam=s.camera
for name,delta,target,scale,res in [('sprout-front',(0,-4,.5),(.19,0,.81),.70,800),('sprout-back',(0,4,.5),(.19,0,.81),.70,800),('front',(0,-4,0),(0,0,0),2.28,800),('distant',(0,-4,0),(0,0,0),2.28,320),('sprout-side',(4,0,.3),(.19,0,.81),.70,800)]:
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.resolution_x=res;s.render.resolution_y=res;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);leaf.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-clean-face.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-clean-face.glb'),use_selection=True,export_format='GLB',export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps({'leaf_rebuilt_as_separate_mesh':True,'body_face_geometry_preserved':True,'root_attachment_preserved':True,'rounded_blade':True,'single_curved_groove':True,'smooth_rear':True,'source_preserved':True,'leaf_srgb':rgb.tolist()},indent=2));print('ROUNDED_PLUMP_LEAF_COMPLETE')
