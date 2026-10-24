import bpy,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-rear-junction-v43/somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody']
print('IMAGES',[(im.name,tuple(im.size)) for im in bpy.data.images])
for n in b.data.materials[0].node_tree.nodes:
 print('NODE',n.name,n.type,n.image.name if n.type=='TEX_IMAGE' and n.image else '')
print('OBJECTS',[(o.name,o.type) for o in bpy.context.scene.objects])
for index,mat in enumerate(b.data.materials):
 faces=[f for f in b.data.polygons if f.material_index==index];ids=set(i for f in faces for i in f.vertices)
 print('MAT',index,mat.name,len(faces),np.min([b.data.vertices[i].co[:] for i in ids],axis=0) if ids else '')
 if index==1:print('INKLINKS',[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name) for l in mat.node_tree.links])
