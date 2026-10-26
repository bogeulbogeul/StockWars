"""Seat the two under-window panels into the rounded lower foundation molding."""
import bpy,sys,json,hashlib,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-roof-crafted-v9'/'VivianStore-crafted-roof.blend'))
scene=bpy.context.scene;report=[]
for side in ('Left','Right'):
 panel=bpy.data.objects[side+'_Display_Lower_Panel'];matrix=panel.matrix_world.copy();inverse=matrix.inverted()
 points=[matrix@v.co for v in panel.data.vertices];old_bottom=min(p.z for p in points);old_top=max(p.z for p in points)
 fixed=.210;new_bottom=.100;changed=0
 for vertex in panel.data.vertices:
  p=matrix@vertex.co
  if p.z<fixed:
   t=min(1,max(0,(fixed-p.z)/(fixed-old_bottom)))
   p.z-=(old_bottom-new_bottom)*t;vertex.co=inverse@p;changed+=1
 panel.data.update()
 points=[matrix@v.co for v in panel.data.vertices]
 assert abs(max(p.z for p in points)-old_top)<1e-6
 assert abs(min(p.z for p in points)-new_bottom)<1e-6
 report.append({'panel':panel.name,'previousBottom':old_bottom,'newBottom':new_bottom,'topUnchanged':old_top,'modifiedVertices':changed})
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
scene.cycles.samples=32;scene.render.filepath=str(ROOT/'front-right.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-panel-contact.blend'))
cam=scene.camera;cam.data.type='ORTHO';scene.render.resolution_x=1000;scene.render.resolution_y=900
for name,loc,target,scale in [('window-panel-detail',(3,-5,1.4),(.943,-.97,.38),1.35),
 ('panels-front',(0,-7,1.2),(0,-.97,.42),2.85)]:
 cam.location=loc;cam.data.ortho_scale=scale
 cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'source':'vivian-roof-crafted-v9','panels':report,
 'windowSillAndDecorativeInsetUnchanged':True,'roofUnchanged':True,'gameApplied':False,
 'sha256':hashlib.sha256((ROOT/'VivianStore-clean.glb').read_bytes()).hexdigest()},indent=2))
