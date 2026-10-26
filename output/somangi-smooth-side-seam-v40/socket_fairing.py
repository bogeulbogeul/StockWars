import numpy as np,math,heapq
from mathutils import Vector

def cg(degree,rows,cols,rhs,start):
 def multiply(x):return degree*x-np.bincount(rows,weights=x[cols],minlength=len(x))
 x=start.copy();r=rhs-multiply(x);p=r.copy();rr=r@r
 for _ in range(1500):
  if rr<1e-19:break
  ap=multiply(p);alpha=rr/max(p@ap,1e-30);x+=alpha*p;r-=alpha*ap;new=r@r;p=r+(new/rr)*p;rr=new
 return x

def fair(faces,fresh,part,coeff,terms,axis,tree):
 if not fresh:return
 vertices=list({v for f in faces for v in f.verts});lookup={v:i for i,v in enumerate(vertices)};interior=[v for v in vertices if v in fresh];inside={v:i for i,v in enumerate(interior)};boundary=[v for v in vertices if v not in fresh];degree=np.zeros(len(interior));rows=[];cols=[];rhs=np.zeros((len(interior),3));neighbors={v:set() for v in vertices}
 for f in faces:
  for e in f.edges:
   a,b=e.verts;neighbors[a].add(b);neighbors[b].add(a)
 for v,i in inside.items():
  degree[i]=len(neighbors[v])
  for u in neighbors[v]:
   if u in inside:rows.append(i);cols.append(inside[u])
   else:rhs[i]+=np.array(u.co)
 rows=np.array(rows,dtype=int);cols=np.array(cols,dtype=int);start=np.array([v.co[:] for v in interior]);xyz=np.column_stack([cg(degree,rows,cols,rhs[:,j],start[:,j]) for j in range(3)])
 for v,p in zip(interior,xyz):v.co=p
 if part==0:
  sign=1 if sum(v.co.x for v in boundary)>0 else -1;heights,coefficients=tree
  def fitted(v):
   x,y,z=v.co;c=np.array([np.interp(z,heights,coefficients[:,j]) for j in range(3)])
   return sign*math.sqrt(max(.001,c[0]+c[1]*y+c[2]*y*y))
  residual_rhs=np.zeros(len(interior))
  for v,i in inside.items():
   for u in neighbors[v]:
    if u not in inside:residual_rhs[i]+=u.co.x-fitted(u)
  residual=cg(degree,rows,cols,residual_rhs,np.zeros(len(interior)))
  for v,r in zip(interior,residual):v.co.x=fitted(v)+r
 else:
  dist={v:0. for v in boundary};queue=[];number=0
  for v in boundary:heapq.heappush(queue,(0.,number,v));number+=1
  while queue:
   d,_,v=heapq.heappop(queue)
   if d>dist[v]+1e-9:continue
   for u in neighbors[v]:
    nd=d+(u.co-v.co).length
    if nd<dist.get(u,1e9):dist[u]=nd;heapq.heappush(queue,(nd,number,u));number+=1
  for v in interior:v.co-=axis*(.07*math.sqrt(min(dist.get(v,0)/.065,1))*float(np.clip((v.co.z+.29)/.12,0,1)))

