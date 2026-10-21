"""Preserve source; simplify Meshy sofa and soften texture contrast for bank palette."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Meshy_AI_Cedar_Haven_Sofa_1020184130_texture.glb')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
original=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
# Classify the original surface before decimation, then use clean game materials.
import numpy as np
woodmat=bpy.data.materials.new('Bank_Muted_Honey_Wood');woodmat.use_nodes=True
clothmat=bpy.data.materials.new('Bank_Clean_Cream_Fabric');clothmat.use_nodes=True
for mat,color in [(woodmat,(.43,.25,.12,1)),(clothmat,(.82,.76,.64,1))]:
 sh=mat.node_tree.nodes.get('Principled BSDF');sh.inputs['Base Color'].default_value=color;sh.inputs['Roughness'].default_value=.85
for obj in meshes:
 old=list(obj.data.materials);images={}
 for i,mat in enumerate(old):
  sh=mat.node_tree.nodes.get('Principled BSDF')
  if sh.inputs['Base Color'].is_linked:
   node=sh.inputs['Base Color'].links[0].from_node
   if node.type=='TEX_IMAGE':
    image=node.image;w,h=image.size;images[i]=(np.array(image.pixels[:],dtype=np.float32).reshape(h,w,4),w,h)
 uv=obj.data.uv_layers.active.data
 labels=[]
 for face in obj.data.polygons:
  pixels,w,h=images[face.material_index]
  co=sum((uv[i].uv for i in face.loop_indices),Vector((0,0)))/len(face.loop_indices)
  rgb=pixels[min(h-1,int(co.y*h)%h),min(w-1,int(co.x*w)%w),:3]
  labels.append(0 if float((rgb[0]-rgb[2])/max(rgb[0],.001))>.58 else 1)
 obj.data.materials.clear();obj.data.materials.append(woodmat);obj.data.materials.append(clothmat)
 for face,label in zip(obj.data.polygons,labels):face.material_index=label
# Separate material regions so decimation cannot drag wood colors across cloth.
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:obj.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
# Keep UVs/material boundaries and about 22k triangles for curved arms and scroll ends.
for obj in meshes:
 bpy.context.view_layer.objects.active=obj
 mod=obj.modifiers.new('Game_Mesh_Reduction','DECIMATE');mod.ratio=.25
 mod.use_collapse_triangulate=True
 bpy.ops.object.modifier_apply(modifier=mod.name)
 obj.data.normals_split_custom_set([(0,0,0)]*len(obj.data.loops))
 for p in obj.data.polygons:p.use_smooth=True
# Reduce portable image payload; soften local texture contrast with a small blur
# and restrained color grading. Basecolor stays an image to retain material identity.
import numpy as np
report=[]
used=set()
for mat in bpy.data.materials:
 if not mat.use_nodes:continue
 shader=mat.node_tree.nodes.get('Principled BSDF')
 if not shader:continue
 base=shader.inputs['Base Color']
 for link in list(shader.inputs['Roughness'].links):mat.node_tree.links.remove(link)
 shader.inputs['Roughness'].default_value=.86
 for link in list(shader.inputs['Metallic'].links):mat.node_tree.links.remove(link)
 shader.inputs['Metallic'].default_value=0
 for link in list(shader.inputs['Normal'].links):mat.node_tree.links.remove(link)
 for node in mat.node_tree.nodes:
  if node.type=='NORMAL_MAP':node.inputs['Strength'].default_value=.15
 if base.is_linked:
  node=base.links[0].from_node
  if node.type=='TEX_IMAGE' and node.image:
   img=node.image
   if img.name not in used:
    used.add(img.name);img.scale(1024,1024)
    w,h=img.size;px=np.array(img.pixels[:],dtype=np.float32).reshape(h,w,4)
    rgb=px[:,:,:3];blur=rgb.copy()
    for _ in range(3):
     blur=(blur*4+np.roll(blur,1,0)+np.roll(blur,-1,0)+np.roll(blur,1,1)+np.roll(blur,-1,1))/8
    rgb[:]=rgb*.25+blur*.75
    # Warm wood pixels move toward muted honey; cream cloth becomes cleaner.
    warmth=rgb[:,:,0]-rgb[:,:,2]
    woodmask=np.clip((warmth-.09)/.20,0,1)[:,:,None]
    woodtarget=np.array([.64,.43,.24],dtype=np.float32)
    cloth=np.array([.86,.82,.72],dtype=np.float32)
    rgb[:]=rgb*(1-.27*woodmask)+woodtarget*(.27*woodmask)
    clothmask=(1-woodmask)*np.clip((rgb.mean(2,keepdims=True)-.40)/.25,0,1)
    rgb[:]=rgb*(1-.18*clothmask)+cloth*(.18*clothmask)
    img.pixels.foreach_set(px.ravel());img.update();img.filepath_raw=str(ROOT/'sofa-basecolor.png');img.file_format='PNG';img.save();img.pack()
    report.append({'image':img.name,'size':[w,h]})
asset=list(bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-sofa-optimized.glb'),export_format='GLB',use_selection=True,export_image_format='JPEG',export_jpeg_quality=88)
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
# Save editable geometry/materials, then render before/after under same studio light.
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-sofa-optimized.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
for loc,power,size in [((-3,-4,6),400,5),((4,1,5),200,4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
coords=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box];lo=Vector([min(v[i] for v in coords) for i in range(3)]);hi=Vector([max(v[i] for v in coords) for i in range(3)]);center=(lo+hi)/2
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=max(hi-lo)*1.35;cam.location=center+Vector((3,-5,3))*max(hi-lo);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1000
scene.render.filepath=str(ROOT/'optimized.png');bpy.ops.render.render(write_still=True)
for o in meshes:o.hide_render=True
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Meshy_AI_Cedar_Haven_Sofa_1020184130_texture.glb')
scene.render.filepath=str(ROOT/'original.png');bpy.ops.render.render(write_still=True)
(ROOT/'report.json').write_text(json.dumps({'source_triangles':original,'optimized_triangles':triangles,'reduction_percent':round((1-triangles/original)*100,1),'source_bytes':Path('C:/Users/bogeu/Downloads/Meshy_AI_Cedar_Haven_Sofa_1020184130_texture.glb').stat().st_size,'optimized_bytes':(ROOT/'Bank-sofa-optimized.glb').stat().st_size,'textures':report,'changes':['muted honey wood material','clean cream fabric material','high roughness','image textures removed','surface normals reset'],'game_integration':False},indent=2),encoding='utf-8')
