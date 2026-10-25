"""Native rounded sage tiles and ridge caps; preserve the adopted office."""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-redesign-v2/Information-redesign.blend'))
s=bpy.context.scene
def digest(o):
 return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
def target(o):return o.name.startswith(('Main_Sage_Clay_Tile','Porch_Sage_Clay_Tile','Main_Ridge_Cap','Porch_Ridge_Cap'))
preserved={o.name:digest(o) for o in s.objects if o.type=='MESH' and not target(o)}
green=bpy.data.materials['Office_Sage_Roof']
for o in list(s.objects):
 if target(o):bpy.data.objects.remove(o,do_unlink=True)
counts={}
for prefix,w,eave,peak,ya,yb,rows,cols,radius,height,thick,bevel in [
 ('Main',1.68,1.51,2.24,-1.06,1.06,8,9,.085,.120,.043,.011),
 ('Porch',.72,1.39,1.96,-1.29,-.89,4,3,.060,.085,.034,.009)]:
 slope=(peak-eave)/w
 for side in (-1,1):
  normal=Vector((side*slope,0,1)).normalized()
  for row in range(rows):
   x=side*(row+.5)*w/rows
   for col in range(cols):
    y=ya+(col+.5)*(yb-ya)/cols
    center=Vector((x,y,peak-slope*abs(x)))+normal*.006
    tile=box(prefix+'_Sage_Clay_Tile',((w/rows-.005)*math.sqrt(1+slope*slope),(yb-ya)/cols-.004,thick),center,green,bevel)
    tile.rotation_euler.y=side*math.atan(slope)
 def cap(name,r,h,base,a,b):
  p=[(r*math.cos(math.pi*i/64),base+h*math.sin(math.pi*i/64)) for i in range(65)]
  o=extrude(prefix+name,p,a,b,green,.002)
  for face in o.data.polygons:face.use_smooth=abs(face.normal.y)<.99
  o.data.normals_split_custom_set([(0,0,0)]*len(o.data.loops))
 start=ya-.012;step=(yb-ya+.024)/cols;base=peak-.036 if prefix=='Main' else peak-.025
 for i in range(cols):cap('_Ridge_Cap',radius,height,base,start+i*step+.0005,start+(i+1)*step-.0005)
 for i in range(cols+1):
  y=start+i*step
  cap('_Ridge_Rounded_Overlap_Band',radius+.006,height+.008,base-.004,y-.010,y+.010)
 counts[prefix]={'tiles':rows*cols*2,'caps':cols,'bands':cols+1,'thickness':thick}
bpy.context.view_layer.update()
assert all(digest(bpy.data.objects[n])==h for n,h in preserved.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
for o in asset:
 if o.type=='MESH':assert all(math.isfinite(c) for v in o.data.vertices for c in v.co)
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'Information-clean.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=32;s.render.resolution_x=1200;s.render.resolution_y=1000;s.render.resolution_percentage=100
c=s.camera;c.data.type='ORTHO'
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.1,1.1),4.5),('roof-detail',(3,-5,3.8),(0,-.05,2.12),3.65),('ridge-detail',(1,-3,2.9),(0,-.50,2.25),1.45),('porch-detail',(2,-5,2.9),(0,-1.07,1.87),1.75),('rear',(4,6,3.5),(0,0,1.1),4.5)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Information-crafted-roof.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'source':'information-redesign-v2','roof':counts,'unchangedMeshes':len(preserved),'gameApplied':False,'sha256':hashlib.sha256((ROOT/'Information-clean.glb').read_bytes()).hexdigest()},indent=2))
