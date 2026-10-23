import bpy,json,numpy as np,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;root=bpy.data.objects['bread_Prop']
arm=set(meta['armRigidIds']['L']+meta['armRigidIds']['R'])
polys=[list(p.vertices) for p in body.data.polygons if all(i in arm for i in p.vertices)]
rows=[]
for step in range(181):
    f=1+step*.5;scene.frame_set(int(f),subframe=f-int(f));coords=points(body)
    head=BVHTree.FromPolygons([Vector(v) for v in coords[meta['headIds']]],meta['headFaces'],all_triangles=True)
    # The concealed shoulder attachment intentionally overlaps the head. Test the exposed arm surface.
    anchors=[coords[meta['armAnchorIds'][s]] for s in ['L','R']]
    allowed=(coords[:,1]<-.13)&(np.minimum(np.linalg.norm(coords-anchors[0],axis=1),np.linalg.norm(coords-anchors[1],axis=1))>.18)
    faces=[p for p in polys if all(allowed[i] for i in p)]
    exposed=BVHTree.FromPolygons([Vector(v) for v in coords],faces)
    overlap=len(head.overlap(exposed));food_hits=0
    for ob in root.children_recursive:
        if ob.type!='MESH':continue
        vertices=[ob.matrix_world@v.co for v in ob.data.vertices]
        if max((v-vertices[0]).length for v in vertices)<1e-7:continue
        tree=BVHTree.FromPolygons(vertices,[list(p.vertices) for p in ob.data.polygons])
        food_hits+=len(head.overlap(tree))
    rows.append(dict(frame=f,exposedArmHeadIntersections=overlap,foodHeadIntersections=food_hits))
result=dict(samples=len(rows),armCollisionSamples=sum(r['exposedArmHeadIntersections']>0 for r in rows),foodCollisionSamples=sum(r['foodHeadIntersections']>0 for r in rows),details=rows)
(P/'contact-verification.json').write_text(json.dumps(result,indent=2));print({k:v for k,v in result.items() if k!='details'})
