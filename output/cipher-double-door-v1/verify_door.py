import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

OUT = Path('C:/GitHub/StockWars/output/cipher-double-door-v1')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT/'Door-double-blue.glb'))
left, right = [bpy.data.objects[name] for name in ['Hinge_Left','Hinge_Right']]
leaves = [bpy.data.objects[name] for name in ['Leaf_Left','Leaf_Right']]
assert leaves[0].parent == left and leaves[1].parent == right
assert abs(left.location.x+.16)<1e-6 and abs(right.location.x-.16)<1e-6
assert all(math.isfinite(c) for obj in leaves for v in obj.data.vertices for c in v.co)
def bounds(obj):
    points=[obj.matrix_world @ v.co for v in obj.data.vertices]
    return [[min(v[i] for v in points),max(v[i] for v in points)] for i in range(3)]
bpy.context.view_layer.update()
before = [bounds(o) for o in leaves]
assert before[0][0][1]<before[1][0][0], 'Closed leaves overlap'
assert abs(before[0][0][0]+.16)<.002 and abs(before[1][0][1]-.16)<.002
# Imported Blender uses Z up: opening rotates around this vertical hinge axis.
left.rotation_mode = 'XYZ'
right.rotation_mode = 'XYZ'
left.rotation_euler.z=-math.radians(65)
right.rotation_euler.z=math.radians(65)
bpy.context.view_layer.update()
after=[bounds(o) for o in leaves]
assert after[0][1][0]<-.1 and after[1][1][0]<-.1, 'Hinges failed to swing forward'
for leaf in leaves:
    assert sum(o.name.startswith('Handle_') for o in leaf.parent.children)>=2
report={'glb_reimport':'PASS','separate_leaves':'PASS','hinge_positions':'PASS',
        'closed_center_gap':'PASS','open_65_degrees':'PASS','double_sided_handles':'PASS',
        'meshes':len([o for o in bpy.context.scene.objects if o.type=='MESH']),
        'closed_leaf_bounds':before,'open_leaf_bounds':after}
(OUT/'validation.json').write_text(json.dumps(report,indent=2))
print('VALIDATION',json.dumps(report))
