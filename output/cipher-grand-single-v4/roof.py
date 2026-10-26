"""Planar tiled hip wings and gabled central portico."""
import bpy,bmesh,math
from exterior_geometry import finish,extrude,box,stroke
def clip(poly,fn):
    out=[]
    for p,q in zip(poly,poly[1:]+poly[:1]):
        a,b=fn(*p),fn(*q)
        if a>=-1e-9:out.append(p)
        if (a>0)!=(b>0):
            t=a/(a-b);out.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
    return out
def slab(name,poly,h,mat,offset=0,thick=.045):
    if len(poly)<3:return
    area=sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(poly,poly[1:]+poly[:1]))
    if abs(area)<1e-8:return
    n=len(poly);verts=[(x,y,h(x,y)+offset-d) for d in (0,thick) for x,y in poly]
    faces=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);finish(obj,mat,.003)
def hip(cx,blue):
    # Square wing roof: four exact planes meet at clean diagonal hips.
    half=1.08;rise=.43;eave=1.95
    planes=[lambda x,y:eave+rise*(1-y/half),lambda x,y:eave+rise*(1+y/half),
            lambda x,y:eave+rise*(1-(x-cx)/half),lambda x,y:eave+rise*(1+(x-cx)/half)]
    rect=[(cx-half,-half),(cx+half,-half),(cx+half,half),(cx-half,half)]
    for k,h in enumerate(planes):
        limits=[lambda x,y,g=g,h=h:g(x,y)-h(x,y) for g in planes if g!=h]
        limits.append(lambda x,y:abs(x)-1.06)
        p=rect[:]
        for fn in limits:p=clip(p,fn)
        slab('Wing_Hip_Roof',p,h,blue)
        for i in range(10):
            for j in range(10):
                x=cx-half+i*2*half/10;y=-half+j*2*half/10;s=2*half/10
                p=[(x+.004,y+.004),(x+s-.004,y+.004),(x+s-.004,y+s-.004),(x+.004,y+s-.004)]
                for fn in limits:p=clip(p,fn)
                slab('Blue_Clay_Roof_Tile_Wing',p,h,blue,.01,.020)
    for dx,dy in [(-half,-half),(-half,half),(half,-half),(half,half)]:
        pts=[(cx+dx*t,dy*t,eave+rise*(1-t)+.013) for t in [i/48 for i in range(49)] if abs(cx+dx*t)>=1.06]
        stroke('Wing_Hip_Sealed_Cap',pts,.017,blue)
    for y in (-half,half):box('Wing_Blue_Eave',(2*half,.042,.065),(cx,y,eave-.04),blue,.005)
    for x in (cx-half,cx+half):
        if abs(x)>=1.06:box('Wing_Blue_Eave',(.042,2*half,.065),(x,0,eave-.04),blue,.005)
def central(blue,cream):
    w=1.17;lo=2.24;peak=2.99
    def h(x):return peak-(peak-lo)*abs(x)/w
    for side in (-1,1):
        a,b=sorted((0,side*w))
        extrude('Central_Pitched_Roof',[(a,h(a)),(b,h(b)),(b,h(b)-.065),(a,h(a)-.065)],-1.49,1.09,blue,.005)
        for i in range(7):
            xa=a+(b-a)*i/7+.003;xb=a+(b-a)*(i+1)/7-.003
            for j in range(10):
                ya=-1.49+j*2.58/10+.004;yb=-1.49+(j+1)*2.58/10-.004
                extrude('Blue_Clay_Roof_Tile_Central',[(xa,h(xa)+.01),(xb,h(xb)+.01),(xb,h(xb)-.012),(xa,h(xa)-.012)],ya,yb,blue,.003)
    for y in (-1.49,1.08):
        extrude('Continuous_Cream_Pediment_Frame',[(-w,lo-.01),(0,peak-.01),(w,lo-.01),
            (w,lo-.10),(0,peak-.10),(-w,lo-.10)],y-.02,y+.02,cream,.006)
        extrude('Central_Pediment',[(-1.10,2.22),(1.10,2.22),(0,2.91)],y+.022,y+.08,cream,.005)
        box('Portico_Entablature',(2.30,.14,.13),(0,y+.045,2.22),cream,.01)
    for j in range(10):
        a=-1.50+j*2.6/10;b=a+2.6/10-.004
        contour=[(.047*math.cos(math.pi*k/24),peak+.047*math.sin(math.pi*k/24)) for k in range(25)]
        extrude('Central_Ridge_Cap',contour,a,b,blue,.003)
