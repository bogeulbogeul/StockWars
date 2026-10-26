import struct,json
from pathlib import Path
for f in ['item_apple_juice','item_berry_juice','item_dew_jelly']:
 b=Path('web/assets/items/3d/refined-v2/'+f+'.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);print(f)
 for m in j.get('materials',[]): print(m.get('name'),m.get('pbrMetallicRoughness'),m.get('extensions'),m.get('alphaMode'))
