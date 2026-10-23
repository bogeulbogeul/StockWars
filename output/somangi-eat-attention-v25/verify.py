import bpy,json,numpy as np,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
meta=json.loads((P/'metadata.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
scene=bpy.context.scene;body=bpy.data.objects['Somangi_SmoothBody'];food=bpy.data.objects['bread_Prop'];rig=bpy.data.objects['Somangi_RigidArms']
base=np.array([v.co[:] for v in body.data.vertices]);armset=set(meta['armRigidIds']['L']+meta['armRigidIds']['R'])
faces=[list(p.vertices) for p in body.data.polygons if not any(i in armset for i in p.vertices)]
armfaces=[list(p.vertices) for p in body.data.polygons if all(i in armset for i in p.vertices)]
distal=[]
for s in ['L','R']:
    ids=np.array(meta['rigidArmUsedIds'][s]);anchor=base[meta['armAnchorIds'][s]]
    distal.extend(ids[np.linalg.norm(base[ids]-anchor,axis=1)>.18].tolist())
rows=[]
for step in range(181):
    f=1+step*.5;scene.frame_set(int(f),subframe=f-int(f));coords=points(body)
    tree=BVHTree.FromPolygons([Vector(v) for v in coords],faces)
    penetration=0.
    for x,y,z in coords[distal]:
        if z>-.08:continue
        hit,_,_,_=tree.ray_cast(Vector((x,-2,z)),Vector((0,1,0)),4)
        if hit is not None:penetration=max(penetration,float(y-hit.y))
    head=BVHTree.FromPolygons([Vector(v) for v in coords[meta['headIds']]],meta['headFaces'],all_triangles=True)
    anchors=[coords[meta['armAnchorIds'][s]] for s in ['L','R']]
    allowed=(coords[:,1]<-.13)&(np.minimum(np.linalg.norm(coords-anchors[0],axis=1),np.linalg.norm(coords-anchors[1],axis=1))>.18)
    exposed=BVHTree.FromPolygons([Vector(v) for v in coords],[p for p in armfaces if all(allowed[i] for i in p)])
    armhead=len(head.overlap(exposed));foodhead=0
    for ob in food.children_recursive:
        if ob.type!='MESH':continue
        vs=[ob.matrix_world@v.co for v in ob.data.vertices]
        if max((v-vs[0]).length for v in vs)<1e-7:continue
        foodhead+=len(head.overlap(BVHTree.FromPolygons(vs,[list(p.vertices) for p in ob.data.polygons])))
    rows.append(dict(frame=f,torsoPenetration=penetration,armHeadTriangles=armhead,foodHeadTriangles=foodhead))
scene.frame_set(83);final={s:rig.pose.bones['Arm.'+s].matrix.copy() for s in ['L','R']}
scene.frame_set(91);enderror=max(max(abs(x-y) for ra,rb in zip(final[s],rig.pose.bones['Arm.'+s].matrix) for x,y in zip(ra,rb)) for s in final)
result=dict(samples=181,maximumTorsoPenetration=max(r['torsoPenetration'] for r in rows),armHeadCollisionSamples=sum(r['armHeadTriangles']>0 for r in rows),foodHeadCollisionSamples=sum(r['foodHeadTriangles']>0 for r in rows),finalHoldError=enderror,details=rows)
(P/'verification.json').write_text(json.dumps(result,indent=2));print({k:v for k,v in result.items() if k!='details'})
