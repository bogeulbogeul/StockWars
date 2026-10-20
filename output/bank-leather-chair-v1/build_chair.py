"""Tufted cognac leather chair for the bank service desk."""
import bpy,math,sys,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,stroke,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-service-desk-v1'/'Bank-desk-room-preview.blend'))
before=set(bpy.context.scene.objects)
leather=material('Chair_Cognac_Leather',(.35,.135,.048),.56)
wood=material('Chair_Warm_Wood',(.22,.095,.032))
seam=material('Chair_Leather_Seam',(.25,.080,.024),.64)
box('Chair_Seat_Frame',(.73,.65,.08),(0,0,.40),wood,.035)
seat=box('Chair_Soft_Leather_Seat',(.72,.65,.14),(0,-.015,.49),leather,.065)
for poly in seat.data.polygons:poly.use_smooth=True
bpy.context.view_layer.objects.active=seat
mod=seat.modifiers.new('Soft_Seat_Normals','WEIGHTED_NORMAL')
bpy.ops.object.modifier_apply(modifier=mod.name)
for x in [-.27,.27]:
 for y in [-.23,.23]:
  box('Chair_Wood_Leg',(.065,.065,.38),(x,y,.21),wood,.015)
box('Chair_Back_Wood_Frame',(.76,.14,.75),(0,.29,.855),wood,.085)
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
   y+=.041*math.exp(-(dx*dx+dz*dz)/.00065)
   # Four short radiating folds flow into each button without added strips.
   dist=min(abs(dx-dz*.82),abs(dx+dz*.82))
   y+=.009*math.exp(-dist*dist/.000045)*math.exp(-(dx*dx+dz*dz)/.006)
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
(ROOT/'manifest.json').write_text(json.dumps({'status':'model and bank placement preview; gameplay pending','seat_top':.56,'height':1.23,'placement':[0,1.25,.024],'desk_front_clearance':.34,'rear_wall_clearance':1.09,'units':'temporary model units; character reference height 1.0','validation':'static placement only; sitting/contact review pending'},indent=2),encoding='utf-8')
