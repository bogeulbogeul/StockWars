import bpy,numpy as np
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/anna-base-face-v1/input.blend')
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');m=o.data;v=np.array([v.co[:] for v in m.vertices]);bs=m.materials[0].node_tree.nodes.get('Principled BSDF');im=bs.inputs['Base Color'].links[0].from_node.image;w,h=im.size;p=np.array(im.pixels[:]).reshape(h,w,4);uv=np.array([l.uv[:] for l in m.uv_layers.active.data]);idx=np.array([l.vertex_index for l in m.loops]);c=p[np.clip((uv[:,1]*h).astype(int),0,h-1),np.clip((uv[:,0]*w).astype(int),0,w-1),:3]
print('PALETTE',np.median(c[(v[idx,2]>.0)&(v[idx,2]<.4)],axis=0),np.median(c[v[idx,2]>.76],axis=0))
for z in np.arange(.64,.731,.01):
 a=v[(abs(v[:,2]-z)<.005)&(abs(v[:,0])<.15)&(abs(v[:,1])<.15)]
 if len(a):print('STEM',z,len(a),a.min(0),a.max(0))
