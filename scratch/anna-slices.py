import numpy as np
from pathlib import Path
d=np.load('C:/GitHub/StockWars/output/anna-model-v1/surface.npz');v=d['vertices'];n=d['normals']
for z in [-.15,-.2,-.28,-.38,-.46,-.50]:
 print('SLICE',z)
 for x in np.arange(0,.36,.02):
  ids=np.where((abs(v[:,2]-z)<.007)&(abs(v[:,0]-x)<.007)&(v[:,1]<-.1))[0]
  if len(ids):
   i=ids[np.argmin(v[ids,1])];print(round(x,2),np.round(v[i],3).tolist(),np.round(n[i],2).tolist())
