"""Straight bank counter with a consistent rear edge and more staff clearance."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import extrude

def replace_counter():
 specs=[('Desk_Wood_Plinth',3.64,-.375,.28,.024,.09,.105),('Desk_Cream_Body',3.56,-.345,.25,.105,.60,.10),('Desk_Rounded_Wood_Countertop',3.76,-.42,.30,.705,.085,.13)]
 for name,w,yf,yb,z,h,r in specs:
  old=bpy.data.objects[name];mat=old.data.materials[0];bpy.data.objects.remove(old,do_unlink=True)
  path=[]
  for cx,cy,start in [(w/2-r,yf+r,-90),(w/2-r,yb-r,0),(-w/2+r,yb-r,90),(-w/2+r,yf+r,180)]:
   for i in range(17):
    a=math.radians(start+i*90/16);path.append((cx+r*math.cos(a),cy+r*math.sin(a)))
  # extrude helper expects X/Z contour; build slab along Y then rotate to XY.
  o=extrude(name,path,-h/2,h/2,mat,.008);o.rotation_euler.x=-math.pi/2;o.location.z=z+h/2
  for p in o.data.polygons:p.use_smooth=abs(p.normal.y)<.9
 for o in list(bpy.context.scene.objects):
  if o.name.startswith('Desk_Front_Panel_Molding'):o.location.y-=.30
  elif o.type in {'MESH','CURVE'} and not o.name.startswith(('Desk_Wood_Plinth','Desk_Cream_Body','Desk_Rounded_Wood_Countertop')):
   pts=[o.matrix_world@Vector(c) for c in o.bound_box]
   if pts and min(p.z for p in pts)>=.789 and max(p.z for p in pts)<1.3 and min(p.x for p in pts)>-1.7 and max(p.x for p in pts)<1.7 and min(p.y for p in pts)>-.05 and max(p.y for p in pts)<.75:
    o.location.y-=.30
for file,out,render in [('Bank-furnished-room.blend','Bank-furnished-room','room.png'),('Bank-scale-check.blend','Bank-scale-check','room-scale.png')]:
 bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-open-front-v2'/file));replace_counter();bpy.context.view_layer.update()
 if out=='Bank-furnished-room':
  bpy.ops.object.select_all(action='DESELECT')
  for o in bpy.context.scene.objects:o.select_set(o.type in {'MESH','CURVE','EMPTY'})
  bpy.ops.export_scene.gltf(filepath=str(ROOT/(out+'.glb')),export_format='GLB',use_selection=True)
  bpy.ops.object.select_all(action='DESELECT')
  for o in bpy.context.scene.objects:o.select_set(o.name.startswith(('Desk_Wood_Plinth','Desk_Cream_Body','Desk_Rounded_Wood_Countertop','Desk_Front_Panel_Molding')))
  bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-straight-counter.glb'),export_format='GLB',use_selection=True)
 scene=bpy.context.scene;scene.render.filepath=str(ROOT/render);bpy.ops.render.render(write_still=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/(out+'.blend')))
(ROOT/'report.json').write_text(json.dumps({'shape':'straight rounded rectangle, no rear wings','counter_rear_y':.30,'seat_front_y':.915,'gap':.615,'props_shift_y':-.30,'chair_unchanged':True,'status':'room model update; runtime seating pending'},indent=2),encoding='utf-8')
