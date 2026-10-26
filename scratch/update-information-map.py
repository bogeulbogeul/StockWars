"""Replace only the embedded map PNG in the current information room GLB."""
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / (sys.argv[2] if len(sys.argv) > 2 else 'output/information-map-current-layout-v3')
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / 'web/assets/office/3d/Information-furnished-room.glb'
MAP = ROOT / (sys.argv[1] if len(sys.argv) > 1 else 'output/popori-map-current-layout-v2/map.png')
IMAGE_NAME = sys.argv[3] if len(sys.argv) > 3 else 'Popori_Current_Village_Map_v2'
original = SOURCE.read_bytes()
json_length = struct.unpack_from('<I', original, 12)[0]
doc = json.loads(original[20:20 + json_length])
bin_header = 20 + json_length
bin_length = struct.unpack_from('<I', original, bin_header)[0]
binary = original[bin_header + 8:bin_header + 8 + bin_length]
material = next(m for m in doc['materials'] if m.get('name') == 'Popori_Map_Printed_Paper')
texture = doc['textures'][material['pbrMetallicRoughness']['baseColorTexture']['index']]
image = doc['images'][texture['source']]
view_index = image['bufferView']
view = doc['bufferViews'][view_index]
start, length = view.get('byteOffset', 0), view['byteLength']
png = MAP.read_bytes()
assert png.startswith(b'\x89PNG\r\n\x1a\n')
# Keep all existing buffer views/data intact; substitute a dedicated packed image
# view so shared geometry, UVs, furniture, and collision measurements stay exact.
image_offset = (len(binary) + 3) // 4 * 4
new_binary = binary + b'\0' * (image_offset - len(binary)) + png
doc['bufferViews'].append({'buffer': 0, 'byteOffset': image_offset, 'byteLength': len(png)})
image['bufferView'] = len(doc['bufferViews']) - 1
image['name'] = IMAGE_NAME
doc['buffers'][0]['byteLength'] = len(new_binary)
json_data = json.dumps(doc, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
json_data += b' ' * (-len(json_data) % 4)
new_binary += b'\0' * (-len(new_binary) % 4)
result = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(json_data) + 8 + len(new_binary))
result += struct.pack('<II', len(json_data), 0x4E4F534A) + json_data
result += struct.pack('<II', len(new_binary), 0x004E4942) + new_binary
(OUT / 'Information-before-map-update.glb').write_bytes(original)
(OUT / 'Information-furnished-room.glb').write_bytes(result)
targets = [SOURCE, ROOT / 'electron-app/dist/win-unpacked/resources/web/assets/office/3d/Information-furnished-room.glb']
for target in targets:
    target.write_bytes(result)
assert new_binary[:len(binary)] == binary
report = {'mapSource': str(MAP), 'mapSha256': hashlib.sha256(png).hexdigest(),
          'modelSha256': hashlib.sha256(result).hexdigest(), 'geometryAndOriginalDataPreserved': True,
          'mapEmbedded': True, 'targets': [str(t) for t in targets],
          'targetHashesMatch': all(t.read_bytes() == result for t in targets)}
(OUT / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False))
