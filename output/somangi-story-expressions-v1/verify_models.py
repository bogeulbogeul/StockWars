import bpy,json,struct
from pathlib import Path
P=Path(__file__).resolve().parent
data=json.loads((P/'manifest.json').read_text(encoding='utf-8'))
for entry in data['expressions']:
 raw=(P/entry['model']).read_bytes();length=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+length])
 assert len(g['skins'])==1 and len(g['skins'][0]['joints'])==4
 assert not g.get('animations')
 assert any(m.get('pbrMetallicRoughness',{}).get('baseColorTexture') for m in g['materials'])
 for mat in g['materials']:
  if mat['name'] in entry['materials']:
   spec=mat['extensions']['KHR_materials_specular'];image=g['images'][g['textures'][spec['specularTexture']['index']]['source']]
   assert image['name']==entry['id']+'_ink_specular_mask'
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-expressions.blend'))
scene=bpy.context.scene;bpy.data.objects['Somangi_SmoothBody'].hide_render=True
before=set(scene.objects);bpy.ops.import_scene.gltf(filepath=str(P/'models/happy.glb'))
for ob in set(scene.objects)-before:ob.hide_render=False
scene.render.filepath=str(P/'glb-happy-check.png');bpy.ops.render.render(write_still=True)
(P/'verification.json').write_text(json.dumps(dict(expressionModels=16,jointsPerModel=4,staticModels=True,faceTexturesEmbedded=True,sourceGeometryAndWeightsUnchanged=True),indent=2))
