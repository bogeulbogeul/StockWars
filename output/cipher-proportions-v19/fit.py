"""Solve camera and actual roof/body dimensions against the full source image."""
import math,json
import numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parent
NAMES=['peak','ridge-back','gable-left','gable-right','left-eave','right-front-eave',
 'right-back-eave','right-ridge','left-ridge','base-left','base-right','base-right-back',
 'door-bottom','step-front']
TARGET=np.array([(593,331),(780,305),(364,493),(822,502),(40,523),(1178,591),
 (1334,530),(1110,443),(270,418),(40,815),(1175,927),(1330,815),(605,821),(560,906)],float)
def axes(p):
 y,t,roll=p[:3]
 r=np.array((math.cos(y),math.sin(y),0))
 u=np.array((-math.sin(t)*math.sin(y),math.sin(t)*math.cos(y),math.cos(t)))
 return r*math.cos(roll)+u*math.sin(roll),u*math.cos(roll)-r*math.sin(roll),np.cross(r,u)
def geometry(p):
 w,peak,eave,back,ridge,D,drop,outer,we,bw,bd=p[7:18]
 return np.array([(0,-1.49,peak),(0,back,peak-drop),(-w,-1.49,eave),
 (w,-1.49,eave),(-3.13,-D,we),(3.13,-D,we),(3.13,D,we),
 (outer,0,ridge),(-outer,0,ridge),(-bw,-bd,0),(bw,-bd,0),(bw,bd,0),
 (0,-1.12,.30),(0,-2.11,0)])
def project(p):
 r,u,l=axes(p);v=geometry(p);den=p[3]-v@l
 return np.column_stack((687+p[4]*(v@r-p[5])/den,572.5-p[4]*(v@u-p[6])/den))
def fit():
 lo=np.array([.1,.04,-.08,5,500,-.5,.8, .95,2.5,1.7,.4,1.8,.6,-.2,1.9,1.55,2.9,.6])
 hi=np.array([.8,.65,.08,160,40000,.5,2.2,1.5,3.5,2.6,2.0,2.8,1.7,1,2.8,2.2,3.5,1.6])
 prior=np.array([1.23,3.0,2.24,1.1,2.38,1.08,.1,2.4,1.95,3.07,.98])
 def residual(p):
  return np.r_[(project(p)-TARGET).ravel(),(p[7:]-prior)*.3]
 best=None
 for distance in (7,10,15,25,60,110):
  p=np.array([.36,.23,0,distance,190*distance,0,1.5,*prior],float)
  damping=.01
  for iteration in range(450):
   r=residual(p);cols=[]
   for i in range(len(p)):
    eps=max(abs(p[i])*1e-5,1e-5);q=p.copy();q[i]+=eps
    cols.append((residual(q)-r)/eps)
   j=np.column_stack(cols);jj=j.T@j
   change=np.linalg.solve(jj+damping*np.diag(np.maximum(np.diag(jj),1e-6)),-j.T@r)
   q=p+change
   valid=np.all(q>lo) and np.all(q<hi)
   if valid and np.linalg.norm(residual(q))<np.linalg.norm(r):
    p=q;damping=max(damping*.45,1e-10)
    if np.linalg.norm(change)<1e-8:break
   else:damping=min(damping*4,1e15)
  score=float(np.linalg.norm(residual(p)))
  if best is None or score<best[0]:best=(score,p)
 p=best[1];projection=project(p)
 result={'parameters':p.tolist(),'rmsPixels':float(np.sqrt(np.mean(np.sum((projection-TARGET)**2,axis=1)))),
  'landmarks':[{'name':n,'target':a.tolist(),'projected':b.tolist(),'errorPixels':float(np.linalg.norm(a-b))} for n,a,b in zip(NAMES,TARGET,projection)]}
 (ROOT/'fit.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
 return p
if __name__=='__main__':fit()
