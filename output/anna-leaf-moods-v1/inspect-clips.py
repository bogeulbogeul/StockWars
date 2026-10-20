import json,struct
from pathlib import Path
p=Path('C:/GitHub/StockWars/output/anna-leaf-moods-v1/Anna-leaf-moods.glb')
b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);print({a['name']:sorted(set(d['nodes'][c['target']['node']]['name'] for c in a['channels'])) for a in d['animations']})
