"""Replace post-office curved roofing with a straight terracotta gable."""
import bpy,bmesh,sys,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
R=Path(__file__).resolve().parent
sys.path.insert(0,str(R.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'post-office-exterior-v1/PostOffice.blend'))
s=bpy.context.scene
def sig(o):return hashlib.sha256(repr([tuple(o.matrix_world@v.co) for v in o.data.vertices]).encode()).hexdigest()
changed=('Sealed_Curved_Roof','Continuous_Curved_Timber_Edge','Cream_Gable','Rounded_Terracotta_Tile','Sign_','Envelope_','Front_Continuous_Beam')
before={o.name:sig(o) for o in s.objects if o.type=='MESH' and not o.name.startswith(changed)}
for o in list(s.objects):
 if o.name.startswith(changed[:4]):bpy.data.objects.remove(o,do_unlink=True)
clay=bpy.data.materials['Post_Terracotta_Tiles'];wood=bpy.data.materials['Post_Honey_Timber'];cream=bpy.data.materials['Post_Cream_Plaster']
half=1.72;peak=2.44;slope=.72/half
def height(x):return peak-slope*abs(x)
for side in (-1,1):
 a,b=sorted((0,side*half))
 extrude('Straight_Terracotta_Roof',[(a,height(a)),(b,height(b)),(b,height(b)-.07),(a,height(a)-.07)],-1.04,1.04,clay,.004)
 normal=Vector((side*slope,0,1)).normalized()
 for row in range(8):
  x=side*(row+.5)*half/8
  for col in range(8):
   y=-1.04+(col+.5)*2.08/8
   o=box('Rounded_Pitched_Terracotta_Tile',((half/8-.004)*math.sqrt(1+slope*slope),2.08/8-.004,.048),Vector((x,y,height(x)))+normal*.008,clay,.012)
   o.rotation_euler.y=side*math.atan(slope)
for y in (-1.04,1.04):
 p=[(-half,1.702),(0,2.422),(half,1.702),(half,1.60),(0,2.32),(-half,1.60)]
 extrude('Straight_Continuous_Timber_Rake',p,y-.025,y+.025,wood,.005)
for x in (-half,half):box('Continuous_Side_Eaves',(.065,2.12,.105),(x,0,1.655),wood,.005)
wall=bpy.data.objects['Cream_Walls_Windowless_Rear']
for y in (-.885,.885):
 p=[(-1.62,1.59),(1.62,1.59),(1.62,height(1.62)-.08),(0,2.36),(-1.62,height(1.62)-.08)]
 g=extrude('Straight_Cream_Gable',p,y-.025,y+.025,cream,.003)
 bpy.context.view_layer.objects.active=wall;m=wall.modifiers.new('Continuous_Pitched_Wall','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=g
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(g,do_unlink=True)
# Fit the sign inside the triangle without modifying the reused mailbox relief.
fit=Matrix.Translation((0,.025,1.92))@Matrix.Diagonal((.8,1,.8,1))@Matrix.Translation((0,0,-1.98))
for o in s.objects:
 if o.name.startswith(('Sign_','Envelope_')):o.matrix_world=fit@o.matrix_world
def cap(name,r,h,base,a,b):
 p=[(r*math.cos(math.pi*i/64),base+h*math.sin(math.pi*i/64)) for i in range(65)]
 o=extrude(name,p,a,b,clay,.002)
 for f in o.data.polygons:f.use_smooth=abs(f.normal.y)<.99
 o.data.normals_split_custom_set([(0,0,0)]*len(o.data.loops))
for i in range(8):cap('Terracotta_Domed_Ridge',.083,.120,2.405,-1.052+i*2.104/8+.0005,-1.052+(i+1)*2.104/8-.0005)
for i in range(9):
 y=-1.052+i*2.104/8;cap('Terracotta_Ridge_Overlap',.089,.128,2.401,y-.009,y+.009)
# Timber headers and sloping edges are joined rather than stacked end caps.
trim=[o for o in s.objects if o.name.startswith(('Straight_Continuous_Timber_Rake','Continuous_Side_Eaves','Front_Continuous_Beam'))]
base=trim[0]
for o in trim[1:]:
 bpy.context.view_layer.objects.active=base;m=base.modifiers.new('Continuous_Eaves_Join','BOOLEAN');m.operation='UNION';m.solver='EXACT';m.object=o
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(o,do_unlink=True)
base.name='Joined_Post_Office_Timber_Eaves'
# Wall is deliberately changed by the new gables; all other fittings stay exact.
before.pop('Cream_Walls_Windowless_Rear',None)
assert all(sig(bpy.data.objects[n])==h for n,h in before.items())
asset=[o for o in s.objects if o.type in ('MESH','CURVE','EMPTY') and not o.name.startswith('Preview_')]
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(R/'PostOffice.glb'),export_format='GLB',use_selection=True)
s.cycles.samples=28;s.render.resolution_x=1200;s.render.resolution_y=1000;c=s.camera
for name,loc,at,scale in [('front-right',(4,-6,3.5),(0,-.08,1.18),4.8),('front',(0,-7,2.8),(0,-.08,1.18),4.8),('rear',(4,6,3.5),(0,0,1.18),4.8),('roof-detail',(3,-5,4),(0,-.15,2.12),3.25),('sign-detail',(1,-5,2.6),(0,-1.0,1.93),1.3)]:
 c.location=loc;c.data.ortho_scale=scale;c.rotation_euler=(Vector(at)-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(R/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'PostOffice-pitched-roof.blend'))
(R/'manifest.json').write_text(json.dumps({'source':'post-office-exterior-v1','roofTiles':128,'ridgeCaps':8,'overlapBands':9,'signScaleXZ':.8,'unchangedFittingMeshes':len(before),'gameApplied':False,'sha256':hashlib.sha256((R/'PostOffice.glb').read_bytes()).hexdigest()},indent=2))
