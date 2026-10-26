"""Gold main crosswise gable and analytically fitted entry gable."""
import bpy,math,importlib.util
from pathlib import Path
from exterior_geometry import extrude,box
spec=importlib.util.spec_from_file_location('furniture_roof_helpers',Path(__file__).resolve().parent.parent/'furniture-redesign-v2/roof.py')
helpers=importlib.util.module_from_spec(spec);spec.loader.exec_module(helpers)
clip=helpers.clip
def solid(name,poly,*args):
 clean=[]
 for p in poly:
  if not clean or math.dist(p,clean[-1])>1e-7:clean.append(p)
 if len(clean)>1 and math.dist(clean[0],clean[-1])<1e-7:clean.pop()
 return helpers.solid(name,clean,*args)
MS=.68/1.07;PS=.57/.73
def mh(y):return 2.22-MS*abs(y)
def ph(x):return 1.98-PS*abs(x)
def seam(x):return (ph(x)-2.22)/MS
def build(gold,wood,cream):
 surfaces=[('Main_Rear',lambda x,y:mh(y),[lambda x,y:y]),
 ('Main_Front_Left',lambda x,y:mh(y),[lambda x,y:-y,lambda x,y:-x,lambda x,y:y-seam(x)]),
 ('Main_Front_Right',lambda x,y:mh(y),[lambda x,y:-y,lambda x,y:x,lambda x,y:y-seam(x)]),
 ('Porch_Left',lambda x,y:ph(x),[lambda x,y:x+.73,lambda x,y:-x,lambda x,y:seam(x)-y]),
 ('Porch_Right',lambda x,y:ph(x),[lambda x,y:x,lambda x,y:.73-x,lambda x,y:seam(x)-y])]
 tiles=0
 for name,h,limits in surfaces:
  porch=name.startswith('Porch');xa,xb=(-.73,.73) if porch else (-1.68,1.68);ya,yb=(-1.31,-.30) if porch else (-1.07,1.07)
  poly=[(xa,ya),(xb,ya),(xb,yb),(xa,yb)]
  for fn in limits:poly=clip(poly,fn)
  solid('Gold_Pitched_Roof_'+name,poly,h,gold,.065,0,.004)
  if not porch:solid('Main_Closed_Timber_Soffit_'+name,poly,h,wood,.070,-.060,.003)
  nx,ny=(8,5) if porch else (14,10)
  for i in range(nx):
   for j in range(ny):
    x=xa+(xb-xa)*i/nx;y=ya+(yb-ya)*j/ny;dx=(xb-xa)/nx;dy=(yb-ya)/ny
    p=[(x+.002,y+.002),(x+dx-.002,y+.002),(x+dx-.002,y+dy-.002),(x+.002,y+dy-.002)]
    for fn in limits:p=clip(p,fn)
    if porch:p=clip(p,lambda x,y:seam(x)-y-.009)
    elif 'Main_Front' in name:p=clip(p,lambda x,y:y-seam(x)-.009)
    o=solid('Rounded_Gold_Tile_'+name,p,h,gold,.056,.039,.012)
    if o:tiles+=1
 # Continuous recessed valley bed, seated on the same roof intersection.
 for a,b in [(-.565,0),(0,.565)]:
  poly=[(a,seam(a)-.02),(b,seam(b)-.02),(b,seam(b)+.02),(a,seam(a)+.02)]
  solid('Gold_Closed_Valley',poly,lambda x,y:(ph(x)+mh(y))*.5,gold,.035,.016,.002)
 # Solid main gables face left/right, matching the approved concept.
 for x in (-1.466,1.466):
  p=[(-.92,1.43),(.92,1.43),(.92,mh(.92)-.065),(0,2.155),(-.92,mh(-.92)-.065)]
  o=extrude('Main_Cream_Side_Gable',p,-x-.024,-x+.024,cream,.003);o.rotation_euler.z=math.pi/2
 for x in (-1.68,1.68):
  p=[(-1.07,mh(1.07)-.018),(0,2.202),(1.07,mh(1.07)-.018),(1.07,mh(1.07)-.12),(0,2.10),(-1.07,mh(1.07)-.12)]
  o=extrude('Main_Timber_Rake',p,-x-.024,-x+.024,wood,.005);o.rotation_euler.z=math.pi/2
 for y in (-1.07,1.07):
  if y<0:
   for sign in (-1,1):box('Front_Horizontal_Timber',(.98,.10,.115),(sign*1.205,y,1.425),wood,.006)
  else:box('Rear_Horizontal_Timber',(3.39,.10,.115),(0,y,1.425),wood,.006)
 # One wood triangular ring with an embedded cream field; no separate corner caps.
 frame=extrude('Porch_Continuous_Timber_Frame',[(-.745,1.29),(.745,1.29),(.745,1.40),(0,1.965),(-.745,1.40)],-1.335,-.91,wood,.004)
 cut=extrude('Porch_Triangle_Cutter',[(-.61,1.40),(.61,1.40),(0,1.87)],-1.37,-.87,wood,0)
 bpy.context.view_layer.objects.active=frame;m=frame.modifiers.new('Triangle_Opening','BOOLEAN');m.operation='DIFFERENCE';m.object=cut;bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cut,do_unlink=True)
 extrude('Porch_Cream_Pediment',[(-.73,1.30),(.73,1.30),(.73,1.395),(0,1.95),(-.73,1.395)],-1.329,-1.08,cream,.002)
 def cap(name,r,h,z,a,b,rotate):
  p=[(r*math.cos(math.pi*i/64),z+h*math.sin(math.pi*i/64)) for i in range(65)]
  o=extrude(name,p,a,b,gold,.002)
  for f in o.data.polygons:f.use_smooth=abs(f.normal.y)<.99
  o.data.normals_split_custom_set([(0,0,0)]*len(o.data.loops))
  if rotate:o.rotation_euler.z=math.pi/2
 for i in range(12):cap('Main_Gold_Ridge',.083,.12,2.19,-1.696+i*3.392/12+.0005,-1.696+(i+1)*3.392/12-.0005,True)
 for i in range(13):
  x=-1.696+i*3.392/12;cap('Main_Ridge_Overlap',.089,.128,2.186,x-.009,x+.009,True)
 end=seam(0)+.018
 for i in range(4):cap('Porch_Gold_Ridge',.067,.095,1.952,-1.33+i*(end+1.33)/4+.0005,-1.33+(i+1)*(end+1.33)/4-.0005,False)
 for i in range(5):
  y=-1.33+i*(end+1.33)/4;cap('Porch_Ridge_Overlap',.073,.103,1.948,y-.009,y+.009,False)
 return {'tiles':tiles,'mainRidgeCaps':12,'porchRidgeCaps':4,'mainPeak':2.22,'porchPeak':1.98}
