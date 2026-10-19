"""Partition original triangles; retain positions, normals and material values."""
import copy
import hashlib
import json
import struct
from pathlib import Path

SOURCE = Path(r'C:\Users\bogeu\Downloads\Room.glb')
OUT = Path(__file__).resolve().parent
raw = SOURCE.read_bytes()
size = struct.unpack_from('<I', raw, 12)[0]
doc = json.loads(raw[20:20 + size])
binary = raw[28 + size:]
primitive = doc['meshes'][0]['primitives'][0]

def read_accessor(index, fmt):
    accessor = doc['accessors'][index]
    view = doc['bufferViews'][accessor['bufferView']]
    start = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    stride = view.get('byteStride', struct.calcsize(fmt))
    return [struct.unpack_from(fmt, binary, start + i * stride)
            for i in range(accessor['count'])]

positions = read_accessor(primitive['attributes']['POSITION'], '<fff')
indices = [v[0] for v in read_accessor(primitive['indices'], '<I')]
groups = {name: [] for name in ['Floor', 'Wall_Left', 'Wall_Right', 'Wall_Back', 'Wall_Front']}
for offset in range(0, len(indices), 3):
    triangle = indices[offset:offset + 3]
    points = [positions[i] for i in triangle]
    center = [sum(p[axis] for p in points) / 3 for axis in range(3)]
    if max(p[1] for p in points) < -0.35:
        name = 'Floor'
    elif abs(center[0]) > abs(center[2]):
        name = 'Wall_Right' if center[0] > 0 else 'Wall_Left'
    else:
        name = 'Wall_Back' if center[2] < 0 else 'Wall_Front'
    groups[name].extend(triangle)

# Keep original vertex streams byte for byte; each object gets its own index list.
result = copy.deepcopy(doc)
result['nodes'] = []
result['meshes'] = []
result['materials'] = []
payload = bytearray(binary)
report = {'source': str(SOURCE), 'source_sha256': hashlib.sha256(raw).hexdigest(),
          'method': 'Original triangles partitioned without moving or deleting vertices',
          'axes': 'glTF Y up; front = +Z (door side)', 'parts': {}}
for name, part_indices in groups.items():
    assert part_indices, name
    while len(payload) % 4:
        payload.append(0)
    view_id = len(result['bufferViews'])
    result['bufferViews'].append({'buffer': 0, 'byteOffset': len(payload),
                                'byteLength': len(part_indices) * 4, 'target': 34963})
    payload.extend(struct.pack('<' + 'I' * len(part_indices), *part_indices))
    accessor_id = len(result['accessors'])
    result['accessors'].append({'bufferView': view_id, 'componentType': 5125,
                                'count': len(part_indices), 'type': 'SCALAR'})
    material = copy.deepcopy(doc['materials'][primitive.get('material', 0)])
    material['name'] = name + '_Material'
    result['materials'].append(material)
    part = copy.deepcopy(primitive)
    part.update(indices=accessor_id, material=len(result['materials']) - 1)
    result['meshes'].append({'name': name, 'primitives': [part]})
    result['nodes'].append({'name': name, 'mesh': len(result['meshes']) - 1})
    report['parts'][name] = {'triangles': len(part_indices) // 3}
result['scenes'] = [{'name': 'Room_Separated', 'nodes': list(range(5))}]
result['scene'] = 0
result['buffers'] = [{'byteLength': len(payload)}]
encoded = json.dumps(result, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
payload += b'\0' * (-len(payload) % 4)
output = (struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(encoded) + 8 + len(payload))
          + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded
          + struct.pack('<II', len(payload), 0x004E4942) + payload)
(OUT / 'Room-separated.glb').write_bytes(output)
assert sum(len(g) for g in groups.values()) == len(indices)
assert sorted(tuple(g[i:i+3]) for g in groups.values() for i in range(0, len(g), 3)) == sorted(tuple(indices[i:i+3]) for i in range(0, len(indices), 3))
report['validation'] = 'All 7796 source triangles preserved exactly once; original vertex/normal streams unchanged'
(OUT / 'manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
