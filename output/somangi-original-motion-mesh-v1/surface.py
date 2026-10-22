import bpy, heapq, math
from collections import defaultdict
from mathutils import Vector

def build_surface(source):
    src=source.data
    src.update()
    points=[v.co.copy() for v in src.vertices]
    uv=src.uv_layers.active
    normals=[n.vector.copy() for n in src.corner_normals]
    lookup={};weld=[];ids=[]
    for point in points:
        key=tuple(round(v,6) for v in point)
        if key not in lookup:lookup[key]=len(weld);weld.append(point)
        ids.append(lookup[key])
    adj=[{} for _ in weld]
    for edge in src.edges:
        a,b=[ids[i] for i in edge.vertices]
        if a!=b:
            length=(weld[a]-weld[b]).length
            adj[a][b]=length;adj[b][a]=length
    def distances(seeds):
        result=[float('inf')]*len(weld);queue=[]
        for i in seeds:result[i]=0;heapq.heappush(queue,(0,i))
        while queue:
            d,i=heapq.heappop(queue)
            if d!=result[i]:continue
            for j,length in adj[i].items():
                value=d+length
                if value<result[j]:result[j]=value;heapq.heappush(queue,(value,j))
        return result
    fields=[]
    for kind,sign in [('Arm',1),('Arm',-1),('Leg',1),('Leg',-1)]:
        if kind=='Arm':
            limb=[i for i,p in enumerate(weld) if sign*p.x>.44 and -.55<p.z<-.14]
            fixed=[i for i,p in enumerate(weld) if sign*p.x<.23 or p.z>.005 or p.z<-.60]
        else:
            limb=[i for i,p in enumerate(weld) if sign*p.x>.07 and p.z<-.83]
            fixed=[i for i,p in enumerate(weld) if p.z>-.55 or sign*p.x<.015]
        dl,db=distances(limb),distances(fixed)
        values=[max(-1,min(1,(b-a)/max(a+b,1e-8))) if math.isfinite(a+b) else -1 for a,b in zip(dl,db)]
        # A smooth isoline follows the surface indentation without triangle-shaped teeth.
        pinned=set(limb)|set(fixed)
        for _ in range(30):
            next_values=list(values)
            for i,neighbors in enumerate(adj):
                if i in pinned or not neighbors:continue
                total=sum(1/max(d,1e-6) for d in neighbors.values())
                avg=sum(values[j]/max(d,1e-6) for j,d in neighbors.items())/total
                next_values[i]=.55*values[i]+.45*avg
            values=next_values
        fields.append(values)
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
    for index,name in enumerate(['Arm.L','Arm.R','Leg.L','Leg.R']):
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
        for seed in neighbors:
            if seed in seen:continue
            loop=[seed];seen.add(seed);previous=None;current=seed
            while True:
                following=next(i for i in neighbors[current] if i!=previous)
                if following==seed:break
                assert following not in seen,(name,'crossing cut')
                loop.append(following);seen.add(following);previous,current=current,following
            center=sum((positions[i] for i in loop),Vector())/len(loop)
            # Hidden socket surfaces extend toward each component's interior only.
            if name.startswith('Arm'):
                sign=1 if name.endswith('L') else -1
                inside=Vector((-sign*.045,0,.055))
            elif name.startswith('Leg'):inside=Vector((0,0,.075))
            else:inside=Vector((-math.copysign(.035,center.x),0,.025))
            center_field=[sum(vertex_fields[i][k] for i in loop)/len(loop) for k in range(4)]
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
    skin={name:result.vertex_groups.new(name=name) for name in ['Root','Arm.L','Arm.R','Leg.L','Leg.R']}
    for index,field in enumerate(all_fields):
        values=[]
        for f in field:
            t=max(0,min(1,.5+f/.42))
            values.append(t*t*(3-2*t))
        total=sum(values)
        if total>1:values=[v/total for v in values];total=1
        for name,weight in zip(['Arm.L','Arm.R','Leg.L','Leg.R'],values):
            if weight>1e-8:skin[name].add([index],weight,'REPLACE')
        if total<1:skin['Root'].add([index],1-total,'REPLACE')
    bpy.data.objects.remove(source,do_unlink=True)
    return result,report
