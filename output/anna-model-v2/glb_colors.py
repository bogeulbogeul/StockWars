"""Prevent glTF vertex color multiplication on the independently textured face."""
import json,struct
def clean_face_colors(path):
 raw=path.read_bytes();length,kind=struct.unpack_from('<II',raw,12);doc=json.loads(raw[20:20+length]);tail=raw[20+length:]
 for mesh in doc.get('meshes',[]):
  for p in mesh['primitives']:
   if doc['materials'][p['material']]['name']=='Anna_Face':p['attributes'].pop('COLOR_0',None)
 data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*((-len(data))%4)
 path.write_bytes(struct.pack('<III',0x46546c67,2,20+len(data)+len(tail))+struct.pack('<II',len(data),kind)+data+tail)
