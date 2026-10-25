"""Seal the four structural joins identified in the user's actual model crops."""
import bpy,bmesh,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
sys.path.insert(0,str(ROOT.parent/'cipher-reference-architecture-v20'))
sys.path.append(str(ROOT.parent/'cipher-roof-traced-v17'))
from exterior_geometry import box,extrude
from projection import design,P
from roof import cap
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-sign-seal-v21'/'CipherSecurities-sealed-sign.blend'))
scene=bpy.context.scene;cream=bpy.data.materials['Trim_Cream'];blue=bpy.data.materials['Roof_Blue'];d=design()
# Back the entire front triangle up to the blue roof's underside. The original
# recessed triangular field and frame stopped at different sloping heights.
triangle=[(d['left'][0]+.025,d['left'][2]-.010),(d['right'][0]-.025,d['right'][2]-.010),
 (d['peak'][0],d['peak'][2]-.012)]
extrude('Pediment_Closed_Roof_Rebate',triangle,d['front']+.006,d['front']+.105,cream,.003)
# One straight closed fascia per outer wing edge, seated into the roof slabs.
for side in (-1,1):
 box('Wing_Closed_Outer_Eave',(.052,2*P[7]+.008,.072),
  (side*3.13,0,P[8]-.020),blue,.004)
# The diagonal hip caps had high flanges floating above the two roof planes.
# Bury their feet while retaining the original crown height and outer silhouette.
for o in list(scene.objects):
 if o.name.startswith('Wing_Hip'):bpy.data.objects.remove(o,do_unlink=True)
for side,key in [(-1,'ridgeLeft'),(1,'ridgeRight')]:
 ridge=Vector(d[key]);ridge.z-=.016
 for sy in (-1,1):cap('Wing_Hip_Seated',ridge,(side*3.13,sy*P[7],P[8]-.016),blue,.052,.074,.25)
# The two separate bases on either side had bevel valleys at their meeting line.
plinths=[o for o in scene.objects if o.name.startswith('Portico_Column_Plinth')]
center=bpy.data.objects['Cipher_Logo_Navy_Plaque'].matrix_world.translation.x
groups=[[o for o in plinths if (o.location.x<center)==(side<0)] for side in (-1,1)]
for group in groups:
 points=[o.matrix_world@Vector(c) for o in group for c in o.bound_box]
 low=Vector(tuple(min(v[i] for v in points) for i in range(3)))
 high=Vector(tuple(max(v[i] for v in points) for i in range(3)))
 low.z=0
 for o in group:bpy.data.objects.remove(o,do_unlink=True)
 box('Portico_Column_Plinth_Pair',high-low,(low+high)/2,cream,.007)
# The original wing band's lower face was Z=0.016 above the foundation feet.
# Align only the lower vertices of the existing unified solid with the floor;
# its upper molding, overall width/depth and door/step levels stay unchanged.
base=bpy.data.objects['Central_Foundation'];inverse=base.matrix_world.inverted();lowered=0
for vertex in base.data.vertices:
 p=base.matrix_world@vertex.co
 if p.z<.060:p.z=0;vertex.co=inverse@p;lowered+=1
bm=bmesh.new();bm.from_mesh(base.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=1e-7)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(base.data);bm.free()
base.data.update();bpy.context.view_layer.update()
ground=bpy.data.objects['Preview_Ground']
ground.location.z-=max((ground.matrix_world@Vector(c)).z for c in ground.bound_box)
# Check actual penetration depths and retained column/mark identities.
assert lowered>0
assert abs(min((base.matrix_world@v.co).z for v in base.data.vertices))<1e-6
assert all(bpy.data.objects.get(n) for n in ('Clock_Hour','Clock_Minute','Door_Assembly'))
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Preview_','Studio_')):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-clock.glb'),export_format='GLB',use_selection=True,
 export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
scene.cycles.samples=32;scene.render.filepath=str(ROOT/'front-right.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-sealed-junctions.blend'))
scene.render.resolution_x=1000;scene.render.resolution_y=760;scene.cycles.samples=24
cam=scene.camera;cam.data.type='ORTHO'
views=[('gable-detail',(1,-7,2.9),(.37,-2.13,2.24),2.85),
 ('right-eave-detail',(6,-4,3.3),(3.11,.55,1.59),2.5),
 ('plinth-detail',(1,-6,1.15),(.7,-1.92,.40),2.9),
 ('foundation-detail',(5,-5,1.0),(2.20,-1.53,.15),2.8)]
for name,loc,target,scale in views:
 cam.location=loc;cam.data.ortho_scale=scale
 cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'source':'cipher-sign-seal-v21','loweredFoundationVertices':lowered,
 'foundationContactPlane':0,'pairedPlinths':2,'gableRebate':True,'closedOuterEaves':2,
 'markUnchanged':True,'gameApplied':False,
 'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest()},indent=2))
