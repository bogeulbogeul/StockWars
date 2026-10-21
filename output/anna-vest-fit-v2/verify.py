import bpy,json
from pathlib import Path
p=Path('C:/GitHub/StockWars/output/anna-vest-fit-v2')
bpy.ops.wm.open_mainfile(filepath='C:/GitHub/StockWars/output/anna-base-face-v7/Anna-clean-face.blend')
old={n:[tuple(v.co) for v in bpy.data.objects[n].data.vertices] for n in ['Anna_BaseBody','Anna_PlumpLeaf']}
bpy.ops.wm.open_mainfile(filepath=str(p/'Anna-vest-fit.blend'))
r={n+'_unchanged':old[n]==[tuple(v.co) for v in bpy.data.objects[n].data.vertices] for n in old}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(p/'Anna-vest-fit.glb'))
r['glb_meshes']=[o.name for o in bpy.data.objects if o.type=='MESH'];assert all(r[n+'_unchanged'] for n in old) and len(r['glb_meshes'])==3
(p/'validation.json').write_text(json.dumps(r,indent=2));print(r)
