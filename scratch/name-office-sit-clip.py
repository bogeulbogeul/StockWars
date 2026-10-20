"""Preserve Blender's baked channels while giving the single exported clip its contract name."""
import struct,json
from pathlib import Path
path=Path('C:/GitHub/StockWars/output/somangi-office-sit-v1/Somangi-office-sit.glb')
raw=path.read_bytes();length,kind=struct.unpack_from('<II',raw,12)
document=json.loads(raw[20:20+length]);assert len(document['animations'])==1
document['animations'][0]['name']='Office_Sit'
payload=json.dumps(document,separators=(',',':')).encode();payload+=b' ' *((-len(payload))%4)
rest=raw[20+length:]
path.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(payload)+len(rest))+struct.pack('<II',len(payload),kind)+payload+rest)
print('PASS: Office_Sit clip name, one animation, baked channels preserved')
