"""Fit an orthographic comparison view to explicit reference landmarks."""
import math,json
import numpy as np
from mathutils import Vector

LANDMARKS=[
    ('wing-left-eave',(-3.13,-1.08,1.95),(26,309),1),
    ('wing-right-eave',(3.13,-1.08,1.95),(682,349),1),
    ('wing-right-back',(3.13,1.08,1.95),(778,309),.5),
    ('gable-peak',(0,-1.535,3.00),(346,198),1),
    ('ridge-back',(0,1.10,3.00),(454,182),1),
    ('gable-left',(-1.17,-1.535,2.24),(216,287),1),
    ('gable-right',(1.17,-1.535,2.24),(480,297),1),
    ('base-left',(-3.07,-.98,0),(27,477),1),
    ('base-right',(3.07,-.98,0),(687,542),1),
    ('base-right-back',(3.07,.98,0),(777,490),.5),
    ('door-bottom',(0,-1.165,.30),(348,477),1),
    ('step-front',(0,-2.11,0),(340,533),1)]

def axes(p):
    yaw,pitch=p[:2]
    right=Vector((math.cos(yaw),math.sin(yaw),0))
    up=Vector((-math.sin(pitch)*math.sin(yaw),math.sin(pitch)*math.cos(yaw),math.cos(pitch)))
    look=Vector((math.cos(pitch)*math.sin(yaw),-math.cos(pitch)*math.cos(yaw),math.sin(pitch)))
    return right,up,look

def projected(p,point):
    right,up,_=axes(p);v=Vector(point)
    return (401.5+803/p[2]*(v.dot(right)-p[3]),337.5-803/p[2]*(v.dot(up)-p[4]))

def error(p):
    if not .1<p[0]<.8 or not .02<p[1]<.65 or not 5<p[2]<10:return 1e9
    return sum(weight*sum((a-b)**2 for a,b in zip(projected(p,point),target)) for _,point,target,weight in LANDMARKS)

def fit(cam,path):
    # Perspective is essential: depth edges in the reference converge rather
    # than staying parallel as they did in all previous orthographic previews.
    def project(p,point):
        right,up,look=axes(p);v=Vector(point)
        d=p[2]-v.dot(look)
        return (401.5+p[3]*(v.dot(right)-p[4])/d,337.5-p[3]*(v.dot(up)-p[5])/d)
    def residual(p):
        return np.array([(a-b)*math.sqrt(weight) for _,point,target,weight in LANDMARKS for a,b in zip(project(p,point),target)])
    best=None
    for distance in (9.,15.,25.,50.):
        p=np.array([.35,.15,distance,803/7.2*distance,0,1.4])
        damping=.01
        for iteration in range(220):
            r=residual(p);columns=[]
            for i in range(6):
                q=p.copy();eps=max(abs(p[i])*1e-5,1e-5);q[i]+=eps
                columns.append((residual(q)-r)/eps)
            j=np.array(columns).T
            diag=np.maximum(np.diag(j.T@j),1e-8)
            change=np.linalg.solve(j.T@j+damping*np.diag(diag),-j.T@r)
            q=p+change
            valid=.05<q[0]<1 and -.1<q[1]<.7 and 5<q[2]<200 and 200<q[3]<25000
            if valid and np.dot(residual(q),residual(q))<np.dot(r,r):
                p=q;damping=max(damping*.4,1e-9)
                if np.linalg.norm(change)<1e-7:break
            else:damping=min(damping*4,1e12)
        score=float(np.dot(residual(p),residual(p)))
        if best is None or score<best[0]:best=(score,p.copy())
    p=best[1].tolist()
    right,up,look=axes(p);target=right*p[4]+up*p[5]
    cam.location=target+look*p[2]
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='PERSP';cam.data.sensor_fit='HORIZONTAL';cam.data.sensor_width=36
    cam.data.lens=p[3]*36/803
    rows=[{'name':name,'target':target,'projected':project(p,point),
           'errorPixels':math.dist(project(p,point),target)} for name,point,target,_ in LANDMARKS]
    path.write_text(json.dumps({'cameraType':'perspective','parameters':p,'landmarks':rows,
        'rmsPixels':math.sqrt(sum(r['errorPixels']**2 for r in rows)/len(rows))},indent=2))
    return p
