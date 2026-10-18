import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

out = Path('C:/GitHub/StockWars/output/cipher-exterior-blender-v1')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(out / 'CipherSecurities-exterior.glb'))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
assert len(meshes) == 84
assert all(math.isfinite(c) for o in meshes for v in o.data.vertices for c in v.co)
assert bpy.data.objects.get('Door_Assembly')
for name in ('Hinge_Left', 'Hinge_Right'):
    assert bpy.data.objects.get(name), name
assert not any(o.type in ('CAMERA', 'LIGHT') for o in bpy.context.scene.objects)
scene = bpy.context.scene
def ray():
    bpy.context.view_layer.update()
    result = scene.ray_cast(bpy.context.evaluated_depsgraph_get(), Vector((.1, -2, .5)), Vector((0, 1, 0)))
    return {'hit': result[0], 'y': round(result[1].y, 4), 'object': result[4].name if result[0] else None}
closed = ray()
for name, angle in [('Hinge_Left', -65), ('Hinge_Right', 65)]:
    obj = bpy.data.objects[name]
    obj.rotation_mode = 'XYZ'
    obj.rotation_euler.z = math.radians(angle)
opened = ray()
assert closed['hit'] and closed['y'] < -.8, closed
assert opened['hit'] and opened['y'] > .7, opened
report = {'result': 'PASS', 'mesh_count': len(meshes), 'finite_vertices': True,
          'studio_objects_excluded': True, 'closed_entry_ray': closed,
          'open_entry_ray': opened, 'door_pivots_preserved': True}
(out / 'validation.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
