import bpy
import json
from pathlib import Path
from mathutils import Vector
out=Path('C:/GitHub/StockWars/output/cipher-cozy-room-v1')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(out/'Cipher-cozy-room.glb'))
# Reimported GLB is converted back to Blender Z-up by Blender's importer.
scene=bpy.context.scene
deps=bpy.context.evaluated_depsgraph_get()
assert not any(o.type in ('CAMERA','LIGHT') for o in scene.objects)
for side in [-1,1]:
    opening=scene.ray_cast(deps,Vector((0,1,.8)),Vector((side,0,0)))
    wall=scene.ray_cast(deps,Vector((0,1,2.5)),Vector((side,0,0)))
    assert not opening[0], 'Doorway blocked'
    assert wall[0] and abs(abs(wall[1].x)-5)<.05, 'Wall missing'
floor=scene.ray_cast(deps,Vector((.7,.5,1)),Vector((0,0,-1)))
assert floor[0] and abs(floor[1].z)<.001
report={'result':'PASS','both_arch_openings_clear':True,'walls_above_doors_solid':True,
    'floor_top':round(floor[1].z,5),'no_studio_objects_in_glb':True}
(out/'validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
