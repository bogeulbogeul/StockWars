import numpy as np
d=np.load('C:/GitHub/StockWars/output/anna-model-v1/surface.npz');v=d['vertices']
for z in np.arange(.64,.741,.005):
 a=v[(abs(v[:,2]-z)<.0025)&(abs(v[:,0])<.13)&(abs(v[:,1])<.13)]
 if len(a):print(round(z,3),len(a),np.round(a.min(0),4).tolist(),np.round(a.max(0),4).tolist())
for z in np.arange(-.34,-.149,.02):
 a=v[(abs(v[:,2]-z)<.003)&(v[:,0]>.24)&(v[:,0]<.32)&(abs(v[:,1])<.13)]
 if len(a):print('HOLE',round(z,3),np.round(a.min(0),4).tolist(),np.round(a.max(0),4).tolist())
