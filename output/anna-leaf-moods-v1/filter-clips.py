import json,struct
from pathlib import Path
P=Path(__file__).resolve().parent
p=P/'Anna-leaf-moods.glb';b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);leaf={'Leaf_Stem','Leaf_Tip'}
for a in d['animations']:
 mood=a['name'].startswith('Leaf_')
 a['channels']=[c for c in a['channels'] if ((d['nodes'][c['target']['node']]['name'] in leaf)==mood)]
j=json.dumps(d,separators=(',',':')).encode();j+=b' '*((-len(j))%4);tail=b[20+n:];p.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(j)+len(tail))+struct.pack('<I4s',len(j),b'JSON')+j+tail)
print({a['name']:len(a['channels']) for a in d['animations']})
