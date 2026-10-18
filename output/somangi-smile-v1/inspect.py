import bpy,numpy as np,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-walk-v3/somangi-walk.blend'))
m=bpy.data.objects['Somangi_Body'];bs=m.data.materials[0].node_tree.nodes.get('Principled BSDF');link=bs.inputs['Base Color'].links[0];im=link.from_node.image
im.filepath_raw=str(P/'base-original.png');im.file_format='PNG';im.save()
a=np.array(im.pixels[:]).reshape(im.size[1],im.size[0],4);uv=m.data.uv_layers.active;points=[]
for poly in m.data.polygons:
 for loop in poly.loop_indices:
  v=m.data.vertices[m.data.loops[loop].vertex_index];u=uv.data[loop].uv;x=int(u.x*(im.size[0]-1));y=int(u.y*(im.size[1]-1))
  if v.co.z>0 and v.co.y<-.15 and a[y,x,:3].mean()<.25:points.append(list(v.co))
print('DARK_POINTS',np.min(points,axis=0).tolist(),np.max(points,axis=0).tolist(),np.percentile(points,[10,50,90],axis=0).tolist())
print('TEXTURE',im.name,list(im.size))
