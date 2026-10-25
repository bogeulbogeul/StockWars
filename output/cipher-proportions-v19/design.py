"""Recover planar architectural surfaces from the reference and calibrated camera."""
import numpy as np,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent;sys.path.insert(0,str(ROOT))
from fit import axes
P=np.array(json.loads((ROOT/'calibration.json').read_text())['parameters'])
R,U,L=axes(P);CAM=R*P[5]+U*P[6]+L*P[3]
def ray(pixel):return R*(pixel[0]-687)/P[4]+U*(572.5-pixel[1])/P[4]-L
def at_y(pixel,y):
 v=ray(pixel);return CAM+v*((y-CAM[1])/v[1])
def at_z(pixel,z):
 v=ray(pixel);return CAM+v*((z-CAM[2])/v[2])
def project(v):
 d=P[3]-np.dot(v,L)
 return np.array([687+P[4]*(np.dot(v,R)-P[5])/d,572.5-P[4]*(np.dot(v,U)-P[6])/d])
def solve():
 bd=P[9];front=-bd-.55
 peak=at_y((593,331),front);left=at_y((364,493),front);right=at_y((822,502),front)
 direction=(right-peak)[[0,2]]
 def cross(y):
  d=(at_y((954,430),y)-at_y((780,305),y))[[0,2]]
  return np.linalg.det(np.array([direction,d]))
 back=-cross(0)/(cross(1)-cross(0))
 result={'camera':P.tolist(),'centralFront':front,'centralBack':back,
 'centralPeak':peak.tolist(),'centralLeft':left.tolist(),'centralRight':right.tolist(),
 'centralRearPeak':at_y((780,305),back).tolist(),'centralRearRight':at_y((954,430),back).tolist(),
 'wingRidgeLeft':at_y((270,418),0).tolist(),'wingRidgeRight':at_y((1110,443),0).tolist(),
 'doorBottom':at_y((605,821),-bd-.05).tolist(),'doorTop':at_y((607,612),-bd-.05).tolist(),
 'columnTopLeft':at_y((421,539),-bd-.32).tolist(),'columnBottomLeft':at_y((421,777),-bd-.32).tolist(),
 'columnTopRight':at_y((785,557),-bd-.32).tolist(),'columnBottomRight':at_y((785,811),-bd-.32).tolist(),
 'stairsLeft':at_z((278,880),0).tolist(),'stairsRight':at_z((787,931),0).tolist(),
 'clockCenter':at_y((592,450),front-.025).tolist()}
 (ROOT/'design.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
 return result
if __name__=='__main__':solve()
