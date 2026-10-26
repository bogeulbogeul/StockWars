import bpy
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/somangi-eat-shoulder-contact-v14/somangi-eat.blend')
m=bpy.data.objects['Somangi_SmoothBody'].data.materials[0]
b=m.node_tree.nodes.get('Principled BSDF')
for p in b.inputs:
 for l in p.links:print('LINK',p.name,l.from_node.name,l.from_socket.name)
print('IMAGES',[(i.name,tuple(i.size)) for i in bpy.data.images if i.type=='IMAGE'])
