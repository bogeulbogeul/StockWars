import json,struct
from pathlib import Path

def merge_clips(path):
    data=path.read_bytes();chunks=[];pos=12
    while pos<len(data):
        length,kind=struct.unpack_from('<II',data,pos);chunks.append((kind,data[pos+8:pos+8+length]));pos+=8+length
    gltf=json.loads(chunks[0][1]);animations=gltf.get('animations',[])
    merged={'name':'Eat','samplers':[],'channels':[]}
    for animation in animations:
        offset=len(merged['samplers']);merged['samplers'].extend(animation['samplers'])
        for channel in animation['channels']:
            channel['sampler']+=offset;merged['channels'].append(channel)
    gltf['animations']=[merged]
    raw=json.dumps(gltf,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);chunks[0]=(chunks[0][0],raw)
    payload=b''.join(struct.pack('<II',len(buf),kind)+buf for kind,buf in chunks)
    path.write_bytes(struct.pack('<III',0x46546c67,2,len(payload)+12)+payload)

if __name__=='__main__':merge_clips(Path(__file__).resolve().parent/'somangi-eat.glb')
