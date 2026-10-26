import bpy,json,numpy as np,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene
scene.frame_set(1);base=points(body);records={}
for side in ['L','R']:
    ids=set(meta['armRigidIds'][side]);used=set();edges=set()
    for poly in body.data.polygons:
        vs=list(poly.vertices)
        if all(i in ids for i in vs):
            used.update(vs)
            edges.update(tuple(sorted((a,b))) for a,b in zip(vs,vs[1:]+vs[:1]))
    edges=np.array(sorted(edges));length=np.linalg.norm(base[edges[:,0]]-base[edges[:,1]],axis=1)
    valid=length>1e-5;edges=edges[valid];length=length[valid]
    anchor=meta['armAnchorIds'][side];palms=meta['palmIds'][side]
    span=float(np.linalg.norm(base[palms].mean(0)-base[anchor]))
    records[side]=dict(edges=edges,baseline=length,span=span,minSpan=span,maxSpan=span,maxEdgeIncrease=0.,minEdgeChange=0.)
for step in range(181):
    f=1+step*.5;scene.frame_set(int(f),subframe=f-int(f));coords=points(body)
    for side,r in records.items():
        e=r['edges'];change=np.linalg.norm(coords[e[:,0]]-coords[e[:,1]],axis=1)/r['baseline']-1
        r['maxEdgeIncrease']=max(r['maxEdgeIncrease'],float(change.max()))
        r['minEdgeChange']=min(r['minEdgeChange'],float(change.min()))
        span=float(np.linalg.norm(coords[meta['palmIds'][side]].mean(0)-coords[meta['armAnchorIds'][side]]))
        r['minSpan']=min(r['minSpan'],span);r['maxSpan']=max(r['maxSpan'],span)
result={'samples':181,'arms':{}}
for side,r in records.items():
    result['arms'][side]={k:v for k,v in r.items() if k not in ['edges','baseline']}
    result['arms'][side]['maximumLengthIncreasePercent']=(r['maxSpan']/r['span']-1)*100
(P/'arm-length-verification.json').write_text(json.dumps(result,indent=2));print(result)
