"""Inspect the saved native junction meshes for open or nonmanifold edges."""
import bpy,bmesh,json
from pathlib import Path
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'CipherSecurities-roof-reference.blend'))
report=[]
for obj in bpy.context.scene.objects:
    if not obj.name.startswith('Wing_Closed_Threeway_Junction'):continue
    bm=bmesh.new();bm.from_mesh(obj.data)
    bad=sum(not edge.is_manifold for edge in bm.edges)
    volume=abs(bm.calc_volume())
    report.append({'name':obj.name,'nonManifoldEdges':bad,'volume':volume})
    bm.free()
    assert bad==0 and volume>0,obj.name
assert len(report)==2
(root/'junction-validation.json').write_text(json.dumps(report,indent=2))
print('JUNCTION_CHECK_PASS',report)
