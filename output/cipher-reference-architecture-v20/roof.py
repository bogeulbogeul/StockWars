"""Planar intersecting roofs, clipped native tiles and closed ridge caps."""
import bpy,bmesh,math
import numpy as np
from mathutils import Vector
from exterior_geometry import finish,box,extrude
from polygon_finish import merge_polygons
from projection import P,design

def plane(points):
 a=np.array([[x,y,1] for x,y,z in points]);v=np.linalg.solve(a,np.array([p[2] for p in points]))
 return lambda x,y:float(v[0]*x+v[1]*y+v[2])
def clip(poly,fn):
 out=[]
 for p,q in zip(poly,poly[1:]+poly[:1]):
  a,b=fn(*p),fn(*q)
  if a>=-1e-9:out.append(p)
  if (a>0)!=(b>0):
   t=a/(a-b);out.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
 clean=[]
 for p in out:
  if not clean or math.dist(p,clean[-1])>1e-8:clean.append(p)
 if len(clean)>1 and math.dist(clean[0],clean[-1])<1e-8:clean.pop()
 return clean if len(clean)>2 and abs(area(clean))>1e-10 else []
def area(poly):return sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(poly,poly[1:]+poly[:1]))
def cuts(poly):
 if area(poly)<0:poly=poly[::-1]
 return [lambda x,y,a=a,b=b,s=math.dist(a,b):((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]))/s
  for a,b in zip(poly,poly[1:]+poly[:1]) if math.dist(a,b)>1e-8]
def subtract(poly,other):
 intersection=poly[:]
 for fn in cuts(other):intersection=clip(intersection,fn)
 if len(intersection)<3 or abs(area(intersection))<1e-8:return [poly]
 if abs(abs(area(poly))-abs(area(intersection)))<1e-9:return []
 inside=poly;parts=[]
 for fn in cuts(other):
  outside=clip(inside,lambda x,y:-fn(x,y))
  if len(outside)>2 and abs(area(outside))>1e-9:parts.append(outside)
  inside=clip(inside,fn)
  if len(inside)<3:break
 return parts
def slab(name,poly,h,mat,offset=0,thick=.05,bevel=.002):
 if len(poly)<3 or abs(area(poly))<1e-8:return
 if area(poly)<0:poly=poly[::-1]
 n=len(poly);vertices=[(x,y,h(x,y)+offset-d) for d in (0,thick) for x,y in poly]
 faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces)
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
 finish(obj,mat,0 if name.startswith('Roof_Tile_') else bevel)
 return obj
def cap(name,a,b,blue,r=.065,height=.055,step=.25):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();length=(b-a).length
 up=(Vector((0,0,1))-axis*axis.z).normalized();across=axis.cross(up).normalized()
 count=max(1,round(length/step))
 for j in range(count):
  profile=[across*(r*math.cos(math.pi*i/24))+up*(height*math.sin(math.pi*i/24)-.014) for i in range(25)]
  n=len(profile);vertices=[tuple(p+v) for p in (a+axis*(length*j/count+.001),a+axis*(length*(j+1)/count-.001)) for v in profile]
  faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
  mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces)
  bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
  obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);finish(obj,blue,.003)
def build():
 d=design();blue=bpy.data.materials['Roof_Blue'];cream=bpy.data.materials['Trim_Cream']
 front=d['front'];back=d['back'];peak=d['peak'];rear=d['rear'];faces=[]
 # Both central roof halves are true planes. Their ridge is shared exactly.
 central=[]
 for label,tip in [('Left',d['left']),('Right',d['right'])]:
  h=plane([peak,rear,tip]);end=(rear[0]+tip[0]-peak[0],back)
  poly=[tuple(peak[:2]),tuple(tip[:2]),end,tuple(rear[:2])]
  faces.append(('Central_'+label,poly,h));central.append(h)
 # Each side is a separate hipped roof with the measured ridge position/height.
 D=P[7];H=P[8];edge=3.13
 wing=[]
 for side,key in [(-1,'ridgeLeft'),(1,'ridgeRight')]:
  ridge=d[key];rx=abs(ridge[0]);rz=ridge[2]
  limits=[lambda x,y,rz=rz:rz-(rz-H)*y/D,lambda x,y,rz=rz:rz+(rz-H)*y/D,
   lambda x,y,rz=rz,rx=rx,side=side:rz-(rz-H)*(side*x-rx)/(edge-rx)]
  rect=[(side*.50,-D),(side*edge,-D),(side*edge,D),(side*.50,D)]
  for k,h in enumerate(limits):
   poly=rect[:]
   for other in limits:
    if other!=h:poly=clip(poly,lambda x,y:other(x,y)-h(x,y))
   faces.append(('Wing_'+str(side)+'_'+str(k),poly,h))
  wing.append((side,ridge,limits))
 # Each tile is clipped against the other roof's actual visible height.
 tile_count=0
 for name,outline,h in faces:
  if len(outline)<3:continue
  occluders=[]
  for other,poly,g in faces:
   # Faces within a roof already partition its domain. Only the opposite
   # building volume can occlude it; comparing coplanar neighbours makes slivers.
   if name.startswith('Central'):
    side='-1' if name.endswith('Left') else '1'
    if not other.startswith('Wing_'+side+'_'):continue
   else:
    label='Left' if name.startswith('Wing_-1_') else 'Right'
    if other!='Central_'+label:continue
   p=clip(poly,lambda x,y:g(x,y)-h(x,y)-.00002)
   if len(p)>2 and abs(area(p))>1e-7:occluders.append(p)
  def visible(poly):
   for fn in cuts(outline):poly=clip(poly,fn)
   parts=[poly] if len(poly)>2 else []
   for occluder in occluders:parts=[q for p in parts for q in subtract(p,occluder)]
   parts=[p for p in parts if len(p)>2 and abs(area(p))>1e-8]
   if not parts:return []
   try:return merge_polygons(parts)
   except AssertionError:return parts
  print('Roof face',name,flush=True)
  for poly in visible(outline):slab('Roof_Plane_'+name,poly,h,blue,0,.055,.002)
  if name.startswith('Central'):
   tip=d['left'] if name.endswith('Left') else d['right']
   end=np.array((rear[0]+tip[0]-peak[0],back))
   direction=end-np.array(tip[:2]);normal=np.array((-direction[1],direction[0]))
   normal/=np.linalg.norm(normal)
   if np.dot(normal,np.array(peak[:2])-np.array(tip[:2]))<0:normal=-normal
   strip=[tuple(tip[:2]),tuple(end),tuple(end+normal*.10),tuple(np.array(tip[:2])+normal*.10)]
   for p in visible(strip):slab('Central_Closed_Cream_Cornice',p,h,cream,-.045,.12,.004)
  x0=min(p[0] for p in outline);x1=max(p[0] for p in outline)
  y0=min(p[1] for p in outline);y1=max(p[1] for p in outline)
  slope_x=h(1,0)-h(0,0);slope_y=h(0,1)-h(0,0)
  dx=.25/math.sqrt(1+slope_x*slope_x);dy=(.45 if name.startswith('Central') else .34)/math.sqrt(1+slope_y*slope_y)
  normal_z=1/math.sqrt(1+slope_x*slope_x+slope_y*slope_y)
  for i in range(math.ceil((x1-x0)/dx)):
   for j in range(math.ceil((y1-y0)/dy)):
    xa=x0+i*dx;xb=min(x1,xa+dx);ya=y0+j*dy;yb=min(y1,ya+dy)
    poly=[(xa+.002,ya+.002),(xb-.002,ya+.002),(xb-.002,yb-.002),(xa+.002,yb-.002)]
    for p in visible(poly):
     slab('Roof_Tile_'+name,p,h,blue,.011/normal_z,.022/normal_z,.0015);tile_count+=1
 # Real cap sections, with enough roundness to match the adopted chunky clay.
 cap('Central_Ridge',peak+np.array([0,-.02,-.035]),rear+np.array([0,.01,-.035]),blue,.090,.130,.38)
 for side,ridge,limits in wing:
  h=central[0 if side<0 else 1]
  # Solve the exact central/wing intersection at ridge Y=0.
  x=(ridge[2]-h(0,0))/(h(1,0)-h(0,0))
  cap('Wing_Ridge',(x,0,ridge[2]-.030),ridge+np.array([0,0,-.030]),blue,.065,.085,.25)
  for sy in (-1,1):
   cap('Wing_Hip',ridge+np.array([0,0,.018]),(side*edge,sy*D,H+.018),blue,.052,.040,.25)
  box('Wing_Cream_Soffit',(2.15,2*D-.03,.085),(side*2.05,0,H-.075),cream,.006)
 # Central front: one closed triangular frame, continuous sloping and base trim.
 triangle=[(d['left'][0]+.02,d['left'][2]-.05),(d['right'][0]-.02,d['right'][2]-.05),(peak[0],peak[2]-.065)]
 center=np.mean(np.array(triangle),axis=0)
 inner=[tuple(center+(np.array(p)-center)*.82) for p in triangle]
 vertices=[(x,y,z) for y in (front-.018,front+.075) for poly in (triangle,inner) for x,z in poly]
 fs=[]
 for i in range(3):
  j=(i+1)%3;fs.extend([(i,j,j+3,i+3),(i+6,i+9,j+9,j+6),(i,i+6,j+6,j),(i+3,j+3,j+9,i+9)])
 mesh=bpy.data.meshes.new('Pediment_Frame');mesh.from_pydata(vertices,[],fs)
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 o=bpy.data.objects.new('Pediment_Continuous_Frame',mesh);bpy.context.collection.objects.link(o);finish(o,cream,.005)
 extrude('Pediment_Cream_Field',triangle,front+.04,front+.11,cream,.004)
 box('Portico_Continuous_Entablature',(d['right'][0]-d['left'][0]-.01,.24,.13),
  ((d['right'][0]+d['left'][0])*.5,front+.085,1.845),cream,.008)
 # Straight blue front edge follows each plane; no loose blocks or curved roof.
 for tip in (d['left'],d['right']):
  poly=[(peak[0],peak[2]+.005),(tip[0],tip[2]+.005),(tip[0],tip[2]-.045),(peak[0],peak[2]-.045)]
  extrude('Central_Blue_Front_Edge',poly,front-.035,front+.012,blue,.003)
 reartri=[(rear[0]+d['left'][0]-peak[0],central[0](rear[0]+d['left'][0]-peak[0],back)-.05),
  (rear[0]+d['right'][0]-peak[0],central[1](rear[0]+d['right'][0]-peak[0],back)-.05),(rear[0],rear[2]-.04)]
 extrude('Rear_Windowless_Pediment',reartri,back-.07,back-.01,cream,.004)
 return {'tileCount':tile_count,'centralFront':front,'centralBack':back,'wingEave':H,'wingDepth':D,
  'peak':peak.tolist(),'rearPeak':rear.tolist()},central
