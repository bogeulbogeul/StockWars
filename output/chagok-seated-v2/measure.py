import bpy,json
from mathutils import Vector
from pathlib import Path
p=Path('C:/GitHub/StockWars/output/chagok-seated-v2')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/GitHub/StockWars/web/assets/office/3d/Bank-furnished-room.glb')
r={}
for o in bpy.context.scene.objects:
 if o.type=='MESH' and ('Executive' in o.name or 'Desk' in o.name):
  v=[o.matrix_world@Vector(c) for c in o.bound_box]
  r[o.name]=[[min(x[i] for x in v) for i in range(3)],[max(x[i] for x in v) for i in range(3)]]
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/chagok-somangi-base-v1/chagok.blend')
rig=bpy.data.objects['Somangi_WholeArmRig']
r['bones']={b.name:dict(head=list(b.head_local),tail=list(b.tail_local)) for b in rig.data.bones}
(p/'measure.json').write_text(json.dumps(r,indent=2))
