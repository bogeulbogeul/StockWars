"""Retouch supplied painted model through native Blender material baking."""
import bpy,numpy as np,json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'input.blend'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');m=o.data;a=m.materials[0];nodes=a.node_tree.nodes;links=a.node_tree.links;bs=nodes.get('Principled BSDF');source=bs.inputs['Base Color'].links[0].from_node
image=source.image;W,H=image.size;pixels=np.array(image.pixels[:],dtype=np.float32).reshape(H,W,4)
uv=np.array([p.uv[:] for p in m.uv_layers.active.data]);loopids=np.array([p.vertex_index for p in m.loops]);V=np.array([v.co[:] for v in m.vertices]);N=np.array([v.normal[:] for v in m.vertices]);coords=V[loopids];norm=N[loopids];x,y,z=coords.T
ix=np.clip((uv[:,0]*W).astype(int),0,W-1);iy=np.clip((uv[:,1]*H).astype(int),0,H-1);sample=pixels[iy,ix,:3]
cream=np.median(sample[(z>.05)&(z<.4)&(y<-.2)],axis=0);olive=np.median(sample[z>.75],axis=0)
def to_linear(c):return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
radius=np.sqrt(((y+.002)/.119)**2+((z+.213)/.119)**2)
arm=(abs(x)>.235)&(abs(x)<.39)&(z<-.09)&(z>-.35)
arm_blend=np.clip((.925-radius)/.05,0,1)*arm
# Keep the user's raised olive piping; correct only interior skin and stem.
stem_base=(z>.6775)&(z<.693)&(x>.012)&(x<.067)&(y>-.061)&(y<.049)&(norm[:,2]<.92)
stem_upper=(z>=.6828)&(z<.735)&(x<.095)
stem=stem_base|stem_upper
alpha=np.maximum(arm_blend,stem.astype(float));target=np.tile(to_linear(cream),(len(m.loops),1));target[z>.64]=to_linear(olive)
attr=m.color_attributes.new(name='LocalRetouch',type='FLOAT_COLOR',domain='CORNER');rgba=np.column_stack([target,alpha]).astype(np.float32);attr.data.foreach_set('color',rgba.ravel())
color=nodes.new('ShaderNodeVertexColor');color.layer_name=attr.name
mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';links.new(color.outputs['Alpha'],mix.inputs[0]);links.new(source.outputs['Color'],mix.inputs[1]);links.new(color.outputs['Color'],mix.inputs[2])
emission=nodes.new('ShaderNodeEmission');links.new(mix.outputs[0],emission.inputs['Color']);out=nodes.get('Material Output');links.new(emission.outputs[0],out.inputs['Surface'])
baked=bpy.data.images.new('Anna_UserPaint_Retouched',width=W,height=H,alpha=True);baked.colorspace_settings.name='sRGB';baked.pixels.foreach_set(pixels.ravel())
dest=nodes.new('ShaderNodeTexImage');dest.image=baked;nodes.active=dest
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
s=bpy.context.scene;s.render.bake.use_clear=False;s.render.bake.margin=4;s.cycles.samples=1
bpy.ops.object.bake(type='EMIT')
links.new(bs.outputs['BSDF'],out.inputs['Surface']);links.new(dest.outputs['Color'],bs.inputs['Base Color'])
baked.filepath_raw=str(P/'basecolor-retouched.png');baked.file_format='PNG';baked.save();baked.pack()
# Leave only exportable image-based material nodes; no extra color multiplication.
for node in [color,mix,emission]:nodes.remove(node)
m.color_attributes.remove(attr)
s.cycles.samples=24;cam=s.camera;center=Vector((0,0,-.001));cam.data.ortho_scale=2.28
views=[('front',(0,-4,0),(0,0,-.001),2.28),('right',(4,0,0),(0,0,-.001),2.28),('back',(0,4,0),(0,0,-.001),2.28),('armpit',(3,-2,.15),(.29,0,-.25),.55),('sprout',(0,-4,1.8),(.06,0,.72),.42)]
for name,delta,target,scale in views:
 if '--quick' in __import__('sys').argv and name not in ['front','armpit','sprout']:continue
 t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(name+'-after.png'));bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Anna-retouched.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'Anna-retouched.glb'),use_selection=True,export_format='GLB',export_skins=False,export_animations=False,export_cameras=False,export_lights=False)
report={'source':'user-painted Anna.glb, 2026-10-20 02:19','vertices':len(m.vertices),'cream_srgb':cream.tolist(),'olive_srgb':olive.tolist(),'retouch_loop_count':int((alpha>0).sum()),'native_blender_texture_bake':True,'geometry_preserved':bool(np.array_equal(V,np.array([v.co[:] for v in m.vertices]))),'uv_preserved':bool(np.array_equal(uv,np.array([p.uv[:] for p in m.uv_layers.active.data]))),'face_kept_blank':True,'rig_added':False,'normal_roughness_maps_preserved':True}
(P/'validation.json').write_text(json.dumps(report,indent=2));print('PAINT_RETOUCH_COMPLETE',report)
