import bpy,json
from pathlib import Path
P=Path('C:/GitHub/StockWars/output/fairy-clothing-refit-v4')
report=[]
for file in ['moa-bench-sit.glb','tori.glb','bongbong.glb','information-room.glb']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P.parent/'fairy-smooth-body-v3'/file))
 t=bpy.data.objects['Eating_Torso'];inverse=t.matrix_world.inverted();body=[v.co for v in t.data.vertices];cy=(min(v.y for v in body)+max(v.y for v in body))/2
 obs=[]
 for o in bpy.data.objects:
  if o.type!='MESH' or not ('Vest' in o.name or 'Apron' in o.name):continue
  if not o.vertex_groups:continue
  pts=[inverse@o.matrix_world@v.co for v in o.data.vertices]
  obs.append(dict(name=o.name,n=len(pts),bounds=[[round(min(v[k] for v in pts),4),round(max(v[k] for v in pts),4)] for k in range(3)]))
 report.append(dict(file=file,objects=obs))
(P/'inventory.json').write_text(json.dumps(report,indent=2))
