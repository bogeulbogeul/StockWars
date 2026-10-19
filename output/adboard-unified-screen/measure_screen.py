import bpy,numpy as np
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/adboard-unified-screen/AdBoard.blend')
o=next(o for o in bpy.context.scene.objects if o.type=='MESH'); m=o.data; mat=m.materials[0]; p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'); im=p.inputs['Base Color'].links[0].from_node.image
w,h=im.size; px=np.array(im.pixels[:]).reshape(h,w,4); uv=np.array([u.uv[:] for u in m.uv_layers.active.data]).reshape(-1,3,2).mean(axis=1)
c=px[np.clip((uv[:,1]*h).astype(int),0,h-1),np.clip((uv[:,0]*w).astype(int),0,w-1),:3]
points=np.array([(o.matrix_world@f.center)[:] for f in m.polygons]); mask=(c.max(axis=1)<.24)&(c.max(axis=1)-c.min(axis=1)<.06)
for y in [-1,1]:
 a=points[mask&(points[:,1]*y>0)]
 print('DARK',y,len(a),'quantiles',np.quantile(a,[0,.01,.05,.5,.95,.99,1],axis=0).tolist(),flush=True)
