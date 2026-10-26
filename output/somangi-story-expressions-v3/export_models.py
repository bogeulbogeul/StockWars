import bpy,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-expressions.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig']
data=json.loads((P/'manifest.json').read_text(encoding='utf-8'));(P/'models').mkdir(exist_ok=True)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=body
for entry in data['expressions']:
 for i,name in enumerate(entry['materials']):body.data.materials[i]=bpy.data.materials[name]
 entry['model']='models/'+entry['id']+'.glb'
 bpy.ops.export_scene.gltf(filepath=str(P/entry['model']),use_selection=True,export_format='GLB',export_skins=True,export_animations=False,export_cameras=False,export_lights=False)
data['staticExpressionModels']=True
(P/'manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
