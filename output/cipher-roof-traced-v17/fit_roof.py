"""Fit named roof outline points, never an arbitrary global height percentage."""
import math,json
import numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parent
TARGETS=[('peak',(336,95)),('ridge-back',(445,78)),('gable-left',(207,185)),
 ('gable-right',(472,193)),
 ('left-eave', (18,204)),('right-front-eave',(675,241)),('right-back-eave',(770,207)),
 ('right-ridge',(646,156)),('left-ridge',(150,141))]

def geometry(p):
    w,peak,eave,back,ridge,depth=p[6:12]
    drop=p[12]
    outer=p[13]
    inner=(peak-ridge)/(peak-eave)*w
    return [(0,-1.49,peak),(0,back,peak-drop),(-w,-1.49,eave),(w,-1.49,eave),
      (-3.13,-depth,1.95),(3.13,-depth,1.95),(3.13,depth,1.95),
      (outer,0,ridge),(-outer,0,ridge)]

def axes(p):
    y,t=p[:2]
    return np.array((math.cos(y),math.sin(y),0)),np.array((-math.sin(t)*math.sin(y),math.sin(t)*math.cos(y),math.cos(t))),np.array((math.cos(t)*math.sin(y),-math.cos(t)*math.cos(y),math.sin(t)))

def project(p,v):
    right,up,look=axes(p);v=np.array(v);d=p[2]-v@look
    return np.array((387.5+p[3]*(v@right-p[4])/d,143.5-p[3]*(v@up-p[5])/d))

prior=np.array((1.17,2.99,2.24,1.09,2.38,1.08))
norm=np.array((.10,.15,.10,.20,.15,.15))
def residual(p):
    rows=[v for point,(_,target) in zip(geometry(p),TARGETS) for v in project(p,point)-target]
    return np.concatenate((rows,(p[6:12]-prior)/norm*.3,[p[12]*.5,(p[13]-2.53)*2]))

lower=np.array((.08,-.06,5,300,-1,1.8,1.10,2.85,2.18,.5,2.20,1.03,-.01,2.2))
upper=np.array((.85,.55,200,30000,1,3.0,1.35,3.20,2.32,1.30,2.48,1.25,.65,2.7))
best=None
for dist in (8.,15.,35.,100.):
    p=np.array((.4,.15,dist,dist*115,0,2.45,*prior,.1,2.53))
    damping=.02
    for iteration in range(400):
        r=residual(p);cols=[]
        for i in range(len(p)):
            q=p.copy();eps=max(abs(p[i])*1e-5,1e-6);q[i]+=eps
            cols.append((residual(q)-r)/eps)
        j=np.array(cols).T;diag=np.maximum(np.diag(j.T@j),1e-8)
        delta=np.linalg.solve(j.T@j+damping*np.diag(diag),-j.T@r)
        q=p+delta
        if np.all(q>lower) and np.all(q<upper) and np.dot(residual(q),residual(q))<np.dot(r,r):
            p=q;damping=max(1e-9,damping*.5)
            if np.linalg.norm(delta)<1e-7:break
        else:damping=min(1e12,damping*3)
    score=float(np.dot(residual(p),residual(p)))
    if best is None or score<best[0]:best=score,p.copy()
p=best[1]
rows=[{'name':name,'target':target,'projected':project(p,point).tolist(),
       'errorPixels':float(np.linalg.norm(project(p,point)-target))} for point,(name,target) in zip(geometry(p),TARGETS)]
report={'parameters':p.tolist(),'roof':dict(zip(('centralHalfWidth','centralPeak','centralEave','centralBack','wingRidge','wingDepth','centralRearDrop','wingOuterRidgeX'),p[6:].tolist())),
    'landmarks':rows,'rmsPixels':math.sqrt(sum(r['errorPixels']**2 for r in rows)/len(rows))}
(ROOT/'roof-fit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
