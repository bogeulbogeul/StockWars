import bpy, heapq, json
from pathlib import Path
from collections import defaultdict
from mathutils import Vector

P=Path(__file__).resolve().parent
source=P.parent/'somangi-face-smooth-v1/somangi-face-smooth.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=obj
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
src=obj.data
src.update()
points=[v.co.copy() for v in src.vertices]
uv=src.uv_layers.active
keys={};weld=[];mapping=[]
for point in points:
    key=tuple(round(c,6) for c in point)
    if key not in keys:keys[key]=len(weld);weld.append(point)
    mapping.append(keys[key])
adj=[{} for _ in weld]
for edge in src.edges:
    a,b=[mapping[i] for i in edge.vertices]
    if a!=b:
        distance=(weld[a]-weld[b]).length
        adj[a][b]=distance;adj[b][a]=distance

def distances(seeds):
    result=[float('inf')]*len(weld)
    queue=[]
    for index in seeds:result[index]=0;heapq.heappush(queue,(0,index))
    while queue:
        distance,a=heapq.heappop(queue)
        if distance!=result[a]:continue
        for b,length in adj[a].items():
            value=distance+length
            if value<result[b]:result[b]=value;heapq.heappush(queue,(value,b))
    return result

body_distance=distances([i for i,p in enumerate(weld) if abs(p.x)<.23 or p.z>.015 or p.z<-.60])
arm_distance=distances([i for i,p in enumerate(weld) if abs(p.x)>.44 and -.55<p.z<-.14])
labels=[]
for point,a,b in zip(points,[arm_distance[i] for i in mapping],[body_distance[i] for i in mapping]):
    labels.append(('Arm.L' if point.x>=0 else 'Arm.R') if a<b and -.59<point.z<.025 else 'Body')
parts=defaultdict(list)
for face in src.polygons:
    votes=[labels[i] for i in face.vertices]
    label=max(set(votes),key=lambda name:(votes.count(name),name))
    parts[label].append(face)

white_face=min(src.polygons,key=lambda p:abs(p.center.x)+abs(p.center.z+.4)+abs(p.center.y+.26))
white_uv=sum((uv.data[i].uv for i in white_face.loop_indices),Vector((0,0)))/len(white_face.loop_indices)
normals=[v.vector.copy() for v in src.corner_normals]
reports=[]
objects=[]
for name in ['Body','Arm.L','Arm.R']:
    faces=parts[name]
    ids=sorted({i for f in faces for i in f.vertices})
    remap={old:new for new,old in enumerate(ids)}
    vertices=[points[i].copy() for i in ids]
    polys=[[remap[i] for i in f.vertices] for f in faces]
    edges=defaultdict(list)
    for face in faces:
        seq=list(face.vertices)
        for a,b in zip(seq,seq[1:]+seq[:1]):
            wa,wb=mapping[a],mapping[b]
            if wa!=wb:edges[tuple(sorted((wa,wb)))].append((a,b))
    boundary=[values[0] for values in edges.values() if len(values)==1]
    neighbors=defaultdict(set)
    representatives={}
    for a,b in boundary:
        wa,wb=mapping[a],mapping[b]
        neighbors[wa].add(wb);neighbors[wb].add(wa)
        representatives[wa]=a;representatives[wb]=b
    # Fill only the new shoulder cut. Never smooth or reposition source vertices.
    seen=set();caps=[]
    for start in neighbors:
        if start in seen:continue
        stack=[start];component=[];seen.add(start)
        while stack:
            k=stack.pop();component.append(k)
            for n in neighbors[k]:
                if n not in seen:seen.add(n);stack.append(n)
        if len(component)<3:continue
        center=sum((weld[i] for i in component),Vector())/len(component)
        center_id=len(vertices);vertices.append(center)
        subset=set(component)
        for a,b in boundary:
            if mapping[a] in subset and mapping[b] in subset:
                caps.append([remap[b],remap[a],center_id])
    data=bpy.data.meshes.new(name+'_OriginalMesh')
    data.from_pydata(vertices,[],polys+caps)
    for material in src.materials:data.materials.append(material)
    layer=data.uv_layers.new(name=uv.name)
    custom=[]
    for face,old in zip(data.polygons,faces):
        face.material_index=old.material_index
        face.use_smooth=old.use_smooth
        for new_loop,old_loop in zip(face.loop_indices,old.loop_indices):
            layer.data[new_loop].uv=uv.data[old_loop].uv
            custom.append(normals[old_loop])
    for face in list(data.polygons)[len(faces):]:
        for index in face.loop_indices:
            layer.data[index].uv=white_uv
            custom.append(face.normal.copy())
    data.normals_split_custom_set(custom)
    part=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(part)
    objects.append(part)
    reports.append({'name':name,'sourceFaces':len(faces),'sourceVertices':len(ids),
        'newCapFaces':len(caps),'newCapVertices':len(vertices)-len(ids),
        'originalVertexMaxDisplacement':max((data.vertices[remap[i]].co-points[i]).length for i in ids),
        'originalUvsNormalsPreserved':True})

assert sum(len(faces) for faces in parts.values())==len(src.polygons)
assert all(report['originalVertexMaxDisplacement']==0 for report in reports)
source_faces=len(src.polygons)
bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for part in objects:part.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-arms-separated.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-arms-separated.glb'),export_format='GLB',
    use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
report={'source':str(source),'sourceFaces':source_faces,'allOriginalFacesAssignedExactlyOnce':True,
    'method':'Geodesic shoulder separation, untouched original surface vertices and UVs; internal cut caps only',
    'parts':reports,'gameInstalled':False}
(P/'validation.json').write_text(json.dumps(report,indent=2))
print('SEPARATION_VALIDATION',json.dumps(report))
