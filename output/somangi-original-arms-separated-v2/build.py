import bpy, bmesh, json
from pathlib import Path
from mathutils import Vector, geometry
from mathutils.bvhtree import BVHTree

P=Path(__file__).resolve().parent
SOURCE=P.parent/'somangi-face-smooth-v1/somangi-face-smooth.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
original=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=original
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
src=original.data
src.update()
source_points=[v.co.copy() for v in src.vertices]
source_faces=[list(p.vertices) for p in src.polygons]
source_normals=[[src.corner_normals[i].vector.copy() for i in p.loop_indices] for p in src.polygons]
tree=BVHTree.FromPolygons(source_points,source_faces,all_triangles=True)
uv=src.uv_layers.active
white_face=min(src.polygons,key=lambda p:abs(p.center.x)+abs(p.center.z+.4)+abs(p.center.y+.26))
white_uv=sum((uv.data[i].uv for i in white_face.loop_indices),Vector((0,0)))/len(white_face.loop_indices)

def source_normal(point):
    near,normal,index,distance=tree.find_nearest(point)
    a,b,c=[source_points[i] for i in source_faces[index]]
    try:
        n=geometry.barycentric_transform(near,a,b,c,*source_normals[index])
        return n.normalized()
    except ValueError:return normal

bm=bmesh.new()
bm.from_mesh(src)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7)
bm.normal_update()
bm.faces.layers.int.new('part')
reports=[]
parts=[]

def finish(mesh,name,plane_point=None,plane_normal=None):
    # Discard unused vertices created when the complementary faces were removed.
    bmesh.ops.delete(mesh,geom=[v for v in mesh.verts if not v.link_faces],context='VERTS')
    boundary=[e for e in mesh.edges if e.is_boundary]
    if plane_point is not None:
        assert all(abs((v.co-plane_point).dot(plane_normal))<2e-5 for e in boundary for v in e.verts),name
    caps=[]
    if boundary:
        caps=bmesh.ops.holes_fill(mesh,edges=boundary,sides=0)['faces']
        layer=mesh.loops.layers.uv.active
        for face in caps:
            face.smooth=False
            for loop in face.loops:loop[layer].uv=white_uv
    mesh.normal_update()
    data=bpy.data.meshes.new(name+'_CleanCut')
    mesh.to_mesh(data)
    for material in src.materials:data.materials.append(material)
    # Preserve original surface shading; the new planar cap uses its flat normal.
    normals=[]
    for face in data.polygons:
        for index in face.loop_indices:
            point=data.vertices[data.loops[index].vertex_index].co
            normals.append(source_normal(point) if face.use_smooth else face.normal.copy())
    data.normals_split_custom_set(normals)
    ob=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(ob)
    parts.append(ob)
    reports.append({'name':name,'vertices':len(data.vertices),'faces':len(data.polygons),
        'capFaces':len(caps),'openBoundaryEdgesAfterCap':sum(e.is_boundary for e in mesh.edges)})
    assert not any(e.is_boundary for e in mesh.edges),name
    mesh.free()

for side,sign in [('L',1),('R',-1)]:
    point=Vector((sign*.315,0,-.155))
    normal=Vector((sign*.98,0,.20)).normalized()
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
        dist=1e-7,plane_co=point,plane_no=normal,clear_inner=False,clear_outer=False)
    bm.normal_update()
    for f in bm.faces:f.calc_center_median()
    positive={f for f in bm.faces if (f.calc_center_median()-point).dot(normal)>1e-7}
    target=Vector((sign*.49,0,-.40))
    seed=min(positive,key=lambda f:(f.calc_center_median()-target).length_squared)
    arm={seed};stack=[seed]
    while stack:
        face=stack.pop()
        for edge in face.edges:
            for neighbor in edge.link_faces:
                if neighbor in positive and neighbor not in arm:
                    arm.add(neighbor);stack.append(neighbor)
    # A shoulder cut must select the hand component, never the belly or head.
    assert all(v.co.z<.05 and sign*v.co.x>.15 for f in arm for v in f.verts),(side,'bad component')
    marker=bm.faces.layers.int['part']
    for face in bm.faces:face[marker]=int(face in arm)
    copy=bm.copy()
    copied_marker=copy.faces.layers.int['part']
    bmesh.ops.delete(copy,geom=[f for f in copy.faces if not f[copied_marker]],context='FACES')
    finish(copy,'Arm.'+side,point,normal)
    marker=bm.faces.layers.int['part']
    bmesh.ops.delete(bm,geom=[face for face in bm.faces if face[marker]],context='FACES')
    # Keep the body cut closed before the second shoulder is processed.
    boundary=[e for e in bm.edges if e.is_boundary]
    caps=bmesh.ops.holes_fill(bm,edges=boundary,sides=0)['faces']
    layer=bm.loops.layers.uv.active
    for face in caps:
        face.smooth=False
        for loop in face.loops:loop[layer].uv=white_uv
finish(bm,'Body')
bpy.data.objects.remove(original,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for part in parts:part.select_set(True)
bpy.context.view_layer.objects.active=parts[-1]
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-arms-separated.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-arms-separated.glb'),export_format='GLB',
    use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
(P/'validation.json').write_text(json.dumps({'source':str(SOURCE),'method':'Planar shoulder cuts, original surface retained without smoothing; closed flat caps',
    'parts':reports,'gameInstalled':False},indent=2))
print('CLEAN_CUT_COMPLETE',reports)
