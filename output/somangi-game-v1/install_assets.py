import json,struct,io,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
P=Path(__file__).resolve().parent
D=P.parents[1]/'web/assets/characters/3d/somangi'
D.mkdir(parents=True,exist_ok=True)
F=D/'faces';F.mkdir(exist_ok=True)
ids='smile happy neutral curious surprised worried teary pout determined shy relieved touched sleepy delicious'.split()
for name in ids:
 data=(P.parent/f'somangi-story-expressions-v6/textures/{name}.png').read_bytes();(F/f'{name}.png').write_bytes(data)
 rgb=np.asarray(Image.open(io.BytesIO(data)).convert('RGB'))/255
 mask=np.full((*rgb.shape[:2],4),255,dtype=np.uint8);mask[:,:,3]=(np.clip((rgb.mean(2)-.08)/.16,0,1)*255).astype(np.uint8)
 Image.fromarray(mask).save(F/f'{name}-specular.png')
def install(source,target,clip):
 raw=source.read_bytes();length=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+length]);binary=bytearray(raw[28+length:])
 assert len(doc['animations'])==1
 doc['animations'][0]['name']=clip
 if clip=='Walk_InPlace':
  inputs={s['input'] for s in doc['animations'][0]['samplers']}
  start=min(doc['accessors'][i]['min'][0] for i in inputs)
  for i in inputs:
   accessor=doc['accessors'][i];view=doc['bufferViews'][accessor['bufferView']]
   times=np.frombuffer(binary,dtype='<f4',count=accessor['count'],offset=view.get('byteOffset',0)+accessor.get('byteOffset',0))
   times-=start;accessor['min']=[float(times.min())];accessor['max']=[float(times.max())]
   del times
 while len(binary)%4:binary.append(0)
 data=(F/'smile-specular.png').read_bytes();offset=len(binary);binary.extend(data)
 view=len(doc['bufferViews']);doc['bufferViews'].append(dict(buffer=0,byteOffset=offset,byteLength=len(data)))
 im=len(doc['images']);doc['images'].append(dict(bufferView=view,mimeType='image/png'))
 tex=len(doc['textures']);doc['textures'].append(dict(source=im))
 doc.setdefault('extensionsUsed',[])
 if 'KHR_materials_specular' not in doc['extensionsUsed']:doc['extensionsUsed'].append('KHR_materials_specular')
 for mat in doc['materials']:
  if mat.get('name') in ['Expression_smile_skin','Expression_smile_ink','Material_0','Face_ink_nonmetal']:
   mat.setdefault('extensions',{})['KHR_materials_specular']=dict(specularFactor=1,specularTexture=dict(index=tex))
 doc['buffers'][0]['byteLength']=len(binary)
 while len(binary)%4:binary.append(0)
 j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
 (D/target).write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary)
install(P/'walk.glb','walk.glb','Walk_InPlace')
install(P.parent/'somangi-rear-junction-v43/somangi-eat.glb','eat.glb','Eat')
files={str(f.relative_to(D)):hashlib.sha256(f.read_bytes()).hexdigest() for f in D.rglob('*') if f.is_file() and f.name!='manifest.json'}
(D/'manifest.json').write_text(json.dumps(dict(sourceGeometry='somangi-rear-junction-v43',sourceExpressions='somangi-story-expressions-v6',height=100,referenceHeight=1.9000606,footY=-.95064157,expressions=ids,removed=['sad','proud'],files=files),indent=2))
print('INSTALLED',len(files),'files;',len(ids),'expressions')
