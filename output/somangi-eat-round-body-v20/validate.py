import bpy,json,numpy as np,sys
from pathlib import Path
from collections import Counter
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-soft-waist-v19/somangi-eat.blend'))
ob=bpy.data.objects['Somangi_SmoothBody'];reference=[]
for f in range(1,92,3):bpy.context.scene.frame_set(f);reference.append(points(ob))
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));ob=bpy.data.objects['Somangi_SmoothBody']
unchanged=np.ones(len(ob.data.vertices),dtype=bool);unchanged[meta['roundBodyEditedIds']]=False
palms=[i for ids in meta['palmIds'].values() for i in ids];head=meta['headIds']
edges=Counter(tuple(sorted((a,b))) for f in ob.data.polygons for a,b in zip(f.vertices,list(f.vertices)[1:]+[f.vertices[0]]))
layout=meta['junction']
assert all(edges[tuple(sorted((a,b)))]==2 for loop in [layout['upper'],layout['lower'],*layout['rings']]
    for a,b in zip(loop,loop[1:]+loop[:1]))
maximum=0;head_error=0;hand_error=0
for half in range(181):
    frame=1+half*.5;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame));co=points(ob)
    t=(frame-1)/3;j=min(int(t),29);w=t-j;expected=reference[j]*(1-w)+reference[j+1]*w
    maximum=max(maximum,float(np.max(np.abs(co[unchanged]-expected[unchanged]))))
    head_error=max(head_error,float(np.max(np.abs(co[head]-expected[head]))))
    hand_error=max(hand_error,float(np.max(np.abs(co[palms]-expected[palms]))))
assert max(maximum,head_error,hand_error)<1e-6
report={'samples':181,'maximumUneditedVertexDifference':maximum,'maximumHeadDifference':head_error,
 'maximumPalmDifference':hand_error,'openJunctionBoundaryEdges':0,
 'roundedBodyVertices':len(meta['roundBodyEditedIds']),'gameInstalled':False}
(P/'round-body-validation.json').write_text(json.dumps(report,indent=2));print(report)
