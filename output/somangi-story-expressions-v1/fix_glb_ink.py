"""Embed a glTF specular alpha mask so black facial ink stays matte."""
import io,json,struct
from pathlib import Path
import numpy as np
from PIL import Image
P=Path(__file__).resolve().parent
manifest=json.loads((P/'manifest.json').read_text(encoding='utf-8'))
for entry in manifest['expressions']:
 path=P/entry['model'];raw=path.read_bytes();length=struct.unpack_from('<I',raw,12)[0]
 doc=json.loads(raw[20:20+length]);offset=20+length;binlength=struct.unpack_from('<I',raw,offset)[0]
 binary=bytearray(raw[offset+8:offset+8+binlength])
 color=np.array(Image.open(P/entry['texture']).convert('RGB'),dtype=np.float32)/255
 alpha=(np.clip((color.mean(axis=2)-.08)/.16,0,1)*255).astype(np.uint8)
 rgba=np.full((*alpha.shape,4),255,dtype=np.uint8);rgba[:,:,3]=alpha
 stream=io.BytesIO();Image.fromarray(rgba).save(stream,format='PNG');png=stream.getvalue()
 binary.extend(b'\0'*((-len(binary))%4));start=len(binary);binary.extend(png)
 view=len(doc['bufferViews']);doc['bufferViews'].append(dict(buffer=0,byteOffset=start,byteLength=len(png)))
 image=len(doc['images']);doc['images'].append(dict(bufferView=view,mimeType='image/png',name=entry['id']+'_ink_specular_mask'))
 texture=len(doc['textures']);doc['textures'].append(dict(source=image))
 for material in doc['materials']:
  if material['name'] not in entry['materials']:continue
  spec=material.setdefault('extensions',{}).setdefault('KHR_materials_specular',{})
  spec['specularFactor']=1.;spec['specularTexture']=dict(index=texture)
 used=doc.setdefault('extensionsUsed',[])
 if 'KHR_materials_specular' not in used:used.append('KHR_materials_specular')
 binary.extend(b'\0'*((-len(binary))%4));doc['buffers'][0]['byteLength']=len(binary)
 encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
 total=12+8+len(encoded)+8+len(binary)
 path.write_bytes(struct.pack('<4sII',b'glTF',2,total)+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+struct.pack('<II',len(binary),0x004E4942)+binary)
