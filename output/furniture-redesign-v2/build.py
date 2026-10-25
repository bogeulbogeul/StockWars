"""Adopted furniture-shop concept, native 3D production asset."""
import bpy,sys,json,hashlib,math
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
sys.path[:0]=[str(R),str(R.parent/'cipher-exterior-blender-v1')]
from exterior_geometry import box,extrude
import roof
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'furniture-exterior-clean-v1/Furniture-clean.blend'))
s=bpy.context.scene
remove=('Main_','Showroom_Sealed','Showroom_Rounded_Tile','Showroom_Honey','Showroom_Front','Showroom_Rear','Showroom_Continuous','Front_Wood_Beam','Rear_Wood_Beam','Side_Eaves_Beam')
for o in list(s.objects):
 if o.name.startswith(remove):bpy.data.objects.remove(o,do_unlink=True)
def recolor(name,color):
 m=bpy.data.materials[name];m.diffuse_color=(*color,1);m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*color,1);return m
wood=recolor('Furniture_Honey_Wood',(.53,.30,.12))
cream=recolor('Furniture_Cream_Walls',(.88,.79,.65))
stone=recolor('Furniture_Smooth_Base',(.83,.75,.63))
clay=recolor('Furniture_Dark_Brown_Tiles',(.28,.17,.12))
recolor('Furniture_Chair_Emblem_Cream',(.94,.85,.68))
recolor('Sign_Warm_Walnut_Inset',(.40,.23,.10))
recolor('Furniture_Blue_Gray_Glass',(.25,.45,.55))
counts=roof.build(clay,wood,cream)
# Union eaves and headers so their exposed corners have no separate end caps.
trim=[o for o in s.objects if o.name.startswith(('Continuous_Honey_Fascia','Wing_End_Timber_Fascia','Main_Left_Side_Fascia','Continuous_Front_Header','Continuous_Rear_Header','Showroom_Horizontal_Header'))]
base=trim[0]
for other in trim[1:]:
 bpy.context.view_layer.objects.active=base;m=base.modifiers.new('Continuous_Timber_Join','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=other
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(other,do_unlink=True)
base.name='Joined_Timber_Eaves_And_Headers'
# Sign is mounted to the front gable rather than hovering away from it.
for o in s.objects:
 if o.name.startswith(('Chair_House_Plaque','Plaque_Recessed','Chair_Emblem')):
  o.location.y+=.030
  if o.type=='MESH':
   for v in o.data.vertices:
    p=o.matrix_world@v.co;p.x=-1.081+(p.x+1.081)*.90;p.z=1.85+(p.z-1.85)*.90;v.co=o.matrix_world.inverted()@p
   o.data.update()
# Scale the existing showcase about its center, retaining its single opening.
center=Vector((.76*1.15,-.96,.85))
for o in s.objects:
 if o.type=='MESH' and o.name.startswith(('Showroom_Rounded_Wood_Frame','Showroom_Inset')):
  for v in o.data.vertices:
   p=o.matrix_world@v.co;p.x=center.x+(p.x-center.x)*1.08;p.z=center.z+(p.z-center.z)*1.13
   v.co=o.matrix_world.inverted()@p
  o.data.update()
# Seat door leaves into the top step; keep the entrance center and top height.
for o in s.objects:
 if o.type=='MESH' and o.name.startswith(('Entry_Double_Door_Leaf','Door_Cream_Arch')):
  for v in o.data.vertices:
   p=o.matrix_world@v.co
   if p.z<.215:p.z-=.035*min(1,max(0,(.215-p.z)/.03));v.co=o.matrix_world.inverted()@p
  o.data.update()
# Add shallow lower panel recesses with continuous rounded frames.
for o in list(s.objects):
 if o.name.startswith('Door_Lower_Panel'):
  center=o.matrix_world.translation.copy();size=(.255*1.15,.018,.28)
  bpy.data.objects.remove(o,do_unlink=True)
  panel=box('Door_Lower_Inset_Panel',size,center,wood,.009)
  inner=box('Panel_Recess_Cutter',(size[0]-.038,.022,.242),(center.x,center.y-.009,center.z),wood,.006)
  bpy.context.view_layer.objects.active=panel;m=panel.modifiers.new('Blind_Panel_Recess','BOOLEAN');m.operation='DIFFERENCE';m.object=inner
  bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(inner,do_unlink=True)
bpy.context.view_layer.update()
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Furniture-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=32;s.render.resolution_x=1200;s.render.resolution_y=1000
c=s.camera
views=[('front-right',(4,-6,3.5),(0,-.08,1.15),5.35),('front',(0,-7,2.7),(0,-.08,1.15),5.35),('rear',(4,6,3.5),(0,0,1.15),5.35),('roof-junction',(3,-5,4),(-.10,-.20,1.98),2.1),('entry-detail',(1,-5,2),(-1.04,-1.0,.77),1.8)]
for name,loc,at,scale in views:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Furniture-redesign.blend'))
(R/'manifest.json').write_text(json.dumps({'concept':'furniture-redesign-concept-v1/concept.png','source':'furniture-exterior-clean-v1','roof':counts,'gameApplied':False,'sha256':hashlib.sha256((R/'Furniture-clean.glb').read_bytes()).hexdigest()},indent=2))
