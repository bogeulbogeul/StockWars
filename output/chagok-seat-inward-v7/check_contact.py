"""Read-only triangle/inside-surface inspection at the installed game transform."""
import bpy,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent;ROOT=P.parents[1]
paths=[P.parent/'chagok-original-sit-v6/chagok-seated.glb',ROOT/'web/assets/office/3d/Bank-furnished-room.glb']
hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(paths[0]))
characters=[o for o in bpy.context.scene.objects if o.type=='MESH']
for ob in characters:
    ob.scale=(100/1.9000606,)*3;ob.location=(0,103,66.70000343)
bpy.ops.import_scene.gltf(filepath=str(paths[1]))
chairs=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith('Executive')]
for ob in chairs:
    ob.scale*=100;ob.location*=100;ob.location.z-=2.4
bpy.context.view_layer.update()
def geometry(ob):
    verts=[ob.matrix_world@v.co for v in ob.data.vertices]
    polys=[list(p.vertices) for p in ob.data.polygons]
    return verts,BVHTree.FromPolygons(verts,polys),Vector(tuple(min(v[i] for v in verts) for i in range(3))),Vector(tuple(max(v[i] for v in verts) for i in range(3)))
def inside_samples(points,bvh,lo,hi):
    count=0;depth=0;deepest=None
    for p in points:
        if any(p[i]<lo[i]-.001 or p[i]>hi[i]+.001 for i in range(3)):continue
        near,normal,_,distance=bvh.find_nearest(p)
        if near is not None and distance>.001 and (p-near).dot(normal)<-.001:
            votes=0
            for direction in [Vector((1,.137,.073)).normalized(),Vector((.113,1,.091)).normalized(),Vector((.079,.127,1)).normalized()]:
                origin=p.copy();hits=0
                for _ in range(100):
                    hit,_,_,_=bvh.ray_cast(origin,direction)
                    if hit is None:break
                    hits+=1;origin=hit+direction*.0001
                votes+=hits%2
            if votes<2:continue
            count+=1
            if distance>depth:depth=distance;deepest=list(p)
    return dict(count=count,maximumDepth=depth,deepestPoint=deepest)
cg={o.name:geometry(o) for o in characters}
results=[]
for chair in chairs:
    cv,cb,cl,ch=geometry(chair)
    for name,(v,b,lo,hi) in cg.items():
        if any(hi[i]<cl[i] or lo[i]>ch[i] for i in range(3)):continue
        pairs=b.overlap(cb)
        a=inside_samples(v,cb,cl,ch);c=inside_samples(cv,b,lo,hi)
        results.append(dict(chair=chair.name,character=name,trianglePairs=len(pairs),
            characterVerticesInsideChair=a,chairVerticesInsideCharacter=c))
assert all(hashlib.sha256(p.read_bytes()).hexdigest()==hashes[str(p)] for p in paths)
(P/'contact-report.json').write_text(json.dumps(dict(units='game world units',hashes=hashes,
    method='World-space BVH triangle intersections and signed vertex candidates confirmed by majority parity of three ray directions; epsilon 0.001. Depth is sampled nearest-surface distance, not a global penetration solver.',
    sourceUnchanged=True,results=results),indent=2))
for r in results:
    print(r['chair'],r['trianglePairs'],r['characterVerticesInsideChair']['count'],r['characterVerticesInsideChair']['maximumDepth'],r['chairVerticesInsideCharacter']['maximumDepth'])




