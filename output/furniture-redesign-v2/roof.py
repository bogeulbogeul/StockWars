"""Analytically clipped cross-gable clay roof for Modern Frame."""
import bpy,bmesh,math
from exterior_geometry import finish,extrude,box
C=-1.081;PEAK=2.30;SLOPE=.79/1.173;WPEAK=1.94;WSLOPE=.43/1.07
XL=-2.254;XR=2.254;YF=-1.10;YB=1.10
def main(x):return PEAK-SLOPE*(x-C)
def wing(y):return WPEAK-WSLOPE*abs(y)
def seam(y):return C+(PEAK-wing(y))/SLOPE
def clip(poly,fn):
 out=[]
 for p,q in zip(poly,poly[1:]+poly[:1]):
  a,b=fn(*p),fn(*q)
  if a>=-1e-9:out.append(p)
  if (a>0)!=(b>0):
   t=a/(a-b);out.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
 return out
def solid(name,poly,h,mat,thick=.065,offset=0,bevel=.004):
 if len(poly)<3:return
 area=sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(poly,poly[1:]+poly[:1]))
 if abs(area)<1e-7:return
 n=len(poly);v=[(x,y,h(x,y)+offset-d) for d in (0,thick) for x,y in poly]
 f=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f)
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,mat,bevel);return o
def build(roof,wood,cream):
 surfaces=[('Main_Left',lambda x,y:PEAK+SLOPE*(x-C),[lambda x,y:C-x]),
 ('Main_Right_Front',lambda x,y:main(x),[lambda x,y:x-C,lambda x,y:-y,lambda x,y:seam(y)-x]),
 ('Main_Right_Rear',lambda x,y:main(x),[lambda x,y:x-C,lambda x,y:y,lambda x,y:seam(y)-x]),
 ('Wing_Front',lambda x,y:wing(y),[lambda x,y:x-seam(y),lambda x,y:-y]),
 ('Wing_Rear',lambda x,y:wing(y),[lambda x,y:x-seam(y),lambda x,y:y])]
 rect=[(XL,YF),(XR,YF),(XR,YB),(XL,YB)];tiles=0
 for name,h,limits in surfaces:
  poly=rect[:]
  for fn in limits:poly=clip(poly,fn)
  solid('Pitched_Cocoa_Roof_'+name,poly,h,roof)
  for i in range(24):
   for j in range(8):
    x=XL+i*(XR-XL)/24;y=YF+j*(YB-YF)/8
    p=[(x+.002,y+.002),(x+(XR-XL)/24-.002,y+.002),(x+(XR-XL)/24-.002,y+(YB-YF)/8-.002),(x+.002,y+(YB-YF)/8-.002)]
    for fn in limits:p=clip(p,fn)
    if name.startswith('Main_Right'):p=clip(p,lambda x,y:seam(y)-x-.012)
    if name.startswith('Wing'):p=clip(p,lambda x,y:x-seam(y)-.012)
    o=solid('Rounded_Cocoa_Tile_'+name,p,h,roof,.058,.040,.014)
    if o:tiles+=1
 # A closed recessed clay valley bed spans the seam beneath both cut tile edges.
 for a,b in [(YF-.026,0),(0,YB+.026)]:
  poly=[(seam(a)-.023,a),(seam(a)+.023,a),(seam(b)+.023,b),(seam(b)-.023,b)]
  solid('Cocoa_Closed_Valley_Liner',poly,lambda x,y:(main(x)+wing(y))*.5,roof,.035,.018,.002)
 # Connected front/rear fascia follows the actual roof intersection.
 for y in (YF,YB):
  pts=[(XL,PEAK+SLOPE*(XL-C)),(C,PEAK),(seam(y),wing(y)),(XR,wing(y))]
  extrude('Continuous_Honey_Fascia',[(x,z-.018) for x,z in pts]+[(x,z-.13) for x,z in reversed(pts)],y-.027,y+.027,wood,.006)
 for y in (-.94,.94):
  left=-2.18;right=2.18
  pts=[(left,PEAK+SLOPE*(left-C)-.07),(C,PEAK-.07),(seam(y),wing(y)-.07),(right,wing(y)-.07)]
  extrude('Cream_Straight_Gable',[(left,1.43),(right,1.43)]+list(reversed(pts)),y-.024,y+.024,cream,.003)
 # Right-facing gable and wood edge are closed solids, not single planes.
 for x in (1.92,):
  o=extrude('Cream_Right_Wing_Gable',[(-.94,1.43),(.94,1.43),(.94,wing(.94)-.065),(0,WPEAK-.065),(-.94,wing(-.94)-.065)],-x-.022,-x+.022,cream,.003)
  o.rotation_euler.z=math.pi/2
 pts=[(YF,wing(YF)),(0,WPEAK),(YB,wing(YB))]
 o=extrude('Wing_End_Timber_Fascia',[(y,z-.018) for y,z in pts]+[(y,z-.13) for y,z in reversed(pts)],-XR-.022,-XR+.022,wood,.006);o.rotation_euler.z=math.pi/2
 box('Main_Left_Side_Fascia',(.07,2.22,.11),(XL,0,1.44),wood,.005)
 box('Continuous_Front_Header',(4.36,.13,.115),(0,-1.045,1.3975),wood,.006)
 box('Continuous_Rear_Header',(4.28,.13,.115),(0,1.01,1.3975),wood,.006)
 for y in (-1.04,1.04):box('Showroom_Horizontal_Header',(XR-seam(YF)+.025,.12,.115),((XR+seam(YF))/2,y,1.405),wood,.005)
 def cap(name,r,height,base,a,b,rotate=False):
  p=[(r*math.cos(math.pi*i/64),base+height*math.sin(math.pi*i/64)) for i in range(65)]
  o=extrude(name,p,a,b,roof,.002)
  for f in o.data.polygons:f.use_smooth=abs(f.normal.y)<.99
  o.data.normals_split_custom_set([(0,0,0)]*len(o.data.loops))
  if rotate:o.rotation_euler.z=math.pi/2
  else:o.location.x=C
 for i in range(9):cap('Main_Domed_Ridge_Cap',.086,.125,PEAK-.030,YF-.012+i*2.224/9+.0005,YF-.012+(i+1)*2.224/9-.0005)
 for i in range(10):
  y=YF-.012+i*2.224/9;cap('Main_Ridge_Overlap_Band',.092,.133,PEAK-.034,y-.009,y+.009)
 start=seam(0)+.025;end=XR+.012
 for i in range(10):
  a=start+(end-start)*i/10;b=start+(end-start)*(i+1)/10
  cap('Wing_Domed_Ridge_Cap',.080,.115,WPEAK-.025,-b+.0005,-a-.0005,True)
 for i in range(11):
  x=start+(end-start)*i/10;cap('Wing_Ridge_Overlap_Band',.086,.123,WPEAK-.029,-x-.009,-x+.009,True)
 return {'roofTiles':tiles,'mainRidgeCaps':9,'wingRidgeCaps':10,'mainHalfWidth':1.173,'mainPeak':PEAK,'wingPeak':WPEAK,'valleyWidthX':.024}
