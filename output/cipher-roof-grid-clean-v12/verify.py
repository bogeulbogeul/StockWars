"""Check exported roof and exact accessor data for retained building parts."""
import json, struct, hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parent
def read(path):
    raw=path.read_bytes()
    assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
    size=struct.unpack_from('<I',raw,12)[0]
    return json.loads(raw[20:20+size]),raw[28+size:]

def signature(model, binary, node):
    result={k:v for k,v in node.items() if k not in ('mesh','children')}
    if 'mesh' in node:
        attrs=[]
        for primitive in model['meshes'][node['mesh']]['primitives']:
            part={}
            for name,index in primitive['attributes'].items():
                accessor=model['accessors'][index]
                view=model['bufferViews'][accessor['bufferView']]
                start=view.get('byteOffset',0)+accessor.get('byteOffset',0)
                sizes={5126:4,5125:4,5123:2,5121:1,5122:2,5120:1}
                width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[accessor['type']]*sizes[accessor['componentType']]
                stride=view.get('byteStride',width)
                data=b''.join(binary[start+i*stride:start+i*stride+width] for i in range(accessor['count']))
                part[name]=hashlib.sha256(data).hexdigest()
            attrs.append(part)
        result['attributes']=attrs
    return result

before,bb=read(ROOT.parent/'cipher-joints-ground-v6'/'CipherSecurities-clock.glb')
after,ab=read(ROOT/'CipherSecurities-clock.glb')
lookup={n['name']:n for n in after['nodes']}
protected=('Door_','Entry_','Clock_','Grand_Clock','Portico_Column','Wing_Corner','Window_','Front_Window','Cipher_Logo')
checked=[]
for node in before['nodes']:
    name=node.get('name','')
    if name.startswith(protected):
        assert name in lookup,name
        assert signature(before,bb,node)==signature(after,ab,lookup[name]),name
        checked.append(name)
assert any(n.startswith('Roof_Exact_Intersection_Seam') for n in lookup)
assert any(n.startswith('Central_Junction_Cut_Tile') for n in lookup)
report={'protectedNodesUnchanged':len(checked),'checkedNodes':checked,'glbValidHeader':True,
        'sha256':hashlib.sha256((ROOT/'CipherSecurities-clock.glb').read_bytes()).hexdigest(),'gameApplied':False}
import math
full={'central':0,'wing':0}
for node in after['nodes']:
    name=node.get('name','')
    kind='central' if name.startswith('Central_Junction_Cut_Tile') else 'wing' if name.startswith('Wing_Reference_Tile') else None
    if not kind:continue
    primitive=after['meshes'][node['mesh']]['primitives'][0]
    accessor=after['accessors'][primitive['attributes']['POSITION']]
    dx,dy,dz=[b-a for a,b in zip(accessor['min'],accessor['max'])]
    if kind=='central':
        matches=abs(dx*math.sqrt(1+(.75/1.17)**2)-.195)<1e-5 and abs(dz-.275)<1e-5
    else:
        matches=(abs(dx-.275)<1e-5 and abs(dz*math.sqrt(1+(.43/1.08)**2)-.195)<1e-5) or (abs(dx*math.sqrt(1+(.43/.60)**2)-.195)<1e-5 and abs(dz-.275)<1e-5)
    full[kind]+=int(matches)
assert min(full.values())>20,full
report['measuredFullRectangularTiles']=full
report['fullTileSurfaceSize']=[.275,.195]
(ROOT/'validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'protectedNodesUnchanged':len(checked),'glbValidHeader':True,'rectangularTiles':full}))
