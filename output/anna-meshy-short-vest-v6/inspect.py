import bpy,bmesh,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-meshy-short-vest-v5/Anna-meshy-short-vest.blend'))
o=bpy.data.objects['Anna_Vest'];report={'has_custom_normals':o.data.has_custom_normals,'materials':[]}
for mat in o.data.materials:
 report['materials'].append({'name':mat.name,'nodes':[(n.name,n.type) for n in mat.node_tree.nodes]})
print(report)
