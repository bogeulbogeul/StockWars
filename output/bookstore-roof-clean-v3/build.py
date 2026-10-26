"""Close bookstore cross-gable seams for aerial views, retaining its design."""
import bpy,bmesh,sys,math,json,hashlib,importlib.util
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import extrude,finish
spec=importlib.util.spec_from_file_location('book_roof_helpers',R.parent/'bank-redesign-v2/roof.py')
g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'bookstore-roof-pitched-v2/Bookstore-clean.blend'))
s=bpy.context.scene;mat=bpy.data.materials['Bookstore_Plum_Tiles']
retire=('Pitched_Roof_','Smooth_Plum_Tile_','Main_Ridge_Cap','Wing_Ridge_Cap')
def signature(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
before={o.name:signature(o) for o in s.objects if o.type=='MESH' and not o.name.startswith(retire)}
for o in list(s.objects):
 if o.name.startswith(retire):bpy.data.objects.remove(o,do_unlink=True)
cx=-.94;yc=.015
def main(x):return 2.47-.95*(x-cx)
def wing(y):return 2.035-.30*abs(y-yc)
def seam(y):return cx+(2.47-wing(y))/.95
surfaces=[('Main_Left',lambda x,y:2.47+.95*(x-cx),[lambda x,y:cx-x]),
 ('Main_Right_Front',lambda x,y:main(x),[lambda x,y:x-cx,lambda x,y:yc-y,lambda x,y:seam(y)-x]),
 ('Main_Right_Rear',lambda x,y:main(x),[lambda x,y:x-cx,lambda x,y:y-yc,lambda x,y:seam(y)-x]),
 ('Wing_Front',lambda x,y:wing(y),[lambda x,y:yc-y,lambda x,y:x-seam(y)]),
 ('Wing_Rear',lambda x,y:wing(y),[lambda x,y:y-yc,lambda x,y:x-seam(y)])]
rect=[(-1.73,-1.03),(1.73,-1.03),(1.73,1.06),(-1.73,1.06)];tiles=0
for name,h,limits in surfaces:
 p=rect[:]
 for fn in limits:p=g.clip(p,fn)
 g.solid('Clean_Pitched_Roof_'+name,p,h,mat,.070,0,.002)
 for i in range(22):
  for j in range(8):
   x=-1.73+i*3.46/22;y=-1.03+j*2.09/8
   p=[(x+.002,y+.002),(x+3.46/22-.002,y+.002),(x+3.46/22-.002,y+2.09/8-.002),(x+.002,y+2.09/8-.002)]
   for fn in limits:p=g.clip(p,fn)
   if name.startswith('Main_Right'):p=g.clip(p,lambda x,y:seam(y)-x-.003)
   if name.startswith('Wing'):p=g.clip(p,lambda x,y:x-seam(y)-.003)
   if g.solid('Clean_Plum_Tile_'+name,p,h,mat,.035,.024,.005):tiles+=1
# One continuous closed shallow valley with a shared centre line. Its top
# follows both planes; there is no open split through which the gable can show.
for a,b in [(-1.035,yc),(yc,1.065)]:
 verts=[]
 for depth in (0,.035):
  for y in (a,b):
   for dx in (-.018,0,.018):
    x=seam(y)+dx;h=main(x) if dx<0 else wing(y)
    verts.append((x,y,h+.015-depth))
 faces=[(0,1,4,3),(1,2,5,4),(6,9,10,7),(7,10,11,8),(0,3,9,6),(2,8,11,5),(0,6,7,1),(1,7,8,2),(3,4,10,9),(4,5,11,10)]
 mesh=bpy.data.meshes.new('Closed_Valley');mesh.from_pydata(verts,[],faces)
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 o=bpy.data.objects.new('Clean_Closed_Plum_Valley',mesh);s.collection.objects.link(o);finish(o,mat,.001)
def cap(name,r,h,z,a,b,rotate=False):
 p=[(r*math.cos(math.pi*i/64),z+h*math.sin(math.pi*i/64)) for i in range(65)]
 o=extrude(name,p,a,b,mat,.002)
 for f in o.data.polygons:f.use_smooth=abs(f.normal.y)<.99
 o.data.normals_split_custom_set([(0,0,0)]*len(o.data.loops))
 if rotate:o.rotation_euler.z=math.pi/2;o.location.y=yc
 else:o.location.x=cx
for i in range(8):cap('Clean_Main_Ridge',.060,.09,2.45,-1.04+i*2.11/8+.0005,-1.04+(i+1)*2.11/8-.0005)
start=seam(yc)+.006;end=1.74
for i in range(8):
 a=start+(end-start)*i/8;b=start+(end-start)*(i+1)/8;cap('Clean_Wing_Ridge',.058,.085,2.013,-b+.0005,-a-.0005,True)
assert all(signature(bpy.data.objects[n])==h for n,h in before.items())
bpy.ops.object.select_all(action='DESELECT')
for o in s.objects:
 if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith(('Preview_','Studio_')):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'Bookstore-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(-.10,-.08,1.15),4.7),('top-view',(0,0,15),(0,0,1.2),4.25),('roof-junction',(3,-5,4),(.03,-.2,2.02),1.65),('rear',(4,6,3.5),(-.10,-.08,1.15),4.7)]:
 c.data.type='ORTHO';c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler()
 s.render.resolution_x=1400 if name=='top-view' else 1200;s.render.resolution_y=1400 if name=='top-view' else 1000
 s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'Bookstore-clean-aerial-roof.blend'))
(R/'manifest.json').write_text(json.dumps({'source':'bookstore-roof-pitched-v2','tiles':tiles,'closedValleys':2,'mainRidgeCaps':8,'wingRidgeCaps':8,'unchangedMeshes':len(before),'gameApplied':False,'sha256':hashlib.sha256((R/'Bookstore-clean.glb').read_bytes()).hexdigest()},indent=2))

