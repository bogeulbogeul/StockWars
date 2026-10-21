"""High-back cognac executive swivel chair, reference-inspired model."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,stroke,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-service-desk-v1'/'Bank-desk-room-preview.blend'))
before=set(bpy.context.scene.objects)
leather=material('Executive_Cognac_Leather',(.21,.062,.021),.46)
wood=material('Executive_Dark_Wood',(.085,.031,.012),.48)
metal=material('Executive_Dark_Metal',(.055,.065,.070),.32)
chrome=material('Executive_Column_Metal',(.32,.35,.37),.26)
black=material('Executive_Caster_Rubber',(.018,.021,.023),.75)
def puff(name,size,loc,power=.42,mat=leather):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=40,location=loc)
 o=bpy.context.object;o.name=name
 for v in o.data.vertices:
  v.co=Vector([math.copysign(abs(v.co[i])**power,v.co[i])*size[i]/2 for i in range(3)])
 o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 return o
def cyl(name,r,d,loc,mat,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=d,location=loc,rotation=rot)
 o=bpy.context.object;o.name=name
 finish(o,mat,.005)
 return o
# Continuous upholstered shell with three broad horizontal cushion zones.
puff('Executive_Seat',(.76,.70,.19),(0,-.035,.545),.36)
shell=puff('Executive_High_Back_Shell',(.76,.19,1.04),(0,.265,1.015),.35)
shell.rotation_euler.x=math.radians(-6)
for name,w,h,z,y in [('Lumbar',.65,.32,.755,.147),('Mid_Back',.66,.36,1.065,.177),('Headrest',.69,.27,1.385,.210)]:
 o=puff('Executive_'+name+'_Cushion',(w,.16,h),(0,y,z),.42)
 o.rotation_euler.x=math.radians(-6)
# Broad leather side panels rise into flat padded armrests, joined to seat sides.
for side in [-1,1]:
 puff('Executive_Upholstered_Arm_Side',(.10,.50,.29),(side*.425,.010,.760),.40)
 puff('Executive_Arm_Pad',(.14,.53,.085),(side*.425,-.005,.925),.38)
 # Subtle dark metallic inset; no exposed timber joints.
 box('Executive_Arm_Inset',(.012,.29,.025),(side*.479,.025,.785),metal,.008)
box('Executive_Underseat_Mechanism',(.32,.32,.07),(0,.01,.415),metal,.025)
cyl('Executive_Gas_Lift',.035,.26,(0,0,.285),chrome)
cyl('Executive_Lift_Cover',.055,.13,(0,0,.195),metal)
cyl('Executive_Base_Hub',.080,.08,(0,0,.15),wood)
for i in range(5):
 angle=math.radians(-90+i*72)
 x,y=.24*math.cos(angle),.24*math.sin(angle)
 spoke=box('Executive_Five_Star_Spoke',(.44,.065,.055),(x,y,.135),wood,.022)
 spoke.rotation_euler.z=angle
 ex,ey=.435*math.cos(angle),.435*math.sin(angle)
 cyl('Executive_Caster_Stem',.018,.06,(ex,ey,.10),metal)
 for sign in [-1,1]:
  # Twin rubber wheels with axle perpendicular to the spoke.
  tangent=Vector((-math.sin(angle),math.cos(angle),0))
  center=Vector((ex,ey,.056))+tangent*(sign*.022)
  o=cyl('Executive_Twin_Caster',.042,.025,center,black)
  o.rotation_euler=Vector((0,0,1)).rotation_difference(tangent).to_euler()
# Arm side panel inner plane = .375, seat edge = .380: only a tiny
# concealed installation overlap, instead of a panel sunk into the seat.
# Low side supports meet the underside; they do not cross the cushion face.
for side in [-1,1]:
 box('Executive_Arm_Underseat_Mount',(.085,.22,.025),(side*.395,.025,.475),metal,.007)
 box('Executive_Arm_Lower_Support',(.025,.22,.155),(side*.425,.025,.5525),metal,.009)
# Weld each compact bracket into one continuous mounting piece.
for side in [-1,1]:
    parts=[o for o in set(bpy.context.scene.objects)-before if o.type=='MESH'
           and o.name.startswith(('Executive_Arm_Underseat_Mount','Executive_Arm_Lower_Support'))
           and o.location.x*side>0]
    mount,support=sorted(parts,key=lambda o:o.location.z)
    bpy.context.view_layer.objects.active=mount
    mod=mount.modifiers.new('Unified_Arm_Mount','BOOLEAN')
    mod.operation='UNION';mod.solver='EXACT';mod.object=support
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(support,do_unlink=True)
    for poly in mount.data.polygons:poly.use_smooth=True
    mod=mount.modifiers.new('Mount_Surface_Normals','WEIGHTED_NORMAL')
    bpy.ops.object.modifier_apply(modifier=mod.name)
asset=list(set(bpy.context.scene.objects)-before)
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-executive-chair.glb'),export_format='GLB',use_selection=True)
for o in asset:o.location.y+=1.30;o.location.z+=.024
for o in bpy.context.scene.objects:o.select_set(o.type in {'MESH','CURVE'})
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-executive-room-preview.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.filepath=str(ROOT/'room.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-executive-room-preview.blend'))
for o in before:
 if o.type in {'MESH','CURVE'}:o.hide_render=True
cam=scene.camera;target=Vector((0,1.30,.78));cam.location=target+Vector((2,-3,1.3))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.95
scene.render.resolution_x=1100;scene.render.resolution_y=1300
scene.render.filepath=str(ROOT/'chair-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'status':'reference-inspired executive chair model; gameplay pending','features':['cognac leather','high back with three cushion zones','upholstered arm sides','gas lift','five-star base','twin casters'],'placement':[0,1.30,.024],'validation':'render inspection; character seating and wheel collision pending'},indent=2),encoding='utf-8')
