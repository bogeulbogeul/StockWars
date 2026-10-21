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
 top=[(-.35+.73*i/48,.68+.39*((i/48)**2*(3-2*i/48))) for i in range(49)]
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
  top=.68+.39*t*t*(3-2*t)-.065
  new.append(box('Side_Inset_Wood_Panel',(.012,.145,top-.385),
                 (side*.923,y,(top+.385)/2),wood,.008))
 # Smooth wooden scroll at the front outer face, seated against the arm end.
 bpy.ops.mesh.primitive_cylinder_add(vertices=128,radius=.045,depth=.012,
     location=(side*.906,-.345,.680),rotation=(0,math.pi/2,0))
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
# Remove the old projecting header and tall square end posts.
for obj in list(added):
 if obj.type=='MESH' and obj.name.startswith(('Wood_Back_Top_Rail','Sofa_Back_Post')):
  added.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
# Continuous rounded crown: the straight back sweeps through both rear corners
# into the side arms instead of finishing in a projecting square cap.
rail=[]
# Left front to left rear, rising smoothly to the back crown.
for i in range(65):
 t=i/64
 rail.append((-.86,-.35+.63*t,.68+.39*(t*t*(3-2*t))))
# Round rear corners in plan and avoid a sharp butt joint at either end.
for i in range(1,25):
 a=math.pi-math.pi/2*i/24
 rail.append((-.76+.10*math.cos(a),.28+.10*math.sin(a),1.07))
rail.append((.76,.38,1.07))
for i in range(1,25):
 a=math.pi/2-math.pi/2*i/24
 rail.append((.76+.10*math.cos(a),.28+.10*math.sin(a),1.07))
for i in range(1,65):
 t=1-i/64
 rail.append((.86,-.35+.63*t,.68+.39*(t*t*(3-2*t))))
# Replace previous side rails with the complete continuous crown.
for obj in list(new):
 if obj.name.startswith('Swept_Rounded_Arm_Rail'):
  new.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
new.append(stroke('Continuous_Back_To_Arm_Wood_Rim',rail,.050,wood))
# Remove applied panel blocks and the four separate feet.
for collection in [added,new]:
 for obj in list(collection):
  if obj.type=='MESH' and obj.name.startswith(('Side_Inset_Wood_Panel','Back_Inset_Wood_Panel','Sofa_Foot')):
   collection.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
# A closed plinth replaces the open-legged underside.
# Thick lower front plinth removed; retain only the thin seat board.
# Shallow actual cuts, not raised rectangular panel outlines.
side_panels=[o for o in new if o.name.startswith('Closed_Curved_Wood_Side')]
back_panel=next(o for o in added if o.name.startswith('Wood_Back_Frame'))
def groove(target,tool):
 bpy.context.view_layer.objects.active=target
 mod=target.modifiers.new('Recessed_Wood_Grain_Groove','BOOLEAN')
 mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=tool
 bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.data.objects.remove(tool,do_unlink=True)
# Recess the rolled arm-end motif instead of sticking a spiral onto the face.
for curve in list(new):
 if curve.name.startswith('Classic_Arm_Scroll_Carving'):
  side=1 if curve.data.splines[0].points[0].co.x>0 else -1
  disc=next(o for o in new if o.name.startswith('Classic_Arm_Scroll_Disc') and o.location.x*side>0)
  for spline in curve.data.splines:
   for pnt in spline.points:pnt.co.x=side*.910
  curve.data.bevel_depth=.0025
  bpy.ops.object.select_all(action='DESELECT');curve.select_set(True);bpy.context.view_layer.objects.active=curve
  bpy.ops.object.convert(target='MESH')
  cutter=bpy.context.object
  new.remove(curve)
  groove(disc,cutter)
# Side grain is cut after the continuous side skin is joined below.
for j in range(11):
 x=-.75+j*.15
 tool=box('Back_Groove_Cutter',(.006,.012,.58),(x,.280,.79),wood,.002)
 groove(back_panel,tool)
# Rounded scroll rims and groove lips replace the hard-edged stamped disc.
# User meant the outward step at the side/base joint, not a horizontal arm.
# Match side wall, seat foundation and closed plinth outer planes at x=+/-.92.
base_obj=next(o for o in added if o.name.startswith('Sofa_Wood_Seat_Base'))
base_obj.scale.x*=1.84/1.94
for obj in new:
 if obj.type=='CURVE':
  obj.data.bevel_resolution=8
 if obj.type=='MESH' and obj.name.startswith('Classic_Arm_Scroll_Disc'):
  bpy.context.view_layer.objects.active=obj
  mod=obj.modifiers.new('Soft_Scroll_Rim_And_Engraving','BEVEL')
  mod.width=.0025;mod.segments=6;mod.limit_method='ANGLE';mod.angle_limit=.55
  bpy.ops.object.modifier_apply(modifier=mod.name)
  for face in obj.data.polygons:face.use_smooth=True
for obj in new:obj.parent=root;added.add(obj)
# Weld the coplanar side/base surfaces so no dark overlapping strip remains.
bpy.context.view_layer.update()
bpy.context.view_layer.objects.active=base_obj
for tool in side_panels:
 mod=base_obj.modifiers.new('Flush_Side_Base_Union','BOOLEAN')
 mod.operation='UNION';mod.solver='EXACT';mod.object=tool
 bpy.ops.object.modifier_apply(modifier=mod.name)
 added.remove(tool);bpy.data.objects.remove(tool,do_unlink=True)
# Continuous side skin covers the recessed horizontal joint, from floor to arm.
for side in [-1,1]:
 top=[(-.35+.73*i/64,.68+.39*((i/64)**2*(3-2*i/64))) for i in range(65)]
 skin=extrude('Continuous_Full_Height_Side',[(-.35,0),(.38,0)]+[(y,z-.020) for y,z in reversed(top)],-.065,.065,wood,.028)
 skin.rotation_euler.z=math.pi/2;skin.location.x=side*.86;skin.parent=root
 bpy.context.view_layer.objects.active=base_obj
 mod=base_obj.modifiers.new('Unbroken_Side_Surface','BOOLEAN')
 mod.operation='UNION';mod.solver='EXACT';mod.object=skin
 bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.data.objects.remove(skin,do_unlink=True)
 # Identical narrow shallow grooves span both the old upper and lower sections.
 for j in range(5):
  y=-.25+j*.125;t=(y+.35)/.73
  top_z=.68+.39*t*t*(3-2*t)-.055
  tool=box('Full_Height_Grain_Cutter',(.012,.006,top_z-.025),(side*.925,y,(top_z+.025)/2),wood,.002)
  groove(base_obj,tool)
# Replace round rods and added scroll caps with a squared edge band.
for obj in list(added):
 if obj.name.startswith(('Continuous_Back_To_Arm_Wood_Rim','Smooth_Rolled_Arm_End','Classic_Arm_Scroll_Disc')):
  added.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
# Form the upper edge directly from the side body, avoiding overlaid faces.
# No separate rim solids means no coplanar black strips at front or rear.
# Add matching shallow grain cuts to the inner faces of both side walls.
for side in [-1,1]:
 for j in range(5):
  y=-.25+j*.125;t=(y+.35)/.73
  top_z=.68+.39*t*t*(3-2*t)-.055
  tool=box('Inner_Side_Grain_Cutter',(.012,.006,top_z-.08),
           (side*.795,y,(top_z+.08)/2),wood,.002)
  groove(base_obj,tool)
# One continuous solid rim: no separate end of the back board pokes through.
back_board=next(o for o in added if o.name.startswith('Wood_Back_Frame'))
for v in back_board.data.vertices:
 world=back_board.matrix_world@v.co
 if world.z>1.045:
  world.z=1.045;v.co=back_board.matrix_world.inverted()@world
path=[]
for i in range(65):
 t=i/64;path.append((-.86,-.35+.63*t,.701+.39*t*t*(3-2*t)))
for i in range(1,25):
 a=math.pi-math.pi/2*i/24
 path.append((-.76+.10*math.cos(a),.28+.10*math.sin(a),1.091))
path.append((.76,.38,1.091))
for i in range(1,25):
 a=math.pi/2-math.pi/2*i/24
 path.append((.76+.10*math.cos(a),.28+.10*math.sin(a),1.091))
for i in range(1,65):
 t=1-i/64;path.append((.86,-.35+.63*t,.701+.39*t*t*(3-2*t)))
path[0]=(path[0][0],path[0][1]-.003,path[0][2])
path[-1]=(path[-1][0],path[-1][1]-.003,path[-1][2])
verts=[];faces=[]
for i,p in enumerate(path):
 prev=Vector(path[max(0,i-1)]);nxt=Vector(path[min(len(path)-1,i+1)])
 tangent=nxt-prev;n=Vector((-tangent.y,tangent.x,0)).normalized()*.0665
 for sign,z in [(-1,p[2]-.060),(1,p[2]-.060),(1,p[2]),(-1,p[2])]:
  verts.append((p[0]+sign*n.x,p[1]+sign*n.y,z))
for i in range(len(path)-1):
 for j in range(4):faces.append((i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j))
faces += [(3,2,1,0),tuple((len(path)-1)*4+j for j in range(4))]
mesh=bpy.data.meshes.new('Continuous_Clean_Rim');mesh.from_pydata(verts,[],faces);mesh.update()
cap=bpy.data.objects.new('Continuous_Clean_Rim',mesh);bpy.context.collection.objects.link(cap);cap.data.materials.append(wood)
bpy.context.view_layer.objects.active=cap
mod=cap.modifiers.new('Soft_Continuous_Rim_Edge','BEVEL');mod.width=.009;mod.segments=5
bpy.ops.object.modifier_apply(modifier=mod.name)
cap.parent=root;added.add(cap)
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



cam.data.ortho_scale=.43
target=Vector((-3.20-.33,-.60-.86,1.08))
# Sofa is rotated 90 degrees in the saved placement, but preview roots are reset.
target=Vector((-.81,.33,1.06));cam.location=target+Vector((2,-4,2.8))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'corner-close.png');bpy.ops.render.render(write_still=True)
