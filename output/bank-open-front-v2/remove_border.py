"""Remove raised front borders from the bank room and scale-check scene."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
results=[]
for folder,file,out,render in [
 ('bank-furnished-room-v1','Bank-furnished-room.blend','Bank-furnished-room','room.png'),
 ('bank-scale-check-v1','Bank-scale-check.blend','Bank-scale-check','room-scale.png')]:
 bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/folder/file))
 removed=[o.name for o in bpy.context.scene.objects if o.name.startswith('Front_Low_Border')]
 assert len(removed)==2
 for name in removed:bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
 bpy.ops.object.select_all(action='DESELECT')
 if out=='Bank-furnished-room':
  for o in bpy.context.scene.objects:o.select_set(o.type in {'MESH','CURVE','EMPTY'})
  bpy.ops.export_scene.gltf(filepath=str(ROOT/(out+'.glb')),export_format='GLB',use_selection=True)
 scene=bpy.context.scene;scene.render.filepath=str(ROOT/render);bpy.ops.render.render(write_still=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/(out+'.blend')))
 results.append({'source':folder+'/'+file,'removed':removed,'output':out})
(ROOT/'report.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
