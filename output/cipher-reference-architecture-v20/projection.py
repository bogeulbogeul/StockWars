"""Reference-view measurements for straight, planar native architecture."""
import numpy as np,json,math
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
P=np.array(json.loads((ROOT/'calibration.json').read_text())['parameters'])
y,t,roll=P[:3]
r=np.array((math.cos(y),math.sin(y),0));u=np.array((-math.sin(t)*math.sin(y),math.sin(t)*math.cos(y),math.cos(t)))
R=r*math.cos(roll)+u*math.sin(roll);U=u*math.cos(roll)-r*math.sin(roll);L=np.cross(r,u)
CAM=R*P[5]+U*P[6]+L*P[3]
def ray(pixel):return R*(pixel[0]-687)/P[4]+U*(572.5-pixel[1])/P[4]-L
def at_y(pixel,y):
 v=ray(pixel);return CAM+v*((y-CAM[1])/v[1])
def at_z(pixel,z):
 v=ray(pixel);return CAM+v*((z-CAM[2])/v[2])
def project(v):
 d=P[3]-np.dot(v,L)
 return [687+P[4]*(np.dot(v,R)-P[5])/d,572.5-P[4]*(np.dot(v,U)-P[6])/d]
def setup(cam):
 cam.matrix_world=Matrix(((R[0],U[0],L[0],CAM[0]),(R[1],U[1],L[1],CAM[1]),(R[2],U[2],L[2],CAM[2]),(0,0,0,1)))
 cam.data.type='PERSP';cam.data.sensor_fit='HORIZONTAL';cam.data.sensor_width=36;cam.data.lens=P[4]*36/1374
def design():
 bd=P[9];front=-bd-.55;back=P[7]
 peak=at_y((593,331),front);left=at_y((364,493),front);right=at_y((822,502),front)
 rear=at_y((780,305),back)
 return {'front':front,'back':back,'peak':peak,'left':left,'right':right,'rear':rear,
  'ridgeLeft':at_y((270,418),0),'ridgeRight':at_y((1110,443),0)}
