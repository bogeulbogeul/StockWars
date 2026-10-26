"""Continuous 3D cage deformation from measured source-view landmarks.

This changes mesh positions, including the ground footprint; no rendered image
is warped. The original view is used only to measure the physical cage.
"""
import numpy as np
from mathutils import Vector

class Cage:
 def __init__(self,cam,width,height,landmarks):
  self.width=width;self.height=height
  self.f=cam.data.lens/cam.data.sensor_width*width
  self.camera=np.array(cam.location[:],float)
  self.axes=np.array(cam.matrix_world.to_3x3(),float)
  self.landmarks=landmarks
  source=self.project(np.array([a for _,a,b in landmarks],float))
  target=np.array([b for _,a,b in landmarks],float)
  self.source=source;self.target=target
  points=source/1000;self.points=points
  delta=points[:,None,:]-points[None,:,:]
  dist=np.sum(delta*delta,axis=2)
  kernel=dist*np.log(dist+1e-15)
  affine=np.column_stack((np.ones(len(points)),points))
  system=np.block([[kernel+np.eye(len(points))*1e-10,affine],
    [affine.T,np.zeros((3,3))]])
  self.weights=np.linalg.solve(system,np.vstack((target-source,np.zeros((3,2)))))
 def project(self,p):
  q=(p-self.camera)@self.axes
  return np.column_stack((self.width/2+self.f*q[:,0]/-q[:,2],
    self.height/2-self.f*q[:,1]/-q[:,2]))
 def warp(self,p):
  a=p/1000;delta=a[:,None,:]-self.points[None,:,:]
  dist=np.sum(delta*delta,axis=2)
  basis=np.column_stack((dist*np.log(dist+1e-15),np.ones(len(a)),a))
  return p+basis@self.weights
 def rays(self,screen):
  local=np.column_stack(((screen[:,0]-self.width/2)/self.f,
    (self.height/2-screen[:,1])/self.f,-np.ones(len(screen))))
  return local@self.axes.T
 def deform(self,p):
  screen=self.warp(self.project(p));rays=self.rays(screen)
  depth=-((p-self.camera)@self.axes)[:,2]
  # Move the footprint in 3D too, keeping its lower face on Z=0.
  ground=p.copy();ground[:,2]=0
  old_depth=-((ground-self.camera)@self.axes)[:,2]
  ground_ray=self.rays(self.warp(self.project(ground)))
  new_depth=-self.camera[2]/ground_ray[:,2]
  depth+=new_depth-old_depth
  return self.camera+rays*depth[:,None]
 def report(self):
  actual=self.warp(self.source)
  return [{'name':n,'before':a.tolist(),'target':b.tolist(),
   'after':c.tolist(),'errorPixels':float(np.linalg.norm(b-c))}
   for (n,_,_),a,b,c in zip(self.landmarks,self.source,self.target,actual)]
