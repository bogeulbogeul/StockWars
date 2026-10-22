import bpy,json
from pathlib import Path
P=Path(__file__).resolve().parent
previous=P.parent/'somangi-marked-boundary-mesh-v1'
def read(folder):
    bpy.ops.wm.open_mainfile(filepath=str(folder/'somangi-motion-ready.blend'))
    obj=bpy.data.objects['Somangi_SmoothBody']
    report=json.loads((folder/'build-validation.json').read_text())
    result={}
    for name,data in report['parts'].items():
        group=obj.vertex_groups['Part.'+name].index
        values=[tuple(v.co) for v in obj.data.vertices if any(g.group==group for g in v.groups)]
        result[name]=values[:data['surfaceVertices']]
    return result
before=read(previous);after=read(P)
changes={}
for name,points in before.items():
    assert len(points)==len(after[name]),name
    changes[name]=max(sum((a-b)**2 for a,b in zip(p,q))**.5 for p,q in zip(points,after[name]))
assert max(changes.values())==0,changes
report={'previous':str(previous),'outerSurfaceAndCutVerticesMaxDisplacement':changes,
    'sameMarkedCutBoundaries':True,'onlyInteriorCapsWeightsAndHipPivotsChanged':True}
(P/'preservation-validation.json').write_text(json.dumps(report,indent=2))
print('PRESERVATION',report)
