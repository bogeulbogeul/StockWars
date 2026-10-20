"""Rounded ceramic planter with broad leaves and a few trailing vines."""
import bpy,sys,math,json,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,stroke,box
bpy.ops.wm.read_factory_settings(use_empty=True)
ceramic=material('Warm_Ivory_Ceramic',(.65,.56,.40),.86)
soil=material('Dark_Potting_Soil',(.085,.045,.018),.96)
stemmat=material('Soft_Green_Stems',(.16,.22,.045),.86)
leafmats=[material('Leaf_Green_'+str(i),c,.83) for i,c in enumerate([(.21,.32,.065),(.29,.39,.085),(.16,.27,.045),(.34,.42,.095)])]
# Closed lathed profile with an actual recessed opening and inner wall.
profile=[(0,.015),(.13,.015),(.16,.035),(.195,.08),(.218,.15),(.224,.22),(.213,.28),(.187,.335),(.173,.37),(.178,.386),(.17,.399),(.156,.399),(.149,.386),(.155,.365),(.163,.335),(.17,.30),(0,.30)]
v=[];f=[];N=64
for r,z in profile:
 for i in range(N):
  a=2*math.pi*i/N;v.append((r*math.cos(a),r*math.sin(a),z))
for j in range(len(profile)-1):
 for i in range(N):
  a=j*N+i;b=j*N+(i+1)%N;f.append((a,b,b+N,a+N))
m=bpy.data.meshes.new('Ceramic_Pot');m.from_pydata(v,[],f);m.update();o=bpy.data.objects.new('Ceramic_Pot',m);bpy.context.collection.objects.link(o);o.data.materials.append(ceramic)
for p in m.polygons:p.use_smooth=True
bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Smooth_Pot_Profile','SUBSURF');mod.levels=1;bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.165,depth=.014,location=(0,0,.326));o=bpy.context.object;o.name='Recessed_Soil';o.data.materials.append(soil)

def leaf(name,base,az,length,width,rise,mat):
 d=Vector((math.cos(az),math.sin(az),0));side=Vector((-d.y,d.x,0));base=Vector(base)
 verts=[];faces=[];steps=16
 for layer in [-1,1]:
  for i in range(steps+1):
   t=i/steps;center=base+d*(length*t)+Vector((0,0,rise*t+.065*math.sin(math.pi*t)))
   w=width*math.sin(math.pi*t)**.85
   for s in [-1,0,1]:
    p=center+side*(s*w)+Vector((0,0,.014*math.sin(math.pi*t)*(1-abs(s))+layer*.002))
    verts.append(tuple(p))
 count=(steps+1)*3
 for layer in range(2):
  for i in range(steps):
   for j in range(2):
    a=layer*count+i*3+j;face=(a,a+1,a+4,a+3);faces.append(face if layer else face[::-1])
 for i in range(steps):
  for j in [0,2]:
   a=i*3+j;b=(i+1)*3+j;faces.append((a,b,b+count,a+count))
 for i in [0,steps]:
  for j in range(2):
   a=i*3+j;faces.append((a,a+count,a+count+1,a+1))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);mesh.materials.append(mat)
 for p in mesh.polygons:p.use_smooth=True
 return ob
random.seed(8)
for i in range(19):
 a=i*2.39996;ring=i%3;h=[.49,.61,.73][ring];radius=[.07,.045,.02][ring]
 base=(radius*math.cos(a),radius*math.sin(a),h)
 stroke('Leaf_Stem',[(0,0,.332),(base[0]*.5,base[1]*.5,h-.08),base],.005,stemmat)
 length=[.30,.26,.18][ring]+random.uniform(-.025,.025)
 leaf('Broad_Leaf',base,a,length,length*.32,[-.12,-.045,.035][ring],leafmats[i%4])
# Three small vines hang over the ceramic belly, away from the floor.
for k,a in enumerate([-math.pi/2-.7,-math.pi/2+.35,.35]):
 pts=[]
 for j in range(13):
  t=j/12;r=.13+.10*math.sin(math.pi*t*.8)
  pts.append((r*math.cos(a)+.018*math.sin(t*5),r*math.sin(a),.48-.37*t))
 stroke('Trailing_Vine',pts,.0035,stemmat)
 for j in [3,6,9,11]:
  p=pts[j];direction=a+(-1 if j%2 else 1)*.85
  leaf('Trailing_Leaf',p,direction,.085,.032,-.025,leafmats[(j+k)%4])
# Apply a single asset-wide scale only if needed; base geometry targets H~.85.
asset=list(bpy.context.scene.objects)
for ob in asset:
 if ob.type=='CURVE':
  bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.convert(target='MESH')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-potted-plant.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-potted-plant.blend'))
pts=[o.matrix_world@Vector(c) for o in bpy.context.scene.objects if o.type=='MESH' for c in o.bound_box]
size=[max(p[i] for p in pts)-min(p[i] for p in pts) for i in range(3)]
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.55
box('Preview_Ground',(200,200,.02),(0,0,-.003),material('Ground',(.65,.65,.65)),.001)
for loc,power,size_light in [((-3,-4,5),400,4),((3,1,4),220,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size_light;o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(1.4,-3,1.6));cam=bpy.context.object;scene.camera=cam;cam.rotation_euler=(Vector((0,0,.42))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.15
scene.render.resolution_x=1100;scene.render.resolution_y=1100;scene.render.filepath=str(ROOT/'plant.png');bpy.ops.render.render(write_still=True)
# Bring in the exact previous scale-check character, without its room.
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT.parent.parent/'web/assets/characters/3d/somangi/wave.glb'));added=set(bpy.data.objects)-before
scene.frame_set(1);bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();snaps=[]
for ob in added:
 if ob.type!='MESH' or ob.name.startswith('Icosphere'):continue
 ev=ob.evaluated_get(deps);me=bpy.data.meshes.new_from_object(ev,depsgraph=deps);me.transform(ob.matrix_world)
 obj=bpy.data.objects.new('Somangi_Reference',me);scene.collection.objects.link(obj);snaps.append(obj)
for ob in added:bpy.data.objects.remove(ob,do_unlink=True)
bottom=min(v.co.z for o in snaps for v in o.data.vertices)
for o in snaps:
 for v in o.data.vertices:v.co=Vector((v.co.x/1.95+.87,v.co.y/1.95,(v.co.z-bottom)/1.95+.015))
cam.location=(1.4,-4,1.8);cam.rotation_euler=(Vector((.40,0,.47))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=1.95
scene.render.filepath=str(ROOT/'scale.png');bpy.ops.render.render(write_still=True)
(ROOT/'report.json').write_text(json.dumps({'dimensions':size,'somangi_reference':'web/assets/characters/3d/somangi/wave.glb frame 1 at 1/1.95','somangi_body_height':.97425,'height_ratio':size[2]/.97425,'textures':0,'bytes':(ROOT/'Bank-potted-plant.glb').stat().st_size,'status':'standalone model; not yet placed in room'},indent=2),encoding='utf-8')
