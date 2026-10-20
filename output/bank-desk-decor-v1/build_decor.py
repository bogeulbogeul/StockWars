"""Bank desktop props: leather mat, pen holder, quill, bell and paper tray."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import material,box,stroke,finish
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'bank-interior-gold-sign-v1'/'Bank-gold-sign-room-preview.blend'))
before=set(bpy.context.scene.objects)
wood=material('Desktop_Walnut',(.20,.085,.025))
leather=material('Desktop_Cognac_Mat',(.29,.115,.052),.70)
gold=material('Desktop_Brass',(.72,.43,.10),.35)
paper=material('Desktop_Ivory_Paper',(.88,.83,.69))
ink=material('Desktop_Ink',(.15,.12,.08))
Z=.790
box('Desk_Leather_Mat', (1.10,.45,.012),(-.12,.28,Z+.006),leather,.018)
# Fine inset perimeter stitching, kept flat on the mat.
pts=[]
for cx,cy,start in [(.395,.475,0),(-.635,.475,90),(-.635,.085,180),(.395,.085,270)]:
 for i in range(13):
  t=math.radians(start+i*90/12);pts.append((cx+.018*math.cos(t),cy+.018*math.sin(t),Z+.013))
pts.append(pts[0]);stroke('Mat_Stitch_Border',pts,.0014,gold)
# Hollow pen holder: four thin walls around a visible dark well.
px,py=-1.10,.38
box('Pen_Holder_Base',(.23,.20,.025),(px,py,Z+.0125),wood,.01)
for dx in [-.10,.10]:box('Pen_Holder_Side',(.025,.18,.17),(px+dx,py,Z+.10),wood,.008)
for dy in [-.08,.08]:box('Pen_Holder_FrontBack',(.20,.025,.17),(px,py+dy,Z+.10),wood,.008)
box('Pen_Holder_Brass_Badge',(.055,.008,.035),(px,py-.094,Z+.085),gold,.006)
for i in [-1,1]:
 stroke('Desktop_Pen',[(px+i*.045,py,Z+.05),(px+i*.060,py+.015,Z+.32)],.008,ink)
 stroke('Desktop_Pen_Gold_Tip',[(px+i*.060,py+.015,Z+.30),(px+i*.061,py+.016,Z+.325)],.008,gold)
# Quill: gently curved ivory vane with central shaft, not a flat billboard.
stroke('Quill_Shaft',[(px,py,Z+.04),(px-.02,py+.015,Z+.24),(px-.07,py+.02,Z+.43)],.004,gold)
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=(px-.05,py+.02,Z+.34))
o=bpy.context.object;o.name='Quill_Ivory_Feather';o.scale=(.025,.009,.115);o.rotation_euler.y=-.30;o.data.materials.append(paper)
for f in o.data.polygons:f.use_smooth=True
# Turned brass bell with a smooth dome and connected plunger.
def cyl(name,r,h,loc,mat):
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=h,location=loc)
 o=bpy.context.object;o.name=name;return finish(o,mat,.004)
bx,by=.68,.30
cyl('Bell_Base',.105,.018,(bx,by,Z+.009),gold)
# Hemisphere mesh closes into the bell base.
verts=[];faces=[]
for j in range(17):
 t=math.pi/2*j/16
 for i in range(64):
  a=2*math.pi*i/64;verts.append((bx+.086*math.cos(t)*math.cos(a),by+.086*math.cos(t)*math.sin(a),Z+.022+.075*math.sin(t)))
for j in range(16):
 for i in range(64):
  a=j*64+i;b=j*64+(i+1)%64;faces.append((a,b,b+64,a+64))
mesh=bpy.data.meshes.new('Bell_Dome');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Bell_Brass_Dome',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(gold)
for f in mesh.polygons:f.use_smooth=True
cyl('Bell_Plunger',.018,.025,(bx,by,Z+.105),gold)
cyl('Bell_Button',.029,.014,(bx,by,Z+.123),gold)
# Open wooden tray with a stack of paper and subtle writing lines.
tx,ty=1.17,.38
box('Document_Tray_Base',(.43,.38,.025),(tx,ty,Z+.0125),wood,.012)
for dx in [-.20,.20]:box('Document_Tray_Side',(.025,.36,.065),(tx+dx,ty,Z+.045),wood,.006)
box('Document_Tray_Back',(.40,.025,.065),(tx,ty+.17,Z+.045),wood,.006)
for j in range(4):box('Document_Paper',(.33,.28,.004),(tx,ty,Z+.030+j*.005),paper,.002)
for j in range(5):box('Paper_Writing_Line',(.19-j%2*.04,.002,.001),(tx-.025,ty+.085-j*.028,Z+.048),ink,0)
asset=list(set(bpy.context.scene.objects)-before)
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-desk-decor.glb'),export_format='GLB',use_selection=True)
for o in bpy.context.scene.objects:o.select_set(o.type in {'MESH','CURVE'})
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Bank-decor-room-preview.glb'),export_format='GLB',use_selection=True)
scene=bpy.context.scene;scene.render.filepath=str(ROOT/'room.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Bank-decor-room-preview.blend'))
cam=scene.camera;target=Vector((0,.35,.87));cam.location=target+Vector((1,-5,3.5))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.65
scene.render.resolution_x=1400;scene.render.resolution_y=950
scene.render.filepath=str(ROOT/'desktop-close.png');bpy.ops.render.render(write_still=True)
(ROOT/'manifest.json').write_text(json.dumps({'status':'desktop prop models and bank placement preview; game integration pending','props':['leather desk mat','hollow pen holder with pens and quill','brass service bell','open wooden document tray with papers'],'desk_top_z':Z,'interaction':'decorative meshes only, bell and documents not wired'},indent=2),encoding='utf-8')
