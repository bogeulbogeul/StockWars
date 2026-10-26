import bpy,json
from pathlib import Path
R=Path('C:/GitHub/StockWars')
paths=list((R/'web/assets/characters/3d').rglob('*.glb'))+[R/'web/assets/office/3d/Information-furnished-room.glb',R/'web/assets/interiors/vivian-3d/Vivian-room.glb']
out=[]
for p in paths:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(p))
 obs=[]
 for o in bpy.data.objects:
  if o.type!='MESH':continue
  vs=[o.matrix_world@v.co for v in o.data.vertices]
  obs.append(dict(name=o.name,n=len(vs),groups=[g.name for g in o.vertex_groups],bounds=[[round(min(v[i] for v in vs),3),round(max(v[i] for v in vs),3)] for i in range(3)]))
 out.append(dict(path=str(p.relative_to(R)),objects=obs))
(R/'output/fairy-body-narrow-v1/inventory.json').write_text(json.dumps(out,indent=2))
