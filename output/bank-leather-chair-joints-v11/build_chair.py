"""Tufted cognac leather chair for the bank service desk."""
import bpy,math,sys,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box as base_box,stroke,finish

# More bevel samples and smooth weighted normals keep broad faces flat while
# removing visible facets around the leather and timber silhouette.
def box(name,size,loc,mat,bevel=.015):
    obj=base_box(name,size,loc,mat,0)
    bpy.context.view_layer.objects.active=obj
    if bevel:
        mod=obj.modifiers.new('Soft_Rounded_Edges','BEVEL')
        mod.width=bevel;mod.segments=10;mod.harden_normals=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for poly in obj.data.polygons:poly.use_smooth=True
    mod=obj.modifiers.new('Smooth_Weighted_Normals','WEIGHTED_NORMAL')
    mod.keep_sharp=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-service-desk-v1'/'Bank-desk-room-preview.blend'))
before=set(bpy.context.scene.objects)
leather=material('Chair_Cognac_Leather',(.21,.062,.021),.48)
wood=material('Chair_Warm_Wood',(.085,.031,.012))
seam=material('Chair_Leather_Seam',(.25,.080,.024),.64)
box('Chair_Seat_Frame',(.73,.65,.08),(0,0,.40),wood,.035)
seat=box('Chair_Soft_Leather_Seat',(.61,.65,.14),(0,-.015,.49),leather,.065)
for poly in seat.data.polygons:poly.use_smooth=True
bpy.context.view_layer.objects.active=seat
mod=seat.modifiers.new('Soft_Seat_Normals','WEIGHTED_NORMAL')
bpy.ops.object.modifier_apply(modifier=mod.name)
for x in [-.27,.27]:
 for y in [-.23,.23]:
  box('Chair_Wood_Leg',(.065,.065,.38),(x,y,.21),wood,.015)
box('Chair_Back_Wood_Frame',(.79,.18,.78),(0,.29,.855),wood,.12)
# Closed tufted cushion: a single smooth front surface, with real button dimples.
N=64;verts=[];faces=[]
buttons=[(x,z) for x in [-.155,.155] for z in [.79,1.015]]
for j in range(N+1):
 v=j/N;z=.52+.68*v
 edge=min(z-.52,1.20-z);r=.105
 half=.355 if edge>=r else .355-r+math.sqrt(max(0,r*r-(r-edge)**2))
 for i in range(N+1):
  u=i/N;x=(2*u-1)*half
  y=.195-.058*(math.sin(math.pi*u)*math.sin(math.pi*v))**.65
  for bx,bz in buttons:
   dx,dz=x-bx,z-bz
   y+=.029*math.exp(-(dx*dx+dz*dz)/.0010)
   # Four short radiating folds flow into each button without added strips.
   dist=min(abs(dx-dz*.82),abs(dx+dz*.82))
   y+=.004*math.exp(-dist*dist/.00010)*math.exp(-(dx*dx+dz*dz)/.006)
  verts.append((x,y,z))
for j in range(N):
 for i in range(N):
  a=j*(N+1)+i;faces.append((a,a+1,a+N+2,a+N+1))
boundary=list(range(N+1))+[j*(N+1)+N for j in range(1,N+1)]+[N*(N+1)+i for i in range(N-1,-1,-1)]+[j*(N+1) for j in range(N-1,0,-1)]
back=[]
for idx in boundary:
 x,y,z=verts[idx];back.append(len(verts));verts.append((x,.31,z))
for k,a in enumerate(boundary):
 q=(k+1)%len(boundary);faces.append((a,back[k],back[q],boundary[q]))
faces.append(tuple(reversed(back)))
mesh=bpy.data.meshes.new('Tufted_Back_Cushion');mesh.from_pydata(verts,[],faces);mesh.update()
o=bpy.data.objects.new('Chair_Tufted_Leather_Back',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(leather)
for poly in mesh.polygons:poly.use_smooth=len(poly.vertices)==4
for x,z in buttons:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(x,.174,z))
 o=bpy.context.object;o.name='Chair_Leather_Button';o.scale=(.018,.010,.018);o.data.materials.append(leather)
 for poly in o.data.polygons:poly.use_smooth=True
# Tailored leather piping follows the rounded back cushion perimeter.
brass=material('Chair_Aged_Brass',(.49,.29,.075),.38)
piping=material('Chair_Leather_Piping',(.30,.115,.040),.52)
points=[]
for cx,cz,start in [(.245,1.085,0),(-.245,1.085,90),(-.245,.635,180),(.245,.635,270)]:
 for i in range(25):
  t=math.radians(start+i*90/24)
  points.append((cx+.092*math.cos(t),.182,cz+.092*math.sin(t)))
points.append(points[0]);stroke('Chair_Tailored_Back_Piping',points,.0045,piping)
# Modest padded armrests and slender timber supports; clear central sitting width.
for side in [-1,1]:
 x=side*.37
 for y in [-.25,.055]:
  box('Chair_Arm_Support',(.046,.046,.365),(side*.345,y,.5625),wood,.012)
  box('Chair_Arm_Brass_Collar',(.050,.051,.025),(side*.345,y,.722),brass,.005)
 box('Chair_Arm_Timber',(.104,.405,.052),(x,-.095,.742),wood,.018)
 arm=box('Chair_Leather_Arm_Pad',(.12,.410,.070),(x,-.095,.787),leather,.030)
 for poly in arm.data.polygons:poly.use_smooth=True
 for y in [-.23,.23]:
  box('Chair_Brass_Foot',(.068,.068,.065),(side*.27,y,.0525),brass,.012)
# User-selected armchair variant: narrow only the complete back assembly.
for obj in set(bpy.context.scene.objects)-before:
    if ('Back' in obj.name or 'Button' in obj.name):
        obj.location.x*=.90
        obj.scale.x*=.90
# Check actual evaluated vertices: both arm assemblies end before the back front.
def ybounds(obj):
    if obj.type=='MESH':
        return [ (obj.matrix_world @ v.co).y for v in obj.data.vertices ]
    return []
bpy.context.view_layer.update()
backs=[o for o in set(bpy.context.scene.objects)-before if 'Back' in o.name]
arms=[o for o in set(bpy.context.scene.objects)-before if 'Arm_' in o.name or 'Leather_Arm' in o.name]
back_front=min(y for o in backs for y in ybounds(o))
arm_rear=max(y for o in arms for y in ybounds(o))
assert back_front-arm_rear>.015,(back_front,arm_rear)
# Supports penetrate the timber seat frame rather than ending above its side.
frame=next(o for o in set(bpy.context.scene.objects)-before if o.name=='Chair_Seat_Frame')
supports=[o for o in set(bpy.context.scene.objects)-before if o.name.startswith('Chair_Arm_Support')]
bpy.context.view_layer.update()
for support in supports:
    world=[support.matrix_world@v.co for v in support.data.vertices]
    assert min(v.z for v in world)<.40
    assert abs(support.location.x)<.365
# Seat cushion ends at x=+/-.305; supports start at x=+/-.322.
# Check actual vertices rather than the rounded silhouette in a render.
bpy.context.view_layer.update()
seat_obj=next(o for o in set(bpy.context.scene.objects)-before if o.name=='Chair_Soft_Leather_Seat')
seat_half=max(abs((seat_obj.matrix_world@v.co).x) for v in seat_obj.data.vertices)
for support in supports:
    inner=min(abs((support.matrix_world@v.co).x) for v in support.data.vertices)
    assert inner-seat_half>.015,(inner,seat_half)
# Weld the four uprights into the timber seat frame; remove buried faces.
bpy.context.view_layer.objects.active=frame
for support in supports:
    mod=frame.modifiers.new('Weld_Upright_To_Frame','BOOLEAN')
    mod.operation='UNION';mod.solver='EXACT';mod.object=support
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(support,do_unlink=True)
# A small continuous fillet replaces the abrupt intersecting rounded solids.
mod=frame.modifiers.new('Joint_Soft_Fillet','BEVEL')
mod.width=.008;mod.segments=5;mod.limit_method='ANGLE';mod.angle_limit=.65
bpy.ops.object.modifier_apply(modifier=mod.name)
for poly in frame.data.polygons:poly.use_smooth=True
mod=frame.modifiers.new('Unified_Frame_Normals','WEIGHTED_NORMAL')
mod.keep_sharp=True
bpy.ops.object.modifier_apply(modifier=mod.name)
asset=list(set(bpy.context.scene.objects)-before)
bpy.ops.object.select_all(action='DESELECT')
for obj in asset:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-leather-chair.glb'),export_format='GLB',use_selection=True)
for obj in asset:obj.location.y+=1.25;obj.location.z+=.024
for obj in bpy.context.scene.objects:obj.select_set(obj.type in {'MESH','CURVE'})
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-chair-room-preview.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.filepath=str(ROOT/'room.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-chair-room-preview.blend'))
cam=scene.camera;target=Vector((0,1.25,.64));cam.location=(1.8,-2.4,2.0)
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.85
# Hide other meshes only for the isolated detail render.
for obj in before:
 if obj.type in {'MESH','CURVE'}:obj.hide_render=True
scene.render.filepath=str(ROOT/'chair-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'status':'user-selected armchair, back assembly width reduced 10%; gameplay pending','seat_top':.56,'height':1.23,'placement':[0,1.25,.024],'desk_front_clearance':.34,'rear_wall_clearance':1.09,'units':'temporary model units; character reference height 1.0','validation':'static placement only; sitting/contact review pending'},indent=2),encoding='utf-8')
