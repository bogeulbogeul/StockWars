"""Clean Anna's base materials and add a replaceable calm smile texture."""
import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'input.blend'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');o.name='Anna_BaseBody';m=o.data
original=np.array([v.co[:] for v in m.vertices]);source_uv=np.array([l.uv[:] for l in m.uv_layers.active.data]);old=m.materials[0];bs=old.node_tree.nodes.get('Principled BSDF');im=bs.inputs['Base Color'].links[0].from_node.image;w,h=im.size
source=np.array(im.pixels[:],dtype=np.float32).reshape(h,w,4);ids=np.array([l.vertex_index for l in m.loops]);points=original[ids];uv=source_uv
sample=source[np.clip((uv[:,1]*h).astype(int),0,h-1),np.clip((uv[:,0]*w).astype(int),0,w-1),:3]
cream=np.median(sample[(points[:,2]>.0)&(points[:,2]<.4)],axis=0);olive=np.median(sample[points[:,2]>.76],axis=0)
def linear(c):return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
def material(name,rgb):
 a=bpy.data.materials.new(name);a.diffuse_color=(*linear(rgb),1);a.use_nodes=True;bs=a.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=a.diffuse_color;bs.inputs['Roughness'].default_value=.82;bs.inputs['Metallic'].default_value=0;return a
body=material('Anna_Clean_Cream',cream);leaf=material('Anna_Clean_Olive',olive);face=material('Anna_Face_CalmSmile',cream)
# Design the face directly in planar model coordinates. RGB pixels are sRGB.
N=2048;Y,X=np.mgrid[0:N,0:N];x=X/(N-1)-.5;z=Y/(N-1)-.15
rgba=np.ones((N,N,4),dtype=np.float32);rgba[:,:,:3]=cream;ink=np.zeros((N,N),dtype=np.float32)
for cx in [-.15,.15]:
 d=np.sqrt(((x-cx)/.033)**2+((z-.245)/.052)**2);ink=np.maximum(ink,np.clip((1-d)*65,0,1))
dist=np.full((N,N),10.,dtype=np.float32)
for t in np.linspace(-1,1,130):dist=np.minimum(dist,np.sqrt((x-.057*t)**2+(z-(.128+.026*t*t))**2))
ink=np.maximum(ink,np.clip((.0075-dist)/.0012,0,1));dark=np.array([.20,.14,.085],dtype=np.float32)
rgba[:,:,:3]=rgba[:,:,:3]*(1-ink[:,:,None])+dark[None,None,:]*ink[:,:,None]
# Restrained eye highlights keep the expression gentle at close range.
for cx in [-.15,.15]:
 d=np.sqrt(((x-(cx-.009))/.008)**2+((z-.267)/.011)**2);highlight=np.clip((1-d)*25,0,1);rgba[:,:,:3]=rgba[:,:,:3]*(1-highlight[:,:,None])+np.array([1.,.98,.90])[None,None,:]*highlight[:,:,None]
image=bpy.data.images.new('Anna_CalmSmile_sRGB',width=N,height=N,alpha=True);image.colorspace_settings.name='sRGB';image.pixels.foreach_set(rgba.ravel());image.filepath_raw=str(P/'face-calm-smile.png');image.file_format='PNG';image.save();image.pack()
tex=face.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;uvnode=face.node_tree.nodes.new('ShaderNodeUVMap');uvnode.uv_map='FacePlanar';face.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector']);face.node_tree.links.new(tex.outputs['Color'],face.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
m.materials.clear()
for a in [body,leaf,face]:m.materials.append(a)
for p in m.polygons:
 x,y,z=p.center;stem=z>.695 or (z>.688 and -.003<x<.046 and -.027<y<.025 and p.normal.z<.85)
 p.material_index=1 if stem else (2 if z>-.02 and y<-.22 else 0);p.use_smooth=True
layer=m.uv_layers.new(name='FacePlanar')
for loop in m.loops:
 v=m.vertices[loop.vertex_index].co;layer.data[loop.index].uv=(v.x+.5,v.z+.15)
m.uv_layers.active=layer
report={'vertices':len(m.vertices),'geometry_identical':bool(np.array_equal(original,np.array([v.co[:] for v in m.vertices]))),'source_uv_preserved':bool(np.array_equal(source_uv,np.array([l.uv[:] for l in m.uv_layers[0].data]))),'cream_srgb':cream.tolist(),'olive_srgb':olive.tolist(),'face':'open oval eyes, subtle highlights, small smile','face_texture_separate':True,'roughness':.82,'metallic':0,'source_stain_normal_maps_replaced':True,'rig_added':False}
assert report['geometry_identical'] and report['source_uv_preserved']
s=bpy.context.scene;s.cycles.samples=24;cam=s.camera
views=[('front',(0,-4,0),(0,0,0),2.28),('left',(4,0,0),(0,0,0),2.28),('right',(-4,0,0),(0,0,0),2.28),('back',(0,4,0),(0,0,0),2.28),('angle',(2.1,-4,.1),(0,0,0),2.28),('face-close',(0,-4,0),(0,0,.24),.95),('sprout',(0,-4,1.6),(.025,0,.72),.44)]
for name,delta,target,scale in views:
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-clean-face.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-clean-face.glb'),use_selection=True,export_format='GLB',export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps(report,indent=2));print('CLEAN_FACE_COMPLETE',report)
