"""Straight central ridge and analytically clipped hip-roof intersections."""
import bpy,math,importlib.util
from pathlib import Path
from mathutils import Vector
from exterior_geometry import extrude,box,finish
spec=importlib.util.spec_from_file_location('clean_solid_helpers',Path(__file__).resolve().parent.parent/'bank-redesign-v2/roof.py')
helpers=importlib.util.module_from_spec(spec);spec.loader.exec_module(helpers)
solid=helpers.solid;clip=helpers.clip
def build(d,D,H):
 blue=bpy.data.materials['Roof_Blue'];cream=bpy.data.materials['Trim_Cream']
 cx=float(d['peak'][0]);pz=float(d['peak'][2]);front=float(d['front']);back=D;L=float(d['left'][0]);R=float(d['right'][0]);edge=3.13
 heights=[float(d['left'][2]),float(d['right'][2])];slopes=[(pz-heights[0])/(cx-L),(pz-heights[1])/(R-cx)]
 mains=[lambda x,y:pz+slopes[0]*(x-cx),lambda x,y:pz-slopes[1]*(x-cx)]
 rows=[front+( -D-front)*i/2 for i in range(2)]+[-D+2*D*i/12 for i in range(13)]
 tile_count=0;patches=[]
 for side,idx,key in [(-1,0,'ridgeLeft'),(1,1,'ridgeRight')]:
  ridge=d[key];rx=float(ridge[0]);rz=float(ridge[2]);sx=abs(rx);mh=mains[idx]
  wh=[lambda x,y,rz=rz:rz+(rz-H)*y/D,lambda x,y,rz=rz:rz-(rz-H)*y/D,
      lambda x,y,rz=rz,sx=sx,side=side:rz-(rz-H)*(side*x-sx)/(edge-sx)]
  xa,xb=(L,cx) if side<0 else (cx,R)
  for zone,a,b in [('Overhang',front,-D),('Front',-D,0),('Rear',0,D)]:
   p=[(xa,a),(xb,a),(xb,b),(xa,b)]
   if zone!='Overhang':p=clip(p,lambda x,y,wing=wh[0 if zone=='Front' else 1]:mh(x,y)-wing(x,y))
   patches.append(('Central_'+str(side)+'_'+zone,p,mh,'central',idx))
  rect=[(-edge,-D),(cx,-D),(cx,D),(-edge,D)] if side<0 else [(cx,-D),(edge,-D),(edge,D),(cx,D)]
  for k,h in enumerate(wh):
   p=rect[:]
   for g in wh:
    if g!=h:p=clip(p,lambda x,y,g=g,h=h:g(x,y)-h(x,y))
   outer=clip(p,lambda x,y,side=side:L-x if side<0 else x-R)
   inner=clip(p,lambda x,y,side=side:x-L if side<0 else R-x)
   inner=clip(inner,lambda x,y,h=h: h(x,y)-mh(x,y))
   patches.append(('Wing_'+str(side)+'_'+str(k)+'_Outer',outer,h,'wing',idx))
   patches.append(('Wing_'+str(side)+'_'+str(k)+'_Inner',inner,h,'wing',idx))
 # All cuts use one set of analytic plane inequalities, never polygon subtraction.
 for name,poly,h,kind,idx in patches:
  if len(poly)<3:continue
  solid('Clean_Roof_Base_'+name,poly,h,blue,.060,0,.002)
  xknots=[L+(cx-L)*i/5 for i in range(6)] if kind=='central' and idx==0 else [cx+(R-cx)*i/5 for i in range(6)] if kind=='central' else [-edge+2*edge*i/26 for i in range(27)]
  for a,b in zip(xknots,xknots[1:]):
   for ya,yb in zip(rows,rows[1:]):
    tile=[(a+.002,ya+.002),(b-.002,ya+.002),(b-.002,yb-.002),(a+.002,yb-.002)]
    # Convex face outline clips each tile to the exact same roof boundary.
    area=sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(poly,poly[1:]+poly[:1]));outline=poly if area>0 else poly[::-1]
    for p,q in zip(outline,outline[1:]+outline[:1]):
     tile=clip(tile,lambda x,y,p=p,q=q:(q[0]-p[0])*(y-p[1])-(q[1]-p[1])*(x-p[0]))
    o=solid('Clean_Blue_Tile_'+name,tile,h,blue,.036,.024,.005)
    if o:tile_count+=1
 # Cream side returns are vertical, straight and concealed under the blue eaves.
 for side,x,h in [(-1,L,heights[0]),(1,R,heights[1])]:
  box('Clean_Central_Cream_Return',(.075,D-front,.20),(x-side*.041,(D+front)/2,h-.12),cream,.003)
  ya=front+.15;yb=-D+.045;bottom=H-.025;top=h-.075
  box('Clean_Portico_Side_Bulkhead',(.065,yb-ya,top-bottom),(x-side*.043,(ya+yb)/2,(top+bottom)/2),cream,.003)
  idx=0 if side<0 else 1;rz=float(d['ridgeLeft' if side<0 else 'ridgeRight'][2])
  t=(rz-(h-.08))/(rz-H)*D
  for ya,yb in [(-D,-t),(t,D)]:
   p=[(ya,rz-(rz-H)*abs(ya)/D-.035),(yb,rz-(rz-H)*abs(yb)/D-.035),(yb,h-.075),(ya,h-.075)]
   panel=extrude('Clean_Central_Side_Infill',p,-(x-side*.043)-.026,-(x-side*.043)+.026,cream,.002);panel.rotation_euler.z=math.pi/2
 rear=[(L,heights[0]-.05),(R,heights[1]-.05),(cx,pz-.045)]
 extrude('Clean_Rear_Pediment',rear,D-.065,D-.012,cream,.003)
 def cap(name,a,b,r,height):
  a,b=Vector(a),Vector(b);axis=(b-a).normalized();length=(b-a).length
  up=(Vector((0,0,1))-axis*axis.z).normalized();across=axis.cross(up).normalized();n=49
  for j in range(max(1,round(length/.30))):
   count=max(1,round(length/.30));profile=[across*(r*math.cos(math.pi*i/48))+up*(height*math.sin(math.pi*i/48)-.025) for i in range(n)]
   v=[tuple(p+t) for p in (a+axis*(length*j/count+.001),a+axis*(length*(j+1)/count-.001)) for t in profile]
   f=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
   import bmesh
   mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f);bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
   o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,blue,.002)
 cap('Clean_Central_Ridge',(cx,front-.01,pz),(cx,D+.01,pz),.09,.13)
 for side,idx,key in [(-1,0,'ridgeLeft'),(1,1,'ridgeRight')]:
  ridge=d[key];rx=float(ridge[0]);rz=float(ridge[2]);slope=slopes[idx]
  ix=cx+side*(pz-rz)/slope
  cap('Clean_Wing_Ridge',(ix,0,rz),(rx,0,rz),.065,.09)
  for sy in (-1,1):cap('Clean_Wing_Hip',(rx,0,rz),(side*edge,sy*D,H),.052,.075)
  box('Clean_Outer_Blue_Eave',(.052,2*D+.006,.065),(side*edge,0,H-.018),blue,.003)
 for tip in (d['left'],d['right']):
  extrude('Clean_Blue_Front_Edge',[(cx,pz+.01),(tip[0],tip[2]+.01),(tip[0],tip[2]-.038),(cx,pz-.038)],front-.033,front+.01,blue,.002)
 return {'tiles':tile_count,'straightRidgeX':cx,'mainPeak':pz,'mainFront':front,'mainRear':D}
