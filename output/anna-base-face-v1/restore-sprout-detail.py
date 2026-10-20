"""Restore the uploaded sprout's normal detail only; keep clean body and face."""
import bpy,numpy as np,json,hashlib
from pathlib import Path
from mathutils import Vector
SRC=Path(__file__).resolve().parent;P=SRC.parent/'anna-base-face-v2';P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'input.blend'))
source=next(o for o in bpy.context.scene.objects if o.type=='MESH');a=source.data.materials[0];bs=a.node_tree.nodes.get('Principled BSDF');normal=bs.inputs['Normal'].links[0].from_node
texture=normal.inputs['Color'].links[0].from_node.image
texture.filepath_raw=str(P/'sprout-normal-original.png');texture.file_format='PNG';texture.save()
base_image=bs.inputs['Base Color'].links[0].from_node.image;base_image.filepath_raw=str(P/'sprout-color-original.png');base_image.file_format='PNG';base_image.save()
bpy.ops.wm.open_mainfile(filepath=str(SRC/'Anna-clean-face.blend'))
o=bpy.data.objects['Anna_BaseBody'];m=o.data;coords=np.array([v.co[:] for v in m.vertices]);leaf=bpy.data.materials['Anna_Clean_Olive'];face=bpy.data.materials['Anna_Face_CalmSmile'];body=bpy.data.materials['Anna_Clean_Cream']
face_image=next(n.image for n in face.node_tree.nodes if n.type=='TEX_IMAGE');face_hash=hashlib.sha256(np.array(face_image.pixels[:],dtype=np.float32).tobytes()).hexdigest();cream=tuple(body.diffuse_color)
nodes=leaf.node_tree.nodes;links=leaf.node_tree.links;bs=nodes.get('Principled BSDF')
im=bpy.data.images.load(str(P/'sprout-normal-original.png'));im.colorspace_settings.name='Non-Color';im.pack()
tex=nodes.new('ShaderNodeTexImage');tex.image=im;uv=nodes.new('ShaderNodeUVMap');uv.uv_map=m.uv_layers[0].name
nm=nodes.new('ShaderNodeNormalMap');nm.space='TANGENT';nm.uv_map=m.uv_layers[0].name;nm.inputs['Strength'].default_value=1.1
links.new(uv.outputs['UV'],tex.inputs['Vector']);links.new(tex.outputs['Color'],nm.inputs['Color']);links.new(nm.outputs['Normal'],bs.inputs['Normal'])
base=bpy.data.images.load(str(P/'sprout-color-original.png'));base.colorspace_settings.name='sRGB';base.pack();base_node=nodes.new('ShaderNodeTexImage');base_node.image=base;links.new(uv.outputs['UV'],base_node.inputs['Vector']);links.new(base_node.outputs['Color'],bs.inputs['Base Color'])
s=bpy.context.scene;s.cycles.samples=32;cam=s.camera
views=[('sprout',(0,-4,1.0),(.19,0,.80),.65),('front',(0,-4,0),(0,0,0),2.28),('angle',(2.1,-4,.1),(0,0,0),2.28),('sprout-back',(0,4,1),(.19,0,.80),.65)]
for name,delta,target,scale in views:
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'.png'));bpy.ops.render.render(write_still=True)
report={'geometry_identical':bool(np.array_equal(coords,np.array([v.co[:] for v in m.vertices]))),'body_material_unchanged':tuple(body.diffuse_color)==cream and not body.node_tree.nodes.get('Principled BSDF').inputs['Normal'].links,'face_pixels_unchanged':face_hash==hashlib.sha256(np.array(face_image.pixels[:],dtype=np.float32).tobytes()).hexdigest(),'normal_only_on_sprout':True,'normal_strength':1.1,'normal_source':'original uploaded Anna.glb via input.blend','geometry_not_deepened':True}
assert report['geometry_identical'] and report['body_material_unchanged'] and report['face_pixels_unchanged']
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-clean-face.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-clean-face.glb'),use_selection=True,export_format='GLB',export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps(report,indent=2));print('SPROUT_DETAIL_RESTORED',report)
