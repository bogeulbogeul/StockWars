import struct,json,hashlib
from pathlib import Path
P=Path(__file__).resolve().parent
def read(path):
    b=path.read_bytes();n=struct.unpack_from('<I',b,12)[0]
    return json.loads(b[20:20+n]),b[28+n:]
def accessor(j,data,i):
    a=j['accessors'][i]
    size={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}[a['componentType']]
    columns={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
    width=size*columns;out=bytearray(a['count']*width)
    if 'bufferView' in a:
        view=j['bufferViews'][a['bufferView']];stride=view.get('byteStride',width)
        offset=view.get('byteOffset',0)+a.get('byteOffset',0)
        out[:]=b''.join(data[offset+k*stride:offset+k*stride+width] for k in range(a['count']))
    if 'sparse' in a:
        s=a['sparse'];ind=s['indices'];val=s['values']
        iv=j['bufferViews'][ind['bufferView']];vv=j['bufferViews'][val['bufferView']]
        io=iv.get('byteOffset',0)+ind.get('byteOffset',0);vo=vv.get('byteOffset',0)+val.get('byteOffset',0)
        fmt={5121:'B',5123:'H',5125:'I'}[ind['componentType']];step=struct.calcsize(fmt)
        for k in range(s['count']):
            index=struct.unpack_from('<'+fmt,data,io+k*step)[0]
            out[index*width:(index+1)*width]=data[vo+k*width:vo+(k+1)*width]
    return bytes(out)
results={}
for kind in ['bread','drink']:
    old,ob=read(P.parent/'somangi-eat-drink-shoulder-v2'/f'somangi-{kind}.glb')
    new,nb=read(P/f'somangi-{kind}.glb')
    def body_mesh(j):
        node=next(n for n in j['nodes'] if n.get('name')=='Somangi_SmoothBody')
        return j['meshes'][node['mesh']]
    a,b=body_mesh(old),body_mesh(new);count=0
    assert len(a['primitives'])==len(b['primitives'])
    for pa,pb in zip(a['primitives'],b['primitives']):
        for key in pa['attributes']:
            assert accessor(old,ob,pa['attributes'][key])==accessor(new,nb,pb['attributes'][key]),key
            count+=1
        assert accessor(old,ob,pa['indices'])==accessor(new,nb,pb['indices'])
        assert len(pa['targets'])==len(pb['targets'])
        for ta,tb in zip(pa['targets'],pb['targets']):
            for key in ta:
                assert accessor(old,ob,ta[key])==accessor(new,nb,tb[key]),key
                count+=1
    def weights(j,data):
        output=[]
        for anim in j['animations']:
            for ch in anim['channels']:
                if ch['target']['path']=='weights':
                    s=anim['samplers'][ch['sampler']]
                    output.append((accessor(j,data,s['input']),accessor(j,data,s['output']),s.get('interpolation')))
        return output
    assert weights(old,ob)==weights(new,nb)
    results[kind]={'characterGeometryAndAllMorphTargetsIdentical':True,'characterMorphAnimationIdentical':True,'comparedAttributeBuffers':count}
(P/'export-validation.json').write_text(json.dumps(results,indent=2));print(results)
