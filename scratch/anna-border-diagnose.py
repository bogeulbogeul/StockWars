import bpy
from pathlib import Path
from mathutils import Vector
P=Path('C:/GitHub/StockWars/output/anna-painted-retouch-v1')
bpy.ops.wm.open_mainfile(filepath=str(P/'Anna-retouched.blend'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');a=o.data.materials[0];n=a.node_tree.nodes;l=a.node_tree.links;bs=n.get('Principled BSDF');out=n.get('Material Output')
s=bpy.context.scene;cam=s.camera;s.cycles.samples=16
views=[('neck',(0,-4,.1),(0,0,-.13),.85),('pit',(4,-1,.1),(.29,0,-.25),.55)]
for mode in ['base-only','no-normal']:
 if mode=='base-only':
  em=n.new('ShaderNodeEmission');l.new(bs.inputs['Base Color'].links[0].from_socket,em.inputs['Color']);l.new(em.outputs[0],out.inputs['Surface'])
 else:
  l.new(bs.outputs['BSDF'],out.inputs['Surface'])
  for link in list(bs.inputs['Normal'].links):l.remove(link)
 for name,delta,target,scale in views:
  t=Vector(target);cam.location=t+Vector(delta);cam.rotation_euler=(t-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale;s.render.filepath=str(P/(mode+'-'+name+'.png'));bpy.ops.render.render(write_still=True)
