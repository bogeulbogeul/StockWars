import bpy,json
from pathlib import Path
from collections import defaultdict
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-motion-ready.blend'))
body=bpy.data.objects['Somangi_SmoothBody']
lookup=defaultdict(list)
for v in body.data.vertices:lookup[tuple(round(c,6) for c in v.co)].append(v.index)
pairs=[ids for ids in lookup.values() if len(ids)>1]
assert len(pairs)>400,len(pairs)
max_gap=0
for i in range(97):
    f=1+i/4
    bpy.context.scene.frame_set(int(f),subframe=f-int(f))
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
    m=ev.to_mesh()
    for ids in pairs:
        max_gap=max(max_gap,max((m.vertices[j].co-m.vertices[ids[0]].co).length for j in ids[1:]))
    ev.to_mesh_clear()
assert max_gap<2e-6,max_gap
report={'samples':97,'sharedCutBoundaryPositions':len(pairs),'maximumAnimatedSeamGap':max_gap}
(P/'seam-validation.json').write_text(json.dumps(report,indent=2))
print('SEAM_VALIDATION',report)
