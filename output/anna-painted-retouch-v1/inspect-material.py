import bpy,json,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'input.blend'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH');print('MATRIX',o.matrix_world[:])
for a in o.data.materials:
 print('NODES',[(n.name,n.type,n.image.name if n.type=='TEX_IMAGE' else '') for n in a.node_tree.nodes])
 for node in a.node_tree.nodes:
  if node.type=='TEX_IMAGE':
   im=node.image;print('IMAGE',im.name,im.size[:],im.colorspace_settings.name);im.filepath_raw=str(P/(node.name+'.png'));im.file_format='PNG';im.save()
