"""Remove construction cuts before giving a roof tile its physical edge."""
import bpy,bmesh
from exterior_geometry import finish

def merge_polygons(polygons):
    polygons=[p for p in polygons if len(p)>=3]
    points={tuple(round(v,8) for v in p) for polygon in polygons for p in polygon}
    boundary=set()
    for polygon in polygons:
        area=sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(polygon,polygon[1:]+polygon[:1]))
        if abs(area)<1e-10:continue
        if area<0:polygon=polygon[::-1]
        for a,b in zip(polygon,polygon[1:]+polygon[:1]):
            a=tuple(round(v,8) for v in a);b=tuple(round(v,8) for v in b)
            dx=b[0]-a[0];dy=b[1]-a[1];length=dx*dx+dy*dy
            if length<1e-16:continue
            cuts=[]
            for p in points:
                t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length
                cross=(p[0]-a[0])*dy-(p[1]-a[1])*dx
                if -1e-8<=t<=1+1e-8 and abs(cross)<1e-8:
                    cuts.append((t,p))
            cuts.sort()
            for (_,p),(_,q) in zip(cuts,cuts[1:]):
                if p==q:continue
                if (q,p) in boundary:boundary.remove((q,p))
                else:boundary.add((p,q))
    loops=[]
    while boundary:
        a,b=boundary.pop();loop=[a,b]
        while loop[-1]!=loop[0]:
            choices=[edge for edge in boundary if edge[0]==loop[-1]]
            assert choices,('Open construction boundary',loop[-1])
            edge=choices[0];boundary.remove(edge);loop.append(edge[1])
        loop.pop()
        # Dissolve collinear construction vertices as well as their old edges.
        changed=True
        while changed and len(loop)>3:
            changed=False
            for i,p in enumerate(loop):
                a=loop[i-1];b=loop[(i+1)%len(loop)]
                if abs((p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]))<1e-8:
                    loop.pop(i);changed=True;break
        loops.append(loop)
    return loops

def tile_slab(name,poly,h,mat,offset,thick):
    n=len(poly)
    vertices=[(x,y,h(x,y)+offset-d) for d in (0,thick) for x,y in poly]
    faces=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    finish(obj,mat,.0012)
    return obj
