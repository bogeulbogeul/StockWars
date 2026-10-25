"""Rounded clay roofing for the current wide general store; other assets stay fixed."""
import bpy,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'vivian-door-cross-v8'/'VivianStore-fitted-cross.blend'))
scene=bpy.context.scene
old=bpy.data.objects.get('Coral_Ridge_Cap');coral=old.data.materials[0]
roof=bpy.data.objects['Pitched_Coral_Roof']
points=[roof.matrix_world@Vector(v) for v in roof.bound_box]
# The adopted v4 widened the roof in X only; retain that real pitch and footprint.
half=1.47*1.15;slope=.70/half;peak=2.23;depth=1.04
for o in list(scene.objects):
 if o.name.startswith(('Coral_Ridge_Cap','Coral_Clay_Roof_Tile')):bpy.data.objects.remove(o,do_unlink=True)
for side in (-1,1):
 normal=Vector((side*slope,0,1)).normalized()
 for row in range(8):
  x=side*(row+.5)*half/8
  for column in range(9):
   y=-depth+(column+.5)*2*depth/9
   center=Vector((x,y,peak-slope*abs(x)))+normal*.006
   tile=box('Coral_Clay_Roof_Tile',((half/8-.005)*math.sqrt(1+slope*slope),2*depth/9-.005,.043),center,coral,.011)
   tile.rotation_euler.y=side*math.atan(slope)
def cap(name,radius,height,base,a,b):
 profile=[(radius*math.cos(math.pi*i/64),base+height*math.sin(math.pi*i/64)) for i in range(65)]
 obj=extrude(name,profile,a,b,coral,.0025)
 for polygon in obj.data.polygons:polygon.use_smooth=abs(polygon.normal.y)<.99
 obj.data.normals_split_custom_set([(0,0,0)]*len(obj.data.loops))
length=2.108;start=-length/2;step=length/9
for i in range(9):cap('Coral_Ridge_Cap',.085,.120,peak-.036,start+i*step+.0005,start+(i+1)*step-.0005)
for i in range(10):
 y=start+i*step
 cap('Coral_Ridge_Rounded_Overlap_Band',.091,.128,peak-.040,y-.010,y+.010)
bpy.context.view_layer.update()
asset=[o for o in scene.objects if o.type in ('MESH','CURVE','EMPTY') and not o.get('preview_only',False) and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'),export_format='GLB',use_selection=True)
scene.cycles.samples=32;scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
cam=scene.camera;cam.data.type='ORTHO'
for name,loc,target,scale in [('front-right',(4,-6,3.5),(0,-.08,1.05),4.3),
 ('roof-detail',(3,-5,3.7),(0,-.05,2.07),3.4),
 ('ridge-detail',(1,-3,2.85),(0,-.60,2.26),1.4)]:
 cam.location=loc;cam.data.ortho_scale=scale
 cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(4,-6,3.5);cam.data.ortho_scale=4.3
cam.rotation_euler=(Vector((0,-.08,1.05))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'VivianStore-crafted-roof.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'source':'vivian-door-cross-v8','roofTiles':144,'ridgeCaps':9,'overlapBands':10,
 'roofHalfWidth':half,'roofRise':.70,'tileThickness':.043,'tileBevel':.011,
 'nonRoofAssetsUnchanged':True,'gameApplied':False,
 'sha256':hashlib.sha256((ROOT/'VivianStore-clean.glb').read_bytes()).hexdigest()},indent=2))
