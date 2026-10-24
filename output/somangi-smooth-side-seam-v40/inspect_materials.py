import bpy
from pathlib import Path
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody']
for mat in b.data.materials:
 print('MATERIAL',mat.name)
 for n in mat.node_tree.nodes:
  print(n.type,n.name, ('IMAGE '+str(n.image.name)+' '+str(n.image.size[:])) if n.type=='TEX_IMAGE' else '')
 for l in mat.node_tree.links:print('LINK',l.from_node.name,l.from_socket.name,'->',l.to_node.name,l.to_socket.name)
