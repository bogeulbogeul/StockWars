"""Cream and warm timber waiting sofa, no decorative throw pillows."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,stroke,extrude
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-desk-decor-v1'/'Bank-decor-room-preview.blend'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent/'information-waiting-sofa-v1'/'Waiting-sage-sofa.glb'))
added=set(bpy.context.scene.objects)-before
for obj in list(added):
 if 'Pillow' in obj.name:
  added.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
cream=material('Bank_Waiting_Cream_Fabric',(.88,.82,.64),.94)
wood=material('Bank_Waiting_Honey_Wood',(.42,.22,.08))
for obj in added:
 if obj.type=='MESH':
  obj.data.materials.clear();obj.data.materials.append(cream if 'Cushion' in obj.name else wood)
# Replace the divided upholstery and straight open arms with continuous forms.
root=next(o for o in added if o.parent not in added)
for obj in list(added):
 if obj.type=='MESH' and ('Cushion' in obj.name or 'Armrest' in obj.name):
  added.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
def puff(name,size,loc,power=.42):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=40,location=loc)
 obj=bpy.context.object;obj.name=name
 for v in obj.data.vertices:
  v.co=Vector([math.copysign(abs(v.co[i])**power,v.co[i])*size[i]/2 for i in range(3)])
 obj.data.materials.append(cream)
 for p in obj.data.polygons:p.use_smooth=True
 return obj
new=[]
new.append(puff('Continuous_Long_Seat_Cushion',(1.66,.70,.18),(0,-.025,.51)))
new.append(puff('Continuous_Long_Back_Cushion',(1.66,.18,.33),(0,.235,.740),.46))
# Closed side panels meet the seat frame and rear posts.
for side in [-1,1]:
 top=[(-.35+.73*i/48,.68+.16*(i/48)**2-.035*math.sin(math.pi*i/48)) for i in range(49)]
 panel=extrude('Closed_Curved_Wood_Side',[(-.35,.34),(.38,.34)]+list(reversed(top)),-.06,.06,wood,.012)
 panel.rotation_euler.z=math.pi/2;panel.location.x=side*.86
 new.append(panel)
 # Side follows a smooth sagging rail with a rounded rolled front.
 points=[]
 for i in range(49):
  t=i/48;y=-.35+.73*t
  z=.68+.16*t*t-.035*math.sin(math.pi*t)
  points.append((side*.86,y,z))
 new.append(stroke('Swept_Rounded_Arm_Rail',points,.055,wood))
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,radius=.055,location=(side*.86,-.35,.68))
 cap=bpy.context.object;cap.name='Smooth_Rolled_Arm_End';cap.data.materials.append(wood)
 for poly in cap.data.polygons:poly.use_smooth=True
 new.append(cap)
# Classic inset wooden panels echo the reference without throw pillows.
for side in [-1,1]:
 for j in range(4):
  y=-.255+j*.17
  t=(y+.35)/.73
  top=.68+.16*t*t-.035*math.sin(math.pi*t)-.065
  new.append(box('Side_Inset_Wood_Panel',(.012,.145,top-.385),
                 (side*.923,y,(top+.385)/2),wood,.008))
 # Smooth wooden scroll at the front outer face, seated against the arm end.
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.047,depth=.016,
     location=(side*.908,-.345,.680),rotation=(0,math.pi/2,0))
 scroll=bpy.context.object;scroll.name='Classic_Arm_Scroll_Disc';scroll.data.materials.append(wood)
 new.append(scroll)
 points=[]
 for j in range(97):
  t=j/96;a=-math.pi/2+math.pi*2*t;r=.032*(1-.72*t)
  points.append((side*.918,-.345+r*math.cos(a),.680+r*math.sin(a)))
 new.append(stroke('Classic_Arm_Scroll_Carving',points,.0022,wood))
for j in range(9):
 x=-.72+j*.18
 new.append(box('Back_Inset_Wood_Panel',(.157,.018,.50),(x,.268,.815),wood,.008))
for obj in new:obj.parent=root;added.add(obj)
# Soften the existing timber's visible shading while retaining its proportions.
for obj in added:
 if obj.type=='MESH' and 'Cushion' not in obj.name:
  for p in obj.data.polygons:p.use_smooth=True
  bpy.context.view_layer.objects.active=obj
  mod=obj.modifiers.new('Soft_Timber_Normals','WEIGHTED_NORMAL')
  bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.ops.object.select_all(action='DESELECT')
for obj in added:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-waiting-sofa.glb'),export_format='GLB',use_selection=True)
roots=[o for o in added if o.parent not in added]
for obj in roots:
 obj.location=(-3.20,-.60,.024);obj.rotation_euler.z=math.pi/2
for obj in bpy.context.scene.objects:obj.select_set(obj.type in {'MESH','CURVE'} or obj in added)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-waiting-room-preview.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.filepath=str(ROOT/'room.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-waiting-room-preview.blend'))
# Return to local display for standalone preview, without altering saved placement.
for obj in roots:obj.location=(0,0,0);obj.rotation_euler.z=0
for obj in before:
 if obj.type in {'MESH','CURVE'}:obj.hide_render=True
cam=scene.camera;target=Vector((0,0,.56));cam.location=target+Vector((3,-5,2.7))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.65
scene.render.resolution_x=1300;scene.render.resolution_y=1000
scene.render.filepath=str(ROOT/'sofa-close.png');bpy.ops.render.render(write_still=True)
assert not any('Pillow' in obj.name for obj in added)
(ROOT/'manifest.json').write_text(json.dumps({'status':'waiting sofa and bank placement preview; game integration pending','source':'information-waiting-sofa-v1 wooden frame','upholstery':'cream seat and back cushions retained; decorative throw pillows excluded','placement':[-3.20,-.60,.024],'rotation_degrees':90,'validation':'render and no-throw-pillow check; sitting/collision pending'},indent=2),encoding='utf-8')

