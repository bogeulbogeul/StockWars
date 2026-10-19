import bpy,json,struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parent
raw=(P/'somangi-bench-scene.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n])
print('EXPORTED_NODES',[(n.get('name'),n.get('mesh')) for n in g['nodes']])
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-bench-sit.blend'))
s=bpy.context.scene;mesh=bpy.data.objects['Somangi_Body'];bench=bpy.data.objects['Bench']
vs=[bench.matrix_world@v.co for v in bench.data.vertices];bvh=BVHTree.FromPolygons(vs,[list(p.vertices) for p in bench.data.polygons])
lo=Vector([min(v[i] for v in vs) for i in range(3)]);hi=Vector([max(v[i] for v in vs) for i in range(3)])
print('OBJECTS',[(o.name,o.parent.name if o.parent else None) for o in s.objects if o.type=='MESH'])
for f in [1,13,19,25,37,49,55,61,73]:
    s.frame_set(f);obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=obj.to_mesh();worst=(0,None)
    for v in temp.vertices:
        co=v.co
        if not all(lo[i]<co[i]<hi[i] for i in range(3)):continue
        near,normal,_,dist=bvh.find_nearest(co)
        if near is not None and (co-near).dot(normal)<0 and dist>worst[0]:worst=(dist,list(co))
    print('PENETRATION',f,worst);obj.to_mesh_clear()
