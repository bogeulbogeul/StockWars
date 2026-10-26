import bpy,json,sys,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];root=bpy.data.objects['bread_Prop']
rows=[]
for step in range(115):
    frame=1+step*.5;scene.frame_set(int(frame),subframe=frame-int(frame))
    coords=points(body);head=BVHTree.FromPolygons([Vector(p) for p in coords[meta['headIds']]],meta['headFaces'],all_triangles=True)
    loaf=bpy.data.objects['Bread roll'];verts=[loaf.matrix_world@v.co for v in loaf.data.vertices]
    if max((v-verts[0]).length for v in verts)<1e-7:continue
    faces=[list(f.vertices) for f in loaf.data.polygons];food=BVHTree.FromPolygons(verts,faces)
    overlap=len(head.overlap(food));gaps={}
    for side in ['L','R']:
        gaps[side]=min(food.find_nearest(Vector(p))[3] for p in coords[meta['palmIds'][side]])
    rows.append(dict(frame=frame,headIntersectingTriangles=overlap,palmSurfaceDistance=gaps))
result={'samples':len(rows),'headTriangleIntersectionSamples':sum(r['headIntersectingTriangles']>0 for r in rows),'maximumPalmSurfaceDistance':{s:max(r['palmSurfaceDistance'][s] for r in rows) for s in ['L','R']},'details':rows}
(P/'contact-verification.json').write_text(json.dumps(result,indent=2));print({k:v for k,v in result.items() if k!='details'})
