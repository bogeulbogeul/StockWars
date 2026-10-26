import bpy,numpy as np,json,sys
from pathlib import Path
from collections import Counter
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text());layout=meta['junction'];n=meta['sourceVertexCount']
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-shoulder-natural-v17/somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];reference=[]
for f in range(1,92,3):bpy.context.scene.frame_set(f);reference.append(points(body))
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));body=bpy.data.objects['Somangi_SmoothBody']
counts=Counter(tuple(sorted((a,b))) for f in body.data.polygons for a,b in zip(f.vertices,list(f.vertices)[1:]+[f.vertices[0]]))
for loop in [layout['upper'],layout['lower'],*layout['rings']]:
    assert all(counts[tuple(sorted((a,b)))]==2 for a,b in zip(loop,loop[1:]+loop[:1]))
new_edges={e for e in counts if max(e)>=n};open_edges=[e for e in new_edges if counts[e]!=2]
assert not open_edges,len(open_edges)
unchanged=np.ones(n,dtype=bool);unchanged[meta['upperBodyEditedIds']+meta['armEditedIds']]=False
palms=[i for ids in meta['palmIds'].values() for i in ids];maximum=0;head=0;hand=0
for half in range(181):
    frame=1+half*.5;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame));co=points(body)
    t=(frame-1)/3;j=min(int(t),29);a=t-j;expected=reference[j]*(1-a)+reference[j+1]*a
    maximum=max(maximum,float(np.max(np.abs(co[:n][unchanged]-expected[unchanged]))))
    head=max(head,float(np.max(np.abs(co[meta['headIds']]-expected[meta['headIds']]))))
    hand=max(hand,float(np.max(np.abs(co[palms]-expected[palms]))))
assert maximum<1e-6,maximum
assert head<1e-6,head
assert hand<1e-6,hand
report={'samples':181,'maximumUneditedPositionDifference':maximum,'maximumHeadPositionDifference':head,
 'maximumPalmPositionDifference':hand,'headBoundaryEdges':len(layout['upper']),
 'bodyBoundaryEdges':len(layout['lower']),'openJunctionEdges':len(open_edges),
 'overlappingOldSleeveFacesRemoved':True,'gameInstalled':False}
(P/'surface-validation.json').write_text(json.dumps(report,indent=2));print(report)
