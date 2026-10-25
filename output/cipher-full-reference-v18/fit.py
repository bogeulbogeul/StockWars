"""Fit full-image roof and foundation landmarks, in original image pixels."""
import numpy as np, json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
TARGET=np.array([(593,331),(780,305),(364,493),(822,502),(40,523),
 (1178,591),(1334,530),(1110,443),(270,418),(40,815),(1175,927),
 (1330,815),(605,821),(560,906)],float)
def points(p):
 w,peak,eave,back,ridge,depth,drop,outer=p[6:14]
 bodydepth=p[14]
 return np.array([(0,-1.49,peak),(0,back,peak-drop),(-w,-1.49,eave),
 (w,-1.49,eave),(-3.13,-depth,1.95),(3.13,-depth,1.95),
 (3.13,depth,1.95),(outer,0,ridge),(-outer,0,ridge),
 (-3.07,-bodydepth,0),(3.07,-bodydepth,0),(3.07,bodydepth,0),(0,-1.12,.30),(0,-2.11,0)])
def project(p):
 y,t,dist,f,cx,cz=p[:6]
 right=np.array((np.cos(y),np.sin(y),0))
 up=np.array((-np.sin(t)*np.sin(y),np.sin(t)*np.cos(y),np.cos(t)))
 look=np.cross(right,up)
 v=points(p);den=dist-v@look
 return np.column_stack((687+f*(v@right-cx)/den,572.5-f*(v@up-cz)/den))
def fit():
 old=json.loads((ROOT.parent/'cipher-roof-traced-v17'/'roof-fit.json').read_text())['parameters']
 p=np.array([.36,.25,50,10000,-.07,1.55,*old[6:],1.25],float)
 lo=np.array([.20,.10,18,2500,-.4,1.2,1.12,2.7,2.15,.7,2.15,.95,0,2.20,1.0])
 hi=np.array([.45,.40,140,30000,.4,1.9,1.32,3.20,2.40,1.6,2.55,1.5,.9,2.7,1.55])
 def residual(p):
  return np.r_[(project(p)-TARGET).ravel(),(p[6:14]-np.array(old[6:]))*2]
 scale=np.array([.1,.1,30,6000,.2,.3,.15,.3,.15,.4,.2,.2,.3,.2,.3])
 damp=.01
 for iteration in range(180):
  r=residual(p);cols=[]
  for i in range(len(p)):
   delta=scale[i]*1e-4;q=p.copy();q[i]+=delta
   cols.append((residual(q)-r)/1e-4)
  jac=np.column_stack(cols)
  step=np.linalg.solve(jac.T@jac+np.eye(len(p))*damp,-jac.T@r)
  q=np.clip(p+step*scale,lo,hi)
  if np.linalg.norm(residual(q))<np.linalg.norm(r):p=q;damp=max(1e-6,damp*.6)
  else:damp*=4
 result={'parameters':p.tolist(),'rmsPixels':float(np.sqrt(np.mean(np.sum((project(p)-TARGET)**2,axis=1)))),
  'landmarks':[{'target':a.tolist(),'projected':b.tolist()} for a,b in zip(TARGET,project(p))]}
 (ROOT/'full-fit.json').write_text(json.dumps(result,indent=2))
 return p
