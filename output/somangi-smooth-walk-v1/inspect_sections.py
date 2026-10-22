import bpy,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/GitHub/StockWars/output/somangi-face-smooth-v1/somangi-face-smooth.glb')
o=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=o
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bvh=BVHTree.FromPolygons([v.co for v in o.data.vertices],[list(p.vertices) for p in o.data.polygons])
for z in [-.72,-.68,-.64,-.60,-.5,-.4,-.3,-.2,-.1,0,.04]:
 print('SECTION',z,[(bvh.ray_cast(Vector((0,0,z)),Vector(d))[0][:] if bvh.ray_cast(Vector((0,0,z)),Vector(d))[0] is not None else None) for d in [(1,0,0),(0,1,0),(0,-1,0)]])
