import json,struct
from pathlib import Path
def merge_clip(path,name):
    b=Path(path).read_bytes();length=struct.unpack_from('<I',b,12)[0]
    doc=json.loads(b[20:20+length]);binary=b[28+length:]
    combined={'name':name,'samplers':[],'channels':[]}
    for a in doc['animations']:
        offset=len(combined['samplers']);combined['samplers'].extend(a['samplers'])
        for ch in a['channels']:
            ch['sampler']+=offset;combined['channels'].append(ch)
    doc['animations']=[combined]
    encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
    Path(path).write_bytes(struct.pack('<III',0x46546c67,2,28+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary)
