"""Planar roof faces, real intersections, consistent tiles and continuous edges."""
import bpy,math,bmesh
from mathutils import Vector
from exterior_geometry import box,extrude,finish
from roof import clip,slab as base_slab
from polygon_finish import merge_polygons,tile_slab

def build_roof(config):
    w,peak,eave,back,ridge,D,drop,outer=[config[k] for k in ('centralHalfWidth','centralPeak','centralEave','centralBack','wingRidge','wingDepth','centralRearDrop','wingOuterRidgeX')]
    front=-1.49;edge=3.13;we=1.95;rise=ridge-we
    blue=bpy.data.materials['Roof_Blue'];cream=bpy.data.materials['Trim_Cream']
    h=lambda x,y:peak-(peak-eave)*abs(x)/w-drop*(y-front)/(back-front)
    checks=[]
    def slab(name,poly,height,mat,offset=0,thick=.045):
        if 'Tile' not in name:return base_slab(name,poly,height,mat,offset,thick)
        if len(poly)<3:return
        area=abs(sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(poly,poly[1:]+poly[:1])))
        if area<1e-8:return
        x=sum(p[0] for p in poly)/len(poly);y=sum(p[1] for p in poly)/len(poly);eps=1e-5
        normal=Vector((-(height(x+eps,y)-height(x-eps,y))/(2*eps),-(height(x,y+eps)-height(x,y-eps))/(2*eps),1)).normalized()
        obj=tile_slab(name,poly,height,mat,.009/normal.z,.018/normal.z)
        values=[v.co.dot(normal) for v in obj.data.vertices]
        measured=max(values)-min(values);assert abs(measured-.018)<2e-6
        checks.append(measured)
    def steps(a,b,s):
        while a<b-1e-8:
            yield a,min(a+s,b);a+=s
    def cap(name,a,b,r=.07,height=.04,seat=.030):
        a,b=Vector(a),Vector(b);axis=(b-a).normalized();length=(b-a).length
        up=(Vector((0,0,1))-axis*axis.z).normalized();across=axis.cross(up).normalized()
        for lo,hi in steps(0,length,.24):
            profile=[across*(r*math.cos(math.pi*i/32))+up*((height+seat)*math.sin(math.pi*i/32)-seat) for i in range(33)]
            profile.append(up*(-.010));n=len(profile)
            vertices=[tuple(p+v) for p in (a+axis*(lo+.001),a+axis*(hi-.001)) for v in profile]
            faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
            mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces)
            bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
            obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);finish(obj,blue,.003)
    for side in (-1,1):
        planes=[lambda u,y:ridge-rise*y/D,lambda u,y:ridge+rise*y/D,
                lambda u,y:ridge-rise*(u-outer)/(edge-outer)]
        for k,height in enumerate(planes):
            limits=[lambda u,y,g=g:g(u,y)-height(u,y) for g in planes if g!=height]
            def emit(name,poly,offset=0,thick=.045):
                for fn in limits:poly=clip(poly,fn)
                parts=[]
                for inside in (True,False):
                    p=clip(poly,lambda u,y:w-u if inside else u-w)
                    if inside:p=clip(p,lambda u,y:height(u,y)-h(u,y)-.004)
                    parts.append([(side*u,y) for u,y in p])
                for p in merge_polygons(parts):slab(name,p,lambda x,y:height(abs(x),y),blue,offset,thick)
            emit('Ref_Wing_Roof',[(.60,-D),(edge,-D),(edge,D),(.60,D)])
            du=.20/math.sqrt(1+(rise/(edge-outer))**2) if k==2 else .28
            dy=.28 if k==2 else .20/math.sqrt(1+(rise/D)**2)
            gu=.005*du/(.20 if k==2 else .28);gy=.005*dy/(.28 if k==2 else .20)
            for a,b in steps(edge-math.ceil((edge-.60)/du)*du,edge,du):
                for c,d in steps(-D,D,dy):
                    emit('Ref_Wing_Tile',[(a+gu/2,c+gy/2),(b-gu/2,c+gy/2),(b-gu/2,d-gy/2),(a+gu/2,d-gy/2)],.009,.018)
        inner=(peak-drop*(0-front)/(back-front)-ridge)*w/(peak-eave)
        cap('Ref_Wing_Ridge',(side*(inner-.015),0,ridge+.012),(side*outer,0,ridge+.012),.070,.030,.030)
        for sy in (-1,1):
            cap('Ref_Wing_Hip',(side*outer,0,ridge+.012),(side*edge,sy*D,we+.012),.060,.028,.028)
            box('Ref_Wing_Eave',(edge-w+.03,.044,.065),(side*(edge+w-.03)/2,sy*D,we-.04),blue,.004)
        box('Ref_Wing_Eave',(.044,2*D,.065),(side*edge,0,we-.04),blue,.004)
        box('Ref_Wing_Soffit',(2.10,2*D-.06,.10),(side*2.05,0,1.875),cream,.008)
    def central(name,poly,mat,offset=0,thick=.065):
        cuts=sorted(set((front,-D,0,D,back)))
        parts=[]
        for ya,yb in zip(cuts,cuts[1:]):
            ya=max(front,ya);yb=min(back,yb)
            if yb<=ya:continue
            p=clip(clip(poly,lambda x,y:y-ya),lambda x,y:yb-y)
            if ya>=-D and yb<=D:
                sign=-1 if yb<=0 else 1
                p=clip(p,lambda x,y:h(x,y)-(ridge-rise*sign*y/D)-.004)
            parts.append(p)
        for p in merge_polygons(parts):slab(name,p,h,mat,offset,thick)
    for side in (-1,1):
        a,b=sorted((0,side*w))
        central('Ref_Central_Roof',[(a,front),(b,front),(b,back),(a,back)],blue)
        dx=.20/math.sqrt(1+((peak-eave)/w)**2)
        dy=.28/math.sqrt(1+(drop/(back-front))**2)
        for xa,xb in steps(a,b,dx):
            for ya,yb in steps(front,back,dy):
                gx=.005*dx/.20;gy=.005*dy/.28
                central('Ref_Central_Tile',[(xa+gx/2,ya+gy/2),(xb-gx/2,ya+gy/2),(xb-gx/2,yb-gy/2),(xa+gx/2,yb-gy/2)],blue,.009,.018)
        # Constant blue fascia around the front gable, backed by a cream triangle.
        nz=1/math.sqrt(1+((peak-eave)/w)**2)
        contour=[(a,h(a,front)+.009/nz),(b,h(b,front)+.009/nz),
                 (b,h(b,front)-.046/nz),(a,h(a,front)-.046/nz)]
        extrude('Ref_Blue_Gable_Edge',contour,front-.045,front+.014,blue,.002)
        # Close the underside of the central eave rather than leaving a dark slot.
        xa,xb=sorted((side*(w-.13),side*(w-.035)))
        central('Ref_Central_Side_Cornice',[(xa,front),(xb,front),(xb,back),(xa,back)],cream,-.045,.11)
        # Shallow flashing follows the actual intersection of the two planes.
        for sy in (-1,1):
            y0=0
            def cross_x(y):return (peak-drop*(y-front)/(back-front)-(ridge-rise*abs(y)/D))*w/(peak-eave)
            last=0
            for i in range(1,501):
                y=sy*D*i/500
                if cross_x(y)>w:break
                last=y
            if last:
                x0=cross_x(0);x1=cross_x(last)
                poly=[(side*(x0-.015),0),(side*(x0+.015),0),
                      (side*(x1+.015),last),(side*(x1-.015),last)]
                base_slab('Ref_Sealed_Roof_Intersection',poly,
                    lambda x,y:ridge-rise*abs(y)/D,blue,.016,.026)
    for y in (front,back):
        e=h(w,y);p=h(0,y)
        extrude('Ref_Cream_Pediment',[(-w+.05,e-.075),(w-.05,e-.075),(0,p-.045)],y+.014,y+.09,cream,.005)
        outerpoly=[(-w+.02,e-.10),(w-.02,e-.10),(0,p-.035)]
        innerpoly=[(-w+.20,e+.005),(w-.20,e+.005),(0,p-.16)]
        n=3;verts=[(x,yy,z) for yy in (y-.018,y+.018) for poly in (outerpoly,innerpoly) for x,z in poly]
        faces=[]
        for i in range(n):
            j=(i+1)%n;faces += [(i,j,3+j,3+i),(6+i,9+i,9+j,6+j),(i,6+i,6+j,j),(3+i,3+j,9+j,9+i)]
        mesh=bpy.data.meshes.new('Ref_Triangular_Frame');mesh.from_pydata(verts,[],faces)
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
        obj=bpy.data.objects.new('Ref_Cream_Triangular_Frame',mesh);bpy.context.collection.objects.link(obj);finish(obj,cream,.005)
    cap('Ref_Central_Ridge',(0,front-.035,peak-.006),(0,back+.015,peak-drop-.006),.068,.048,.040)
    return {'tileCount':len(checks),'minimumTileThickness':min(checks),'maximumTileThickness':max(checks)}
