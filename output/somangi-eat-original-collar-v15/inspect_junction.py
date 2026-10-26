import bpy,sys,json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path('C:/GitHub/StockWars/output/somangi-eat-original-collar-v15');sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text());bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
ob=bpy.data.objects['Somangi_SmoothBody'];start=meta['torsoVertexStart'];end=meta['torsoVertexEnd']
faces=[list(f.vertices) for f in ob.data.polygons if all(start<=i<end for i in f.vertices)]
report=[]
for frame in [1,34,81]:
    bpy.context.scene.frame_set(frame);co=points(ob)
    head=BVHTree.FromPolygons([Vector(p) for p in co[meta['headIds']]],meta['headFaces'])
    torso=BVHTree.FromPolygons([Vector(p) for p in co],faces)
    samples=[]
    for x in [-.15,-.10,-.05,0]:
        for y in [.04,.08,.12,.16,.20]:
            h=head.ray_cast(Vector((x,y,-.3)),Vector((0,0,1)),1)[0]
            t=torso.ray_cast(Vector((x,y,.3)),Vector((0,0,-1)),1)[0]
            if h is not None and t is not None:samples.append({'x':x,'y':y,'headBottom':h.z,'torsoTop':t.z,'gap':h.z-t.z})
    report.append({'frame':frame,'samples':samples})
(P/'junction-inspection.json').write_text(json.dumps(report,indent=2))
for item in report:
    positive=[s for s in item['samples'] if s['gap']>0]
    print('FRAME',item['frame'],'positive gaps',positive)
