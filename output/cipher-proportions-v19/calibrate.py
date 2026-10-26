"""Calibrate the facade box before solving independent roof planes."""
import numpy as np,json,math,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from fit import axes
TARGET=np.array([(40,523),(1178,591),(1334,530),(40,815),(1175,927),(1330,815)],float)
def points(p):
 D,H,bd,bw=p[7:]
 return np.array([(-3.13,-D,H),(3.13,-D,H),(3.13,D,H),(-bw,-bd,0),(bw,-bd,0),(bw,bd,0)])
def project(p):
 r,u,l=axes(p);v=points(p);den=p[3]-v@l
 return np.column_stack((687+p[4]*(v@r-p[5])/den,572.5-p[4]*(v@u-p[6])/den))
def solve():
 lo=np.array([.15,.03,-.04,4,400,-.6,.7,.7,1.3,.6,2.95])
 hi=np.array([.7,.5,.04,160,40000,.6,2,1.7,2.2,1.6,3.3])
 best=None
 def residual(p):return np.r_[(project(p)-TARGET).ravel(),(p[7:]-[1.08,1.95,.98,3.11])*2]
 for d in (6,9,15,25,60,110):
  p=np.array([.36,.22,0,d,190*d,0,1.5,1.08,1.95,.98,3.11],float);damp=.01
  for k in range(400):
   r=residual(p);j=[]
   for i in range(len(p)):
    q=p.copy();e=max(abs(p[i])*1e-5,1e-5);q[i]+=e;j.append((residual(q)-r)/e)
   j=np.column_stack(j);jj=j.T@j
   change=np.linalg.solve(jj+damp*np.diag(np.maximum(np.diag(jj),1e-6)),-j.T@r)
   q=p+change
   if np.all(q>lo) and np.all(q<hi) and np.linalg.norm(residual(q))<np.linalg.norm(r):
    p=q;damp=max(1e-10,damp*.45)
    if np.linalg.norm(change)<1e-8:break
   else:damp=min(1e15,damp*4)
  score=np.linalg.norm(residual(p))
  if best is None or score<best[0]:best=(score,p)
 p=best[1];report={'parameters':p.tolist(),'projected':project(p).tolist(),
 'rmsPixels':float(np.sqrt(np.mean(np.sum((project(p)-TARGET)**2,axis=1))))}
 (ROOT/'calibration.json').write_text(json.dumps(report,indent=2));print(report)
 return p
if __name__=='__main__':solve()
