import sys,pathlib,json,struct
sys.path.insert(0,'output/building-retouch-v2/runtime')
import cv2,numpy as np
r=pathlib.Path('output/clothing-book-retouch-final');old=cv2.imread(str(r/'ClothingStore-window-fixed-basecolor.png'));h,w=old.shape[:2]
new=cv2.imread('C:/Users/bogeu/.codex/generated_images/01a14e70-80f5-7ec1-b269-fd22033bebfe/exec-c0f0389d-83b0-48ac-90b7-9098f5d63a89.png');new=cv2.resize(new,(w,h))
dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM);flow=dis.calc(cv2.cvtColor(old,cv2.COLOR_BGR2GRAY),cv2.cvtColor(new,cv2.COLOR_BGR2GRAY),None);yy,xx=np.mgrid[:h,:w].astype(np.float32);aligned=cv2.remap(new,xx+flow[:,:,0],yy+flow[:,:,1],cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
plant=np.zeros((h,w),np.uint8)
polys=json.loads((r/'flower-uv.json').read_text()); pts=[np.rint(np.array(p)*[w,-h]+[0,h-1]).astype(np.int32) for p in polys];cv2.fillPoly(plant,pts,255)
b,g,red=cv2.split(old);seed=(plant>0)&(red>135)&(g>125)&(b>65)&(red.astype(float)>g*.87)
leaf=(g.astype(float)>red*1.08)&(g.astype(float)>b*1.3)
leaf_near=cv2.dilate(leaf.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13)))>0
seed&=leaf_near
near=cv2.dilate(seed.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11)))>0
mask=near&(plant>0)&leaf_near
result=old.copy();result[mask]=aligned[mask];cv2.imwrite(str(r/'ClothingStore-flower-fixed-basecolor.png'),result)
assert np.array_equal(result[~mask],old[~mask])
raw=(r/'ClothingStore-window-fixed.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);binary=raw[28+n:];png=(r/'ClothingStore-flower-fixed-basecolor.png').read_bytes();off=len(binary);bi=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(png)});binary+=png;binary+=b'\0'*((-len(binary))%4)
for mat in doc['materials']:
 index=doc['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]['source'];doc['images'][index]={'mimeType':'image/png','bufferView':bi}
doc['buffers'][0]['byteLength']=len(binary);header=json.dumps(doc,separators=(',',':')).encode();header+=b' '*((-len(header))%4);out=struct.pack('<4sII',b'glTF',2,28+len(header)+len(binary))+struct.pack('<I4s',len(header),b'JSON')+header+struct.pack('<I4s',len(binary),b'BIN\0')+binary;(r/'ClothingStore-flower-fixed.glb').write_bytes(out)
(r/'flower-validation.json').write_text(json.dumps({'pixels_in_local_mask':int(mask.sum()),'outside_local_mask_unchanged':True,'geometry_material_uv_unchanged':True},indent=2));print('Flower mask',int(mask.sum()))
