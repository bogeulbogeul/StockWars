"""Match the desk sprout to the existing wall sign without rebuilding the room."""
import copy
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/information-desk-sprout-v1'
OUT.mkdir(parents=True, exist_ok=True)
targets = [ROOT / p for p in [
    'web/assets/office/3d/Information-furnished-room.glb',
    'electron-app/dist/win-unpacked/resources/web/assets/office/3d/Information-furnished-room.glb']]
backup = OUT / 'Information-before-desk-sprout.glb'
if not backup.exists():
    backup.write_bytes(targets[0].read_bytes())
original = backup.read_bytes()
length = struct.unpack_from('<I', original, 12)[0]
doc = json.loads(original[20:20 + length])
before = copy.deepcopy(doc)
binary_chunk = original[20 + length:]
names = {n['name']: i for i, n in enumerate(doc['nodes'])}
mapping = [('Left_Oval_Leaf', 'Sprout_Leaf'),
           ('Right_Oval_Leaf', 'Sprout_Leaf.001'),
           ('Sprout_Rounded_Stem', 'Sprout_Stem')]
source_center = [0, 2.0299999713897705, -2.9010000228881836]
desk_center = [0, 0.5120000243186951, 0.16300001740455627]
scale = 0.5
changed = []
for source, target in mapping:
    node = copy.deepcopy(doc['nodes'][names[source]])
    node['name'] = target
    node['translation'] = [d + scale * (v - c) for v, c, d in
                           zip(node['translation'], source_center, desk_center)]
    node['scale'] = [v * scale for v in node.get('scale', [1, 1, 1])]
    doc['nodes'][names[target]] = node
    changed.append(names[target])
assert all(a == b for i, (a, b) in enumerate(zip(before['nodes'], doc['nodes'])) if i not in changed)
assert all(before[k] == doc[k] for k in before if k != 'nodes')
payload = json.dumps(doc, ensure_ascii=False, separators=(',', ':')).encode()
payload += b' ' * (-len(payload) % 4)
result = struct.pack('<III', 0x46546C67, 2, 20 + len(payload) + len(binary_chunk))
result += struct.pack('<II', len(payload), 0x4E4F534A) + payload + binary_chunk
(OUT / 'Information-furnished-room.glb').write_bytes(result)
for target in targets:
    target.write_bytes(result)
report = {'changedNodes': changed, 'wallGeometryReusedAtScale': scale,
          'allOtherNodesAndBinaryPreserved': True,
          'sha256': hashlib.sha256(result).hexdigest(),
          'targetsMatch': all(t.read_bytes() == result for t in targets)}
(OUT / 'validation.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report))
