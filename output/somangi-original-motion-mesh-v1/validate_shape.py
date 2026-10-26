import bpy,json,math
from pathlib import Path
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P.parent/'somangi-face-smooth-v1/somangi-face-smooth.glb'))
source=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=source
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
points=[v.co.copy() for v in source.data.vertices]
faces=[list(f.vertices) for f in source.data.polygons]
tree=BVHTree.FromPolygons(points,faces)
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-motion-ready.blend'))
body=bpy.data.objects['Somangi_SmoothBody']
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
rig.data.pose_position='REST'
out=[v.co.copy() for v in body.data.vertices]
result_tree=BVHTree.FromPolygons(out,[list(f.vertices) for f in body.data.polygons])
surface_error=max(result_tree.find_nearest(p)[3] for p in points)
assert surface_error<2e-6,surface_error
base=json.loads((P/'build-validation.json').read_text())
cap_outside=0
for group in body.vertex_groups:
    if not group.name.startswith('Part.'):continue
    ids=[v.index for v in body.data.vertices if any(g.group==group.index for g in v.groups)]
    original_count=base['parts'][group.name[5:]]['surfaceVertices']
    for index in ids[original_count:]:
        near,normal,_,distance=tree.find_nearest(out[index])
        cap_outside=max(cap_outside,(out[index]-near).dot(normal))
assert cap_outside<.002,cap_outside
adj=[set() for _ in body.data.vertices]
counts={}
for e in body.data.edges:
    a,b=e.vertices;adj[a].add(b);adj[b].add(a)
seen=set();components=[]
for i in range(len(adj)):
    if i in seen:continue
    stack=[i];seen.add(i);count=0
    while stack:
        k=stack.pop();count+=1
        for n in adj[k]:
            if n not in seen:seen.add(n);stack.append(n)
    components.append(count)
assert len(components)==5,components
report={'meshObjects':1,'connectedPieces':len(components),'pieceVertexCounts':components,
    'maximumSourceSurfaceDistance':surface_error,'maximumInternalRootProtrusion':cap_outside,
    'source':'somangi-face-smooth-v1/somangi-face-smooth.glb'}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-rest.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith('Somangi_SmoothBody')]
assert len(meshes)==1
for rig in [o for o in bpy.context.scene.objects if o.type=='ARMATURE']:rig.data.pose_position='REST'
bpy.context.view_layer.update()
ev=meshes[0].evaluated_get(bpy.context.evaluated_depsgraph_get())
temp=ev.to_mesh()
glb_tree=BVHTree.FromPolygons([ev.matrix_world@v.co for v in temp.vertices],[list(f.vertices) for f in temp.polygons])
roundtrip_error=max(glb_tree.find_nearest(p)[3] for p in points)
ev.to_mesh_clear()
report['restGlbSurfaceDistance']=roundtrip_error
assert roundtrip_error<2e-6,roundtrip_error
(P/'shape-validation.json').write_text(json.dumps(report,indent=2))
print('SHAPE_VALIDATION',report)
