from pathlib import Path
import json, struct

P = Path(__file__).resolve().parent
SOURCE = Path('C:/Users/bogeu/Downloads/Meshy_AI_Blank_Buddy_1018082424_texture.glb')
raw = SOURCE.read_bytes()
length = struct.unpack_from('<I', raw, 12)[0]
gltf = json.loads(raw[20:20+length])
summary = {'source': str(SOURCE), 'bytes': len(raw),
           'meshes': len(gltf.get('meshes', [])),
           'skins': len(gltf.get('skins', [])),
           'animations': len(gltf.get('animations', [])),
           'materials': len(gltf.get('materials', [])),
           'images': len(gltf.get('images', []))}
(P/'file-summary.json').write_text(json.dumps(summary, indent=2))
# Reuse the non-destructive inspection/render workflow; all output goes here.
template = (P.parent/'marshmallow-friend-rig-v1'/'inspect_model.py').read_text()
template = template.replace("SOURCE = 'C:/Users/bogeu/Downloads/Meshy_AI_Marshmallow_Friend_1018075407_texture.glb'", 'SOURCE = '+repr(str(SOURCE)))
exec(compile(template, str(P/'inspect_model.py'), 'exec'))
print(json.dumps(summary))
