"""Check the evaluated pillow against sofa upholstery and frame triangles."""
import bpy
from pathlib import Path
from mathutils.bvhtree import BVHTree

root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'Pub-bar-room-preview.blend'))
deps=bpy.context.evaluated_depsgraph_get()
def tree(obj):
    evaluated=obj.evaluated_get(deps)
    mesh=evaluated.to_mesh()
    mesh.calc_loop_triangles()
    points=[evaluated.matrix_world @ v.co for v in mesh.vertices]
    faces=[tuple(t.vertices) for t in mesh.loop_triangles]
    result=BVHTree.FromPolygons(points,faces,all_triangles=True)
    evaluated.to_mesh_clear()
    return result
pillow=bpy.data.objects['Sofa_Puffed_Ochre_Pillow']
surface=tree(pillow)
hits=[]
for obj in bpy.context.scene.objects:
    if obj.type=='MESH' and obj.name.startswith('Sofa_') and obj!=pillow:
        if surface.overlap(tree(obj)):hits.append(obj.name)
print('PILLOW_INTERSECTIONS:',hits)
assert not hits,hits
