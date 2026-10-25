"""Native burgundy gabled pub preserving the adopted facade and fittings."""
import bpy,bmesh,sys,math,json,hashlib,importlib.util
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,finish
spec=importlib.util.spec_from_file_location('pub_cross_gable_geometry',R.parent/'bank-redesign-v2/roof.py')
roof=importlib.util.module_from_spec(spec);spec.loader.exec_module(roof)
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'pub-exterior-clean-v1/Pub-clean.blend'))
s=bpy.context.scene
for o in list(s.objects):
 if o.name.startswith(('Closed_Cream_Gable','Sealed_Burgundy_Roof','Timber_Roof_Edge','Broad_Burgundy_Tile','Entry_Cream_Gable','Sealed_Timber_Gable_Backing','Unified_Gable_Frame','Timber_Fascia')):bpy.data.objects.remove(o,do_unlink=True)
def color(name,c):
 m=bpy.data.materials[name];m.diffuse_color=(*c,1);m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);return m
cream=color('Pub_Cream',(.90,.82,.69));wood=color('Pub_Warm_Timber',(.31,.15,.055));clay=color('Pub_Burgundy',(.24,.035,.052));stone=color('Pub_Smooth_Base',(.84,.76,.64))
color('Pub_Blue_Glass',(.23,.44,.54));color('Door_Glass_Wood_Trim',(.37,.19,.075))
before=set(s.objects);counts=roof.build(clay,wood,cream);new=set(s.objects)-before
transform=Matrix.Translation((0,0,-.0208))@Matrix.Diagonal((1.12,1.08,1.02,1))
for o in new:
 o.matrix_world=transform@o.matrix_world
 o.name=o.name.replace('Gold','Burgundy')
bpy.context.view_layer.update()
# Seat both side gables into the original windowless wall shell.
wall=bpy.data.objects['Smooth_Windowless_Back_Walls']
for o in [o for o in new if o.name.startswith('Main_Cream_Side_Gable')]:
 side=1 if o.matrix_world.translation.x>0 else -1
 # Extruded rotated gables have their world center at +/-1.642.
 pts=[o.matrix_world@Vector(v) for v in o.bound_box]
 side=1 if sum(p.x for p in pts)>0 else -1
 outer=max(abs(p.x) for p in pts);o.location.x+=side*(1.68-outer)
 bpy.context.view_layer.objects.active=wall;m=wall.modifiers.new('Joined_Side_Gable','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=o
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(o,do_unlink=True)
# Existing clean crescent relief, mounted to the new front pediment.
moon=bpy.data.objects['Golden_Crescent'];moon.location.y-=.110
for v in moon.data.vertices:v.co.x*=1.25;v.co.z=1.685+(v.co.z-1.67)*1.25
moon.data.update()
# Solid wall-depth timber strips become individual structural posts.
for o in list(s.objects):
 if o.name.startswith('Timber_Post'):bpy.data.objects.remove(o,do_unlink=True)
for x in (-1.62,-.58,.58,1.62):box('Front_Oak_Post',(.14,.15,1.32),(x,-.98,.82),wood,.012)
for x in (-1.62,1.62):box('Rear_Oak_Post',(.14,.15,1.32),(x,.98,.82),wood,.012)
for o in s.objects:
 if o.name.startswith(('Smooth_Chimney','Chimney_Cap','Chimney_Top')):o.location.y-=.84
# Keep the existing door construction, glass, handles, diamond windows and sign.
for o in s.objects:
 if o.type=='MESH' and o.name.startswith(('Double_Arch_Door','Door_Frame')):
  for v in o.data.vertices:
   p=o.matrix_world@v.co
   if p.z<.25:p.z-=.028*min(1,max(0,(.25-p.z)/.025));v.co=o.matrix_world.inverted()@p
  o.data.update()
# Trim roof tiles and bases against the real chimney instead of burying tiles.
cut=box('Chimney_Roof_Opening',(.302,.312,1.2),(-1,-.35,2.10),clay,.002)
bpy.context.view_layer.update();trimmed=0
for o in list(s.objects):
 if o.type!='MESH' or not o.name.startswith(('Rounded_Burgundy_Tile','Burgundy_Pitched_Roof','Main_Closed_Timber_Soffit')):continue
 pts=[o.matrix_world@Vector(v) for v in o.bound_box]
 if max(p.x for p in pts)<-1.151 or min(p.x for p in pts)>-.849:continue
 if max(p.y for p in pts)<-.506 or min(p.y for p in pts)>-.194:continue
 bpy.context.view_layer.objects.active=o;m=o.modifiers.new('Fitted_Chimney_Cut','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cut
 bpy.ops.object.modifier_apply(modifier=m.name);trimmed+=1
bpy.data.objects.remove(cut,do_unlink=True)
# Sloped closed clay collar embeds into the chimney on all four sides.
outer=[(-1.18,-.53),(-.82,-.53),(-.82,-.17),(-1.18,-.17)]
inner=[(-1.137,-.487),(-.863,-.487),(-.863,-.213),(-1.137,-.213)]
def height(y):return (2.22-roof.MS*abs(y/1.08))*1.02-.0208
v=[(x,y,height(y)+z) for z in (.049,-.016) for poly in (outer,inner) for x,y in poly];f=[]
for i in range(4):
 j=(i+1)%4;f.extend([(i,j,4+j,4+i),(8+i,12+i,12+j,8+j),(i,8+i,8+j,j),(4+i,4+j,12+j,12+i)])
mesh=bpy.data.meshes.new('Fitted_Chimney_Collar');mesh.from_pydata(v,[],f);bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
o=bpy.data.objects.new('Pub_Closed_Chimney_Collar',mesh);bpy.context.collection.objects.link(o);finish(o,clay,.003)
# A single solid porch frame, with the backing fully contained inside its edges.
pediment=bpy.data.objects['Porch_Cream_Pediment']
for v in pediment.data.vertices:v.co.x*=.985
pediment.data.update()
frame=bpy.data.objects['Porch_Continuous_Timber_Frame']
for side in (-1,1):
 cut=box('Hidden_Porch_Timber_Trim',(.20,.8,.8),(side*.913,-1.20,1.45),wood,0)
 bpy.context.view_layer.objects.active=frame;m=frame.modifiers.new('Under_Tile_Outer_Edge','BOOLEAN');m.operation='DIFFERENCE';m.object=cut
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
for o in list(s.objects):
 if o.name.startswith('Front_Horizontal_Timber'):
  o.location.y+=.052
  bpy.context.view_layer.objects.active=frame;m=frame.modifiers.new('Continuous_Porch_Header','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=o
  bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(o,do_unlink=True)
for o in s.objects:
 if o.name.startswith('Burgundy_Pitched_Roof_Porch'):o.scale.x*=.985
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.80,.84,.90,1)
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Pub-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.08,1.18),5.0),('front',(0,-7,2.8),(0,-.08,1.18),5.0),('rear',(4,6,3.5),(0,0,1.18),5.0),('roof-junction',(3,-5,4),(0,-.65,1.97),2.2),('chimney-detail',(-3,-5,4),(-1,.49,2.13),1.15)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Pub-redesign.blend'))
(R/'manifest.json').write_text(json.dumps({'source':'pub-exterior-clean-v1','concept':'pub-redesign-concept-v1/concept.png','roof':counts,'chimneyTrimmedMeshes':trimmed,'gameApplied':False,'sha256':hashlib.sha256((R/'Pub-clean.glb').read_bytes()).hexdigest()},indent=2))
