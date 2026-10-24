import bpy,json,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-rigid-whole-arms-v38/somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];old=np.array([v.co[:] for v in b.data.vertices]);original=[set() for v in b.data.vertices]
for f in b.data.polygons:
 for i in f.vertices:original[i].add(f.material_index)
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));b=bpy.data.objects['Somangi_SmoothBody'];new=np.array([v.co[:] for v in b.data.vertices]);changes=json.loads((P/'changes.json').read_text());allowed=set(changes['hiddenCapVertices']+changes['torsoSocketVertices']);diff=np.max(np.abs(new-old),axis=1);changed=set(np.flatnonzero(diff>0).tolist());arms=set(sum(json.loads((P/'arm-vertices.json').read_text()).values(),[]));visible=[i for i in arms if 0 in original[i]];head=set(json.loads((P.parent/'somangi-eat-unbent-v35/metadata.json').read_text())['headIds'])
result=dict(visibleArmPositionMaxDifference=float(np.max(diff[visible])),originalHeadPositionMaxDifference=float(np.max(diff[list(head)])),onlySpecifiedConnectionVerticesChanged=changed<=allowed,changedVertices=len(changed),unchangedVertices=len(old)-len(changed),vertexCount=len(old),materials=[m.name for m in b.data.materials])
(P/'shape-preservation.json').write_text(json.dumps(result,indent=2));print(result)
assert result['visibleArmPositionMaxDifference']==0 and result['originalHeadPositionMaxDifference']==0 and result['onlySpecifiedConnectionVerticesChanged']
