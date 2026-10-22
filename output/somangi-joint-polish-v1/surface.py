import bpy, math
from collections import defaultdict
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def build_surface(source,close_parts=False):
    src=source.data
    src.update()
    points=[v.co.copy() for v in src.vertices]
    source_tree=BVHTree.FromPolygons(points,[list(p.vertices) for p in src.polygons],all_triangles=True)
    uv=src.uv_layers.active
    normals=[n.vector.copy() for n in src.corner_normals]
    lookup={};weld=[];ids=[]
    for point in points:
        key=tuple(round(v,6) for v in point)
        if key not in lookup:lookup[key]=len(weld);weld.append(point)
        ids.append(lookup[key])
    # Trace the user's red front-view contour in model coordinates.
    # Image calibration: center x=272, crown y=64, sole y=609, ~287px/unit.
    def neck(x):return -.024+.035*min(1,abs(x)/.24)**4
    def belly(x):return -.675+.065*min(1,abs(x)/.30)**2
    def shoulder(z):
        knots=[(-.24,.255),(-.16,.222),(-.08,.225),(0,.245),(.02,.25)]
        if z<-.24:return .255+.60*min(.10,-z-.24)+.35*max(0,-z-.34)
        if z>.02:return .25
        for (a,x),(b,y) in zip(knots,knots[1:]):
            if a<=z<=b:return x+(y-x)*(z-a)/(b-a)
    fields=[[(v.z-neck(v.x))/.025 for v in weld]]
    for sign in [1,-1]:fields.append([(sign*v.x-shoulder(v.z))/.15 for v in weld])
    for sign in [1,-1]:fields.append([min((belly(v.x)-v.z)/.12,sign*v.x/.04) for v in weld])
    # Each vertex payload carries surface position, per-corner UV/normal and cut fields.
    triangles=[]
    for poly in src.polygons:
        payload=[]
        for vertex,loop in zip(poly.vertices,poly.loop_indices):
            payload.append((points[vertex].copy(),uv.data[loop].uv.copy(),normals[loop].copy(),
                [field[ids[vertex]] for field in fields]))
        triangles.append(payload)
    def mix(a,b,t):
        return (a[0].lerp(b[0],t),a[1].lerp(b[1],t),a[2].lerp(b[2],t).normalized(),
            [x+(y-x)*t for x,y in zip(a[3],b[3])])
    def clip(poly,index,positive):
        result=[]
        for a,b in zip(poly,poly[1:]+poly[:1]):
            va=a[3][index];vb=b[3][index]
            inside=va>=0 if positive else va<=0
            other=vb>=0 if positive else vb<=0
            if inside:result.append(a)
            if inside!=other:result.append(mix(a,b,va/(va-vb)))
        return result
    def fan(poly):return [[poly[0],poly[i],poly[i+1]] for i in range(1,len(poly)-1)]
    parts={}
    for index,name in enumerate(['Head','Arm.L','Arm.R','Leg.L','Leg.R']):
        part=[];rest=[]
        for triangle in triangles:
            part.extend(fan(clip(triangle,index,True)))
            rest.extend(fan(clip(triangle,index,False)))
        parts[name]=part;triangles=rest
    parts['Root']=triangles
    verts=[];faces=[];corner_uv=[];corner_normals=[];groups={};report={};all_fields=[]
    white=next(p for p in src.polygons if -.45<p.center.z<-.35 and abs(p.center.x)<.05 and p.center.y<-.15)
    white_uv=sum((uv.data[i].uv for i in white.loop_indices),Vector((0,0)))/len(white.loop_indices)
    for name,triangles in parts.items():
        start=len(verts);keys={};positions=[];part_faces=[];puv=[];pnorm=[];vertex_normals={};vertex_fields=[]
        for triangle in triangles:
            face=[]
            for point,tex,normal,field in triangle:
                key=tuple(round(v,6) for v in point)
                if key not in keys:
                    keys[key]=len(positions);positions.append(point);vertex_fields.append(field)
                vertex_normals[keys[key]]=normal
                face.append(keys[key]);puv.append(tex);pnorm.append(normal)
            if len(set(face))==3:part_faces.append(face)
            else:del puv[-3:];del pnorm[-3:]
        source_count=len(positions)
        edges=defaultdict(list)
        for face in part_faces:
            for a,b in zip(face,face[1:]+face[:1]):edges[tuple(sorted((a,b)))].append((a,b))
        boundary=[seq[0] for seq in edges.values() if len(seq)==1]
        neighbors=defaultdict(set)
        for a,b in boundary:neighbors[a].add(b);neighbors[b].add(a)
        assert all(len(v)==2 for v in neighbors.values()),(name,'non-loop boundary')
        seen=set();cap_faces=0
        # The matching surface borders share identical weights and remain sealed
        # geometrically. Internal doubled caps are unnecessary and cast dark seams.
        for seed in (neighbors if close_parts else []):
            if seed in seen:continue
            loop=[seed];seen.add(seed);previous=None;current=seed
            while True:
                following=next(i for i in neighbors[current] if i!=previous)
                if following==seed:break
                assert following not in seen,(name,'crossing cut')
                loop.append(following);seen.add(following);previous,current=current,following
            center=sum((positions[i] for i in loop),Vector())/len(loop)
            # Hidden socket surfaces extend toward each component's interior only.
            if name=='Head':inside=Vector((0,0,.04))
            elif name.startswith('Arm'):
                sign=1 if name.endswith('L') else -1
                inside=Vector((-sign*.045,0,.055))
            elif name.startswith('Leg'):inside=Vector((0,0,.075))
            else:inside=Vector((-math.copysign(.035,center.x),0,.025))
            center_field=[sum(vertex_fields[i][k] for i in loop)/len(loop) for k in range(5)]
            center_id=len(positions);positions.append(center+inside);vertex_fields.append(center_field)
            inner={}
            for index in loop:
                inner[index]=len(positions)
                positions.append(center+(positions[index]-center)*.72+inside*.70)
                vertex_fields.append(vertex_fields[index])
            loop_set=set(loop)
            for a,b in boundary:
                if a not in loop_set:continue
                for face in [[b,a,inner[a]],[b,inner[a],inner[b]],[inner[b],inner[a],center_id]]:
                    part_faces.append(face)
                    puv.extend([white_uv]*3)
                    for index in face:
                        if index in vertex_normals:normal=vertex_normals[index]
                        elif index==center_id:normal=inside.normalized()
                        else:
                            old=a if index==inner[a] else b
                            normal=(vertex_normals[old]*.65+inside.normalized()*.35).normalized()
                        pnorm.append(normal)
                    cap_faces+=1
        for index in range(source_count,len(positions)):
            for _ in range(3):
                near,normal,_,distance=source_tree.find_nearest(positions[index])
                if (positions[index]-near).dot(normal)<=0:break
                positions[index]=near-normal*.001
        verts.extend(positions)
        all_fields.extend(vertex_fields)
        faces.extend([[start+i for i in face] for face in part_faces])
        corner_uv.extend(puv);corner_normals.extend(pnorm)
        groups[name]=list(range(start,len(verts)))
        report[name]={'surfaceVertices':source_count,'capFaces':cap_faces,'cutLoops':len(positions)-source_count}
    data=bpy.data.meshes.new('Original_Surface_Articulated')
    data.from_pydata(verts,[],faces)
    for material in src.materials:data.materials.append(material)
    layer=data.uv_layers.new(name='UVMap')
    for i,value in enumerate(corner_uv):layer.data[i].uv=value
    for p in data.polygons:p.use_smooth=True
    data.normals_split_custom_set(corner_normals)
    result=bpy.data.objects.new('Somangi_SmoothBody',data)
    bpy.context.collection.objects.link(result)
    for name,indices in groups.items():
        group=result.vertex_groups.new(name='Part.'+name);group.add(indices,1,'REPLACE')
    skin={name:result.vertex_groups.new(name=name) for name in ['Root','Head','Arm.L','Arm.R','Leg.L','Leg.R']}
    for index,field in enumerate(all_fields):
        values=[]
        for channel,f in enumerate(field):
            width=.42 if channel==0 else 1.10
            t=max(0,min(1,.5+f/width))
            values.append(t*t*t*(t*(t*6-15)+10))
        head=values[0]
        limbs=values[1:]
        limb_total=sum(limbs)
        if limb_total>1:limbs=[v/limb_total for v in limbs]
        values=[head]+[v*(1-head) for v in limbs]
        total=sum(values)
        for name,weight in zip(['Head','Arm.L','Arm.R','Leg.L','Leg.R'],values):
            if weight>1e-8:skin[name].add([index],weight,'REPLACE')
        if total<1:skin['Root'].add([index],1-total,'REPLACE')
    bpy.data.objects.remove(source,do_unlink=True)
    return result,report
