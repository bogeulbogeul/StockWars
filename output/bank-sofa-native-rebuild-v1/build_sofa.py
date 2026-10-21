"""Clean native bank sofa, rebuilt from proportions of the provided Meshy model."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,finish
bpy.ops.wm.read_factory_settings(use_empty=True)
wood=material('Bank_Honey_Wood',(.43,.25,.12),.84)
cream=material('Bank_Cream_Upholstery',(.82,.76,.64),.89)
grain=material('Bank_Wood_Groove',(.32,.17,.073),.9)
# Shared dimensions drive the sides, crown, panels, and cushions.
W=1.90;D=.74;FRONT=-.37;REAR=.37
SIDE=.865;THICK=.12;SEAT=.37

def smooth_box(name,size,loc,mat,r):
 o=box(name,size,loc,mat,0);bpy.context.view_layer.objects.active=o
 mod=o.modifiers.new('Soft_Bevel','BEVEL');mod.width=r;mod.segments=6
 bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=True
 mod=o.modifiers.new('Surface_Normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
 return o

def puff(name,size,loc):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,location=loc)
 o=bpy.context.object;o.name=name
 for v in o.data.vertices:
  v.co=Vector([math.copysign(abs(v.co[i])**.43,v.co[i])*size[i]/2 for i in range(3)])
 o.data.materials.append(cream)
 for p in o.data.polygons:p.use_smooth=True
 return o

def height(y):
 t=max(0,min(1,(y-FRONT)/(REAR-FRONT)))
 return .67+.33*t*t*(3-2*t)
# Single U-shaped timber body: inner and outer paths share the same crown.
# Rounded plan corners are built into geometry rather than overlaid caps.
path=[]
for i in range(41):
 y=FRONT+(.64)*i/40;path.append((-SIDE,y,height(y)))
for i in range(1,17):
 a=math.pi-math.pi/2*i/16
 path.append((-.765+.10*math.cos(a),.27+.10*math.sin(a),height(REAR)))
for i in range(1,41):path.append((-.765+1.53*i/40,REAR,1.0))
for i in range(1,17):
 a=math.pi/2-math.pi/2*i/16
 path.append((.765+.10*math.cos(a),.27+.10*math.sin(a),height(REAR)))
for i in range(1,41):
 y=.27-.64*i/40;path.append((SIDE,y,height(y)))
# Cross-section rings form a continuous closed wall with a wider crown band.
# Side support bottom reaches the floor; rear bottom meets the thin seat board.
verts=[];faces=[]
for i,(x,y,z) in enumerate(path):
 a=Vector(path[max(0,i-1)]);b=Vector(path[min(len(path)-1,i+1)])
 tangent=b-a;n=Vector((-tangent.y,tangent.x,0)).normalized()
 bottom=.02 if abs(x)>.78 else .31
 # Constant 6cm top band, mild 8mm lip, no coincident faces or separate joints.
 section=[(-.060,bottom),(.060,bottom),(.060,z-.065),(.068,z-.065),(.068,z),(-.068,z),(-.068,z-.065),(-.060,z-.065)]
 for offset,h in section:verts.append((x+n.x*offset,y+n.y*offset,h))
N=8
for i in range(len(path)-1):
 for j in range(N):faces.append((i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j))
faces += [tuple(range(N-1,-1,-1)),tuple((len(path)-1)*N+j for j in range(N))]
mesh=bpy.data.meshes.new('Unified_Timber_Frame');mesh.from_pydata(verts,[],faces);mesh.update()
# Recalculate normals for the swept frame before bevel/export.
import bmesh
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
frame=bpy.data.objects.new('Unified_Timber_Frame',mesh);bpy.context.collection.objects.link(frame);frame.data.materials.append(wood)
bpy.context.view_layer.objects.active=frame
mod=frame.modifiers.new('Frame_Edge_Softening','BEVEL');mod.width=.006;mod.segments=4;mod.limit_method='ANGLE';mod.angle_limit=.65
bpy.ops.object.modifier_apply(modifier=mod.name)
for p in frame.data.polygons:p.use_smooth=True
mod=frame.modifiers.new('Frame_Normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)
smooth_box('Thin_Seat_Timber',(1.68,.72,.070),(0,-.025,.345),wood,.022)
puff('Single_Long_Seat',(1.61,.66,.145),(0,-.038,.444))
puff('Single_Low_Back',(1.59,.16,.295),(0,.235,.659))
# Actual shallow grain cuts, inner/outer side and rear; all end below the crown.
cutters=[]
for side in [-1,1]:
 for y in [-.25,-.10,.05,.20]:
  top=height(y)-.095
  for x in [side*(SIDE-.060),side*(SIDE+.060)]:
   cutters.append(box('Grain_Cutter',(.009,.0045,top-.07),(x,y,(top+.07)/2),wood,.001))
for x in [-.67+i*.134 for i in range(11)]:
 for y in [REAR-.060,REAR+.060]:cutters.append(box('Rear_Grain_Cutter',(.0045,.009,.51),(x,y,.635),wood,.001))
for cutter in cutters:
 bpy.context.view_layer.objects.active=frame
 mod=frame.modifiers.new('Shallow_Wood_Groove','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
 bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
# Rounded scroll tips are integral-looking end details seated within the crown.
for side in [-1,1]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=(side*SIDE,FRONT,.645))
 o=bpy.context.object;o.name='Rounded_Arm_End';o.scale=(.065,.045,.059);o.data.materials.append(wood)
 for p in o.data.polygons:p.use_smooth=True
asset=list(bpy.context.scene.objects)
# Match the source sofa's low, broad silhouette (about 1.90 wide / .70 high).
for obj in asset:
 obj.location.z*=.70
 obj.scale.z*=.70
 bpy.context.view_layer.objects.active=obj
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-sofa-native.glb'),export_format='GLB',use_selection=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-sofa-native.blend'))
tri=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in asset if o.type=='MESH')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.5
smooth_box('Preview_Ground',(200,200,.02),(0,0,-.015),material('Studio_Ground',(.65,.65,.65)),.001)
for loc,power,size in [((-3,-4,6),400,5),((4,1,5),200,4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=2.55
scene.render.resolution_x=1400;scene.render.resolution_y=1000
for name,loc in [('front-right',(3,-5,3)),('front',(0,-5,1.8)),('rear',(3,5,3))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,.35))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
(ROOT/'report.json').write_text(json.dumps({'status':'native rebuild; game integration pending','triangles':tri,'bytes':(ROOT/'Bank-sofa-native.glb').stat().st_size,'reference':'user Meshy Cedar Haven Sofa proportions and visual design','construction':'single swept U timber frame including constant-width crown, separate seat support and cushions','textures':0},indent=2),encoding='utf-8')
