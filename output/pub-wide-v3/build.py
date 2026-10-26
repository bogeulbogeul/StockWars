"""Widen structural shell by 8%, retaining fitting sizes and height/depth."""
import bpy,sys,json,hashlib,math
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'pub-redesign-v2/Pub-redesign.blend'))
s=bpy.context.scene;scale=1.08
# Keep door, fittings and entire window assemblies at their original size.
fixed=('Double_Arch_Door','Door_Frame','Door_Blue_Glass','Door_Lower_Panel','Handle_Mount','Brass_Door_Handle','Golden_Crescent')
window=('Front_Left','Front_Right','Right_Side','Left_Side')
sign=('Round_Pub_Sign','Sign_','Mug_')
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
snap={o.name:o.matrix_world.copy() for o in asset}
for o in asset:
 if o.parent:continue
 name=o.name;m=snap[name].copy()
 if name.startswith(fixed):continue
 if name.startswith(window+sign+('Lantern_','Smooth_Chimney','Chimney_')):
  # Move centers outwards; keep the geometry's local scale unchanged.
  if name.startswith('Front_Left'):dx=-1.10*.08
  elif name.startswith('Front_Right'):dx=1.10*.08
  elif name.startswith(('Right_Side','Left_Side')):dx=(1 if 'Right' in name else -1)*1.68*.08
  elif name.startswith(sign):dx=1.68*.08
  elif name.startswith('Lantern_'):
   pts=[m@Vector(p) for p in o.bound_box];cx=sum(p.x for p in pts)/8;dx=(1 if cx>0 else -1)*.58*.08
  else:dx=-1*.08
  o.matrix_world=Matrix.Translation((dx,0,0))@m
 else:o.matrix_world=Matrix.Diagonal((scale,1,1,1))@m
# Chimney collar and trimmed roofing must stretch together with the actual hole.
# The chimney itself widens in X by the same 8% to maintain that closed contact.
for o in asset:
 if o.name.startswith(('Smooth_Chimney','Chimney_Cap','Chimney_Top')):o.matrix_world=Matrix.Diagonal((scale,1,1,1))@snap[o.name]
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Pub-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,ortho in [('front-right',(4,-6,3.5),(0,-.08,1.18),5.25),('front',(0,-7,2.8),(0,-.08,1.18),5.25),('rear',(4,6,3.5),(0,0,1.18),5.25)]:
 c.location=loc;c.data.ortho_scale=ortho;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Pub-wide.blend'))
(R/'manifest.json').write_text(json.dumps({'source':'pub-redesign-v2','widthFactor':scale,'doorWindowSignSizesPreserved':True,'heightDepthPreserved':True,'gameApplied':False,'sha256':hashlib.sha256((R/'Pub-clean.glb').read_bytes()).hexdigest()},indent=2))
