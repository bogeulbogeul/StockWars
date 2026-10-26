import bpy,json,numpy as np
from pathlib import Path
from mathutils.kdtree import KDTree
P=Path(__file__).resolve().parent
def weights(b,v):return {b.vertex_groups[g.group].name:float(g.weight) for g in v.groups}
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-continuous-shoulder-v41/somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];torso={i for f in b.data.polygons if f.material_index==5 for i in f.vertices}
reference=[(b.data.vertices[i].co.copy(),weights(b,b.data.vertices[i])) for i in torso if b.data.vertices[i].co.z<-.15001]
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];tree=KDTree(len(b.data.vertices))
for v in b.data.vertices:tree.insert(v.co,v.index)
tree.balance();distance=0.;error=0.
for co,w in reference:
 _,i,d=tree.find(co);distance=max(distance,d);actual=weights(b,b.data.vertices[i]);error=max(error,max(abs(w.get(n,0)-actual.get(n,0)) for n in w.keys()|actual.keys()))
result=dict(originalTorsoVerticesBelowJoin=len(reference),maximumPositionChange=distance,maximumWeightChange=error)
(P/'preserved-torso.json').write_text(json.dumps(result,indent=2));print(result)
assert distance<1e-7 and error<1e-7
