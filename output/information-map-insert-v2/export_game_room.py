"""Export the mapped office room without the staged visitor or studio objects."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT / 'Information-room-with-map.blend'))
visitor = bpy.data.objects.get('Somangi_Visitor_Seated_Preview')
if visitor:
    for obj in [*visitor.children_recursive, visitor]:
        bpy.data.objects.remove(obj, do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
obstacles = []
depsgraph = bpy.context.evaluated_depsgraph_get()
for obj in list(bpy.context.scene.objects):
    ancestors = [obj]
    parent = obj.parent
    while parent:
        ancestors.append(parent)
        parent = parent.parent
    if obj.type != 'MESH' or any(o.hide_render for o in ancestors):
        continue
    name = obj.name
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
    obj.name = name + '_Source'
    baked = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(baked)
    baked.matrix_world = obj.matrix_world.copy()
    baked.select_set(True)
    points = [obj.matrix_world @ Vector(c) for c in evaluated.bound_box]
    lo = [min(p[i] for p in points) for i in range(3)]
    hi = [max(p[i] for p in points) for i in range(3)]
    # Furniture, trunk/feet, and seated NPC volumes; skip floor and tall walls.
    if hi[2] > .24 and hi[2] < 1.8 and lo[2] < 1.1 and not name.startswith('Continuous_'):
        obstacles.append({'id': name, 'minX': round(lo[0]*100, 2),
                          'maxX': round(hi[0]*100, 2),
                          'minZ': round(-hi[1]*100, 2),
                          'maxZ': round(-lo[1]*100, 2)})
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'Information-furnished-room.glb'),
                           export_format='GLB', use_selection=True,
                           export_animations=False)
(ROOT / 'room-obstacles.json').write_text(json.dumps(obstacles, ensure_ascii=False), encoding='utf-8')
print('EXPORTED', len(obstacles), 'furniture collision pieces')
