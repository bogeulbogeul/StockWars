"""Reuse current exterior window meshes and finishes in the expanded interior."""
import copy, hashlib, json, struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/information-exterior-windows-interior-v1'
OUT.mkdir(parents=True,exist_ok=True)
def read(path):
    b=path.read_bytes(); n=struct.unpack_from('<I',b,12)[0]
    return json.loads(b[20:20+n]),b[28+n:]
target=ROOT/'web/assets/office/3d/Information-furnished-room.glb'
backup=OUT/'Information-before-window-update.glb'
if not backup.exists():backup.write_bytes(target.read_bytes())
d,binary=read(backup)
e,eb=read(ROOT/'web/assets/buildings/3d/Information-clean.glb')
assert not e.get('images')
old=copy.deepcopy(d)
vo,ao,mo,meo=map(lambda k:len(d[k]),['bufferViews','accessors','materials','meshes'])
offset=len(binary); binary+=eb
for v in e['bufferViews']:
    v=copy.deepcopy(v);v['byteOffset']=v.get('byteOffset',0)+offset;d['bufferViews'].append(v)
for a in e['accessors']:
    a=copy.deepcopy(a)
    if 'bufferView' in a:a['bufferView']+=vo
    assert 'sparse' not in a
    d['accessors'].append(a)
d['materials']+=copy.deepcopy(e['materials'])
for m in e['meshes']:
    m=copy.deepcopy(m)
    for p in m['primitives']:
        p['attributes']={k:v+ao for k,v in p['attributes'].items()}
        if 'indices' in p:p['indices']+=ao
        if 'material' in p:p['material']+=mo
    d['meshes'].append(m)
old_window_ids=[1,235,307,308,309,376,381,382]
for scene in d['scenes']:scene['nodes']=[i for i in scene['nodes'] if i not in old_window_ids]
sy=2.8/1.35; bottom=(.47-.15)*sy
sources=[n for n in e['nodes'] if n.get('name','').startswith('Front_Left_Window_')]
assert len(sources)==4
for label,sx,cx in [('Right_Side',6/1.84,0),('Front_Left',8/2.98,-.99*8/2.98),('Front_Right',8/2.98,.99*8/2.98)]:
    if label=='Right_Side':
        # Seat the glass just inside the plaster opening, avoiding an exposed
        # pale edge between the existing reveal and the exterior-derived frame.
        matrix=[0,0,sx,0, 0,sy,0,0, -1,0,0,0, 3.965+.952,bottom-.47*sy,.99*sx,1]
    else:
        matrix=[sx,0,0,0, 0,sy,0,0, 0,0,-1,0, cx+.99*sx,bottom-.47*sy,3.015+.952,1]
    children=[]
    for source in sources:
        n=copy.deepcopy(source);n['mesh']+=meo
        n['name']=n['name'].replace('Front_Left_Window',label+'_Exterior_Matched_Window')
        children.append(len(d['nodes']));d['nodes'].append(n)
    parent={'name':label+'_Exterior_Matched_Window_Group','matrix':matrix,'children':children}
    if label.startswith('Front'):parent['extras']={'interiorFrontCutaway':True}
    d['scenes'][0]['nodes'].append(len(d['nodes']));d['nodes'].append(parent)
d['buffers'][0]['byteLength']=len(binary)
d['extensionsUsed']=sorted(set(d.get('extensionsUsed',[])+e.get('extensionsUsed',[])))
assert d['nodes'][:len(old['nodes'])]==old['nodes']
assert binary[:len(read(backup)[1])]==read(backup)[1]
j=json.dumps(d,ensure_ascii=False,separators=(',',':')).encode();j+=b' '*(-len(j)%4)
result=struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary
targets=[target,ROOT/'electron-app/dist/win-unpacked/resources/web/assets/office/3d/Information-furnished-room.glb']
for p in targets:p.write_bytes(result)
(OUT/'Information-furnished-room.glb').write_bytes(result)
(OUT/'validation.json').write_text(json.dumps({'windowGroups':3,'sourceComponentsPerWindow':4,'removedOldWindowNodes':old_window_ids,'originalNodesAndBinaryPreserved':True,'sha256':hashlib.sha256(result).hexdigest(),'targetsMatch':all(p.read_bytes()==result for p in targets)},indent=2))
print('PASS: exterior window geometry/materials reused; original room data preserved')
