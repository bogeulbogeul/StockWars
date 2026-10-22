import bpy,json
from pathlib import Path
from mathutils.bvhtree import BVHTree
from mathutils import Vector
P=Path(__file__).resolve().parent

def load_bench(meta):
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(P.parent.parent/'web/assets/props/3d/Bench-clean.glb'))
    objects=[o for o in bpy.context.scene.objects if o not in before]
    root=bpy.data.objects.new('Actual_town_bench',None);bpy.context.collection.objects.link(root)
    for o in objects:
        if o.parent not in objects:o.parent=root
    root.scale=(meta['benchScale'],)*3
    root.location=(0,meta['benchCenterY'],meta['floorZ'])
    bpy.context.view_layer.update()
    return objects

def collision_data(objects):
    result=[]
    for ob in objects:
        if ob.type!='MESH':continue
        ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        points=[ev.matrix_world@v.co for v in mesh.vertices]
        tree=BVHTree.FromPolygons(points,[list(p.vertices) for p in mesh.polygons])
        lo=[min(p[k] for p in points) for k in range(3)]
        hi=[max(p[k] for p in points) for k in range(3)]
        result.append((ob.name,tree,lo,hi))
        ev.to_mesh_clear()
    return result
