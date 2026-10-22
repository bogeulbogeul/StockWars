import copy,json,struct
from pathlib import Path

def read(path):
    blob=Path(path).read_bytes()
    length=struct.unpack_from('<I',blob,12)[0]
    doc=json.loads(blob[20:20+length])
    return doc,bytearray(blob[28+length:])

def preserve_walk(target,source):
    dst,binary=read(target);src,source_binary=read(source)
    animation=next(a for a in src['animations'] if a['name']=='Walk_InPlace')
    copied=copy.deepcopy(animation)
    nodes={node.get('name'):i for i,node in enumerate(dst['nodes'])}
    accessors={};views={}
    for sampler in copied['samplers']:
        for key in ['input','output']:
            old=sampler[key]
            if old not in accessors:
                accessor=copy.deepcopy(src['accessors'][old]);view_id=accessor['bufferView']
                if view_id not in views:
                    view=copy.deepcopy(src['bufferViews'][view_id])
                    start=view.get('byteOffset',0)
                    while len(binary)%4:binary.append(0)
                    view['byteOffset']=len(binary);view['buffer']=0
                    binary.extend(source_binary[start:start+view['byteLength']])
                    views[view_id]=len(dst['bufferViews']);dst['bufferViews'].append(view)
                accessor['bufferView']=views[view_id]
                accessors[old]=len(dst['accessors']);dst['accessors'].append(accessor)
            sampler[key]=accessors[old]
    for channel in copied['channels']:
        old=channel['target']['node'];name=src['nodes'][old]['name']
        channel['target']['node']=nodes[name]
        for key in ['translation','rotation','scale','matrix']:
            assert src['nodes'][old].get(key)==dst['nodes'][nodes[name]].get(key),(name,key)
    dst['animations']=[a for a in dst['animations'] if a['name']!='Walk_InPlace']+[copied]
    while len(binary)%4:binary.append(0)
    dst['buffers'][0]['byteLength']=len(binary)
    encoded=json.dumps(dst,separators=(',',':')).encode()
    encoded+=b' '*((-len(encoded))%4)
    blob=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(binary))
    blob+=struct.pack('<II',len(encoded),0x4e4f534a)+encoded
    blob+=struct.pack('<II',len(binary),0x004e4942)+binary
    Path(target).write_bytes(blob)
