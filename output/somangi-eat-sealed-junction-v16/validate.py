import bpy,numpy as np,json,sys
from pathlib import Path
from collections import Counter
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text());n=meta['originalVertexCount']
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-original-collar-v15/somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];reference=[]
for frame in range(1,92,3):
    bpy.context.scene.frame_set(frame);reference.append(points(body))
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];start=meta['torsoVertexStart'];end=meta['torsoVertexEnd']
edge_counts=Counter(tuple(sorted((a,b))) for f in body.data.polygons
    for a,b in zip(f.vertices,list(f.vertices)[1:]+[f.vertices[0]]))
assert all(edge_counts[tuple(sorted(e))]==2 for e in meta['seamEdges'])
coords=points(body);faces=[list(f.vertices) for f in body.data.polygons if all(start<=i<end for i in f.vertices)]
tree=BVHTree.FromPolygons([Vector(p) for p in coords],faces)
lower_ids=np.arange(n+4*len(meta['seamHeadIds']),n+5*len(meta['seamHeadIds']))
signed=[]
for p in coords[lower_ids]:
    hit,normal,_,distance=tree.find_nearest(Vector(p))
    signed.append(float((Vector(p)-hit).dot(normal)))
assert max(signed)<-.0005,max(signed)
maximum=0;lower_error=0;bbox_error=0
for half in range(181):
    frame=1+half*.5;bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame));co=points(body)
    t=(frame-1)/3;j=min(int(t),29);a=t-j
    expected=reference[j]*(1-a)+reference[j+1]*a
    maximum=max(maximum,float(np.max(np.abs(co[:n]-expected))))
    lower_error=max(lower_error,float(np.max(np.abs(co[lower_ids]-np.array(meta['sleeveLower'])))))
    bbox_error=max(bbox_error,float(np.max(np.abs(np.r_[co.min(0),co.max(0)]-np.r_[expected.min(0),expected.max(0)]))))
assert maximum<1e-6,maximum
assert lower_error<1e-6,lower_error
assert bbox_error<1e-6,bbox_error
report={'samples':181,'originalAnimatedVertices':n,'maximumOriginalVertexDifference':maximum,
 'maximumOverallBoundsDifference':bbox_error,'headBoundaryEdgesSharedWithSleeve':len(meta['seamEdges']),
 'openHeadSleeveBoundaryEdges':0,'minimumLowerSleeveOverlap':-max(signed),
 'maximumLowerSleeveMotion':lower_error,'gameInstalled':False}
(P/'junction-validation.json').write_text(json.dumps(report,indent=2));print(report)
