"""Bank safe: native matte geometry from the user's room reference."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,extrude,disk,stroke
bpy.ops.wm.read_factory_settings(use_empty=True)
body=material('Warm_Bronze_Steel',(.265,.225,.165),.76)
door=material('Door_Bronze_Steel',(.225,.185,.13),.77)
gold=material('Muted_Brass',(.57,.34,.095),.48)
shadow=material('Door_Recess',(.07,.055,.034),.85)
for m,metal in [(body,.38),(door,.32),(gold,.65)]:m.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value=metal

def outline(w,h,top,bottom,z=0):
 pts=[]
 for cx,cz,r,start in [(w/2-bottom,z+bottom,bottom,-90),(w/2-top,z+h-top,top,0),(-w/2+top,z+h-top,top,90),(-w/2+bottom,z+bottom,bottom,180)]:
  for i in range(17):
   a=math.radians(start+90*i/16);pts.append((cx+r*math.cos(a),cz+r*math.sin(a)))
 return pts

def plate(name,w,h,top,bottom,z,yf,yb,mat,bevel=.009):
 o=extrude(name,outline(w,h,top,bottom,z),yf,yb,mat,bevel)
 # Keep broad faces planar while smoothing the rounded perimeter.
 for p in o.data.polygons:
  p.use_smooth=abs(p.normal.y)<.9
 return o
plate('Safe_Body',1.10,1.43,.235,.055,.025,-.34,.34,body,.025)
plate('Door_Shadow_Seam',.932,1.236,.145,.035,.080,-.371,-.338,shadow,.008)
plate('Inset_Door',.895,1.198,.133,.035,.098,-.393,-.363,door,.011)
# Narrow raised brass-bronze rim follows the door exactly.
pts=[(x,-.401,z) for x,z in outline(.822,1.12,.113,.027,.136)]
stroke('Door_Trim',pts+[pts[0]],.008,gold)
# Four-spoke turning wheel with a recessed central mount.
disk('Wheel_Mount',-.015,-.413,.718,.088,.028,body)
disk('Wheel_Axle',-.015,-.465,.718,.043,.09,gold)
bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=12,location=(-.015,-.510,.718),rotation=(math.pi/2,0,0),major_radius=.153,minor_radius=.016)
o=bpy.context.object;o.name='Brass_Handwheel';o.data.materials.append(gold)
for p in o.data.polygons:p.use_smooth=True
for i in range(4):
 a=i*math.pi/2
 stroke('Wheel_Spoke', [(-.015,-.510,.718),(-.015+.147*math.cos(a),-.510,.718+.147*math.sin(a))],.012,gold)
disk('Wheel_Center',-.015,-.526,.718,.040,.035,gold)
disk('Keyhole_Plate',-.325,-.410,.72,.035,.015,gold)
box('Keyhole',(.008,.005,.017),(-.325,-.422,.718),shadow,.003)
# Two right-side hinges, each with a vertical brass pin and mounting straps.
for z in [.30,1.10]:
 for x in [.397,.476]:box('Hinge_Strap',(.105,.038,.047),(x,-.405,z),gold,.009)
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.029,depth=.185,location=(.45,-.423,z))
 o=bpy.context.object;o.name='Hinge_Pin';o.data.materials.append(gold)
 mod=o.modifiers.new('Rounded_Pin','BEVEL');mod.width=.008;mod.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=abs(p.normal.z)<.9
for x,z in [(-.335,.211),(.335,.211),(-.335,1.18),(0,1.21),(.335,1.18)]:disk('Door_Rivet',x,-.407,z,.012,.012,gold)
box('Low_Plinth',(1.12,.70,.072),(0,0,.036),body,.016)
asset=list(bpy.context.scene.objects)
# Convert curves before export so the editable file contains the same geometry.
for o in asset:
 if o.type=='CURVE':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-safe.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-safe.blend'))
tri=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
box('Preview_Ground',(200,200,.02),(0,0,-.017),material('Ground',(.65,.65,.65)),.001)
for loc,power,size in [((-3,-4,5),450,4),((3,1,4),250,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=2.12
scene.render.resolution_x=1100;scene.render.resolution_y=1100
for name,loc in [('front-right',(3,-6,3)),('front',(0,-6,1.8))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,.73))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
(ROOT/'report.json').write_text(json.dumps({'triangles':tri,'bytes':(ROOT/'Bank-safe.glb').stat().st_size,'textures':0,'status':'model only; no opening animation or game integration'},indent=2),encoding='utf-8')
