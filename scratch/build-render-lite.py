import bpy, json, struct, pathlib, numpy as np
root=pathlib.Path(r'C:/GitHub/StockWars')
out=root/'web/assets/buildings/3d/render-lite-v1';out.mkdir(exist_ok=True)
def glb_read(path):
 data=path.read_bytes();size,typ=struct.unpack_from('<II',data,12);doc=json.loads(data[20:20+size]);start=20+size;bs,bt=struct.unpack_from('<II',data,start);return doc,data[start+8:start+8+bs]
def attr(doc,blob,i):
 a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];dim={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];offset=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',np.dtype(dtype).itemsize*dim);return np.ndarray((a['count'],dim),dtype=dtype,buffer=blob,offset=offset,strides=(stride,np.dtype(dtype).itemsize)).copy()
report=[]
for filename,name in [('Bank-clean.glb','Bank_Continuous_Joined_Eaves'),('Pub-clean.glb','Porch_Continuous_Timber_Frame')]:
 doc,blob=glb_read(root/'web/assets/buildings/3d'/filename)
 node=next(n for n in doc['nodes'] if n.get('name')==name);pr=doc['meshes'][node['mesh']]['primitives'][0]
 pos=attr(doc,blob,pr['attributes']['POSITION']);norm=attr(doc,blob,pr['attributes']['NORMAL']);idx=attr(doc,blob,pr['indices']).reshape(-1,3);uv=attr(doc,blob,pr['attributes']['TEXCOORD_0']) if 'TEXCOORD_0' in pr['attributes'] else None
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(pos.tolist(),[],idx.tolist());mesh.update()
 for poly in mesh.polygons:poly.use_smooth=True
 mesh.normals_split_custom_set_from_vertices(norm.tolist())
 if uv is not None:
  layer=mesh.uv_layers.new(name='UVMap');vi=np.empty(len(mesh.loops),dtype=np.int32);mesh.loops.foreach_get('vertex_index',vi);layer.data.foreach_set('uv',uv[vi].reshape(-1))
 ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);bpy.context.view_layer.objects.active=ob;ob.select_set(True)
 mod=ob.modifiers.new('render-only-decimation','DECIMATE');mod.ratio=.03;mod.use_collapse_triangulate=True
 evaluated=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());lite=evaluated.to_mesh(preserve_all_data_layers=True,depsgraph=bpy.context.evaluated_depsgraph_get());lite.calc_loop_triangles()
 v=np.empty((len(lite.vertices),3),np.float32);lite.vertices.foreach_get('co',v.reshape(-1));vi=np.empty(len(lite.loops),np.int32);lite.loops.foreach_get('vertex_index',vi)
 n=np.empty((len(lite.corner_normals),3),np.float32);lite.corner_normals.foreach_get('vector',n.reshape(-1));tri=np.empty((len(lite.loop_triangles),3),np.int32);lite.loop_triangles.foreach_get('loops',tri.reshape(-1));flat=tri.reshape(-1)
 arrays=[v[vi[flat]],n[flat]]
 if uv is not None:
  u=np.empty((len(lite.loops),2),np.float32);lite.uv_layers.active.data.foreach_get('uv',u.reshape(-1));arrays.append(u[flat])
 allrows=np.concatenate(arrays,axis=1);unique,inverse=np.unique(allrows,axis=0,return_inverse=True)
 bins=bytearray();views=[];accessors=[]
 def add(array,kind,component):
  while len(bins)%4:bins.append(0)
  views.append({'buffer':0,'byteOffset':len(bins),'byteLength':array.nbytes});bins.extend(array.tobytes());a={'bufferView':len(views)-1,'componentType':component,'count':len(array),'type':kind}
  if kind=='VEC3':a.update(min=array.min(axis=0).tolist(),max=array.max(axis=0).tolist())
  accessors.append(a);return len(accessors)-1
 attrs={'POSITION':add(unique[:,:3].copy(),'VEC3',5126),'NORMAL':add(unique[:,3:6].copy(),'VEC3',5126)}
 if uv is not None:attrs['TEXCOORD_0']=add(unique[:,6:8].copy(),'VEC2',5126)
 ix=add(inverse.astype(np.uint32),'SCALAR',5125)
 output={'asset':{'version':'2.0','generator':'StockWars static render-only decimation'},'buffers':[{'byteLength':len(bins)}],'bufferViews':views,'accessors':accessors,'meshes':[{'primitives':[{'attributes':attrs,'indices':ix}]}],'nodes':[{'name':name,'mesh':0}],'scenes':[{'nodes':[0]}],'scene':0}
 js=json.dumps(output,separators=(',',':')).encode();js+=b' '*((-len(js))%4);bins+=b'\0'*((-len(bins))%4);data=struct.pack('<III',0x46546c67,2,28+len(js)+len(bins))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(bins),0x004e4942)+bins
 target=out/(name+'.glb');target.write_bytes(data)
 report.append({'mesh':name,'before':len(idx),'after':len(tri),'bytes':len(data),'boundsBefore':[pos.min(axis=0).tolist(),pos.max(axis=0).tolist()],'boundsAfter':[v.min(axis=0).tolist(),v.max(axis=0).tolist()]})
 print(json.dumps(report[-1]),flush=True);evaluated.to_mesh_clear();bpy.data.objects.remove(ob,do_unlink=True);bpy.data.meshes.remove(mesh)
(root/'output/frame-performance-v1/geometry.json').write_text(json.dumps(report,indent=2))
