"""Append a retouched color texture to GLB; preserve all geometry bytes exactly."""
import pathlib,struct,json,hashlib
ROOT=pathlib.Path(__file__).resolve().parent
SOURCE=pathlib.Path('C:/Users/bogeu/Downloads/BigTree.glb')
raw=SOURCE.read_bytes(); size=struct.unpack_from('<I',raw,12)[0]
doc=json.loads(raw[20:20+size]); original=raw[28+size:]
png=(ROOT/'BigTree-basecolor.png').read_bytes()
offset=(len(original)+3)//4*4
binary=original+b'\0'*(offset-len(original))+png
binary+=b'\0'*((-len(binary))%4)
view=len(doc['bufferViews']); doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(png)})
index=doc['textures'][doc['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
doc['images'][index]={'mimeType':'image/png','bufferView':view}
doc['buffers'][0]['byteLength']=len(binary)
encoded=json.dumps(doc,separators=(',',':')).encode(); encoded+=b' '*((-len(encoded))%4)
output=struct.pack('<4sII',b'glTF',2,28+len(encoded)+len(binary))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(binary),b'BIN\0')+binary
assert binary[:len(original)]==original
(ROOT/'BigTree-retouched.glb').write_bytes(output)
print('Original binary preserved, new texture appended:',len(output),flush=True)

import bpy
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'BigTree.blend'))
scene=bpy.context.scene; obj=next(o for o in scene.objects if o.type=='MESH')
material=obj.data.materials[0]
shader=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
texture=shader.inputs['Base Color'].links[0].from_node
old=texture.image; cleaned=bpy.data.images.load(str(ROOT/'BigTree-basecolor.png'))
camera=scene.camera; front=camera.location.copy(); rotation=camera.rotation_euler.copy()
points=[obj.matrix_world@Vector(c) for c in obj.bound_box]
low=Vector(tuple(min(p[i] for p in points) for i in range(3)))
high=Vector(tuple(max(p[i] for p in points) for i in range(3)))
center=(low+high)/2; span=max(high-low); scale=camera.data.ortho_scale
texture.image=cleaned
scene.render.filepath=str(ROOT/'BigTree-after.png'); bpy.ops.render.render(write_still=True)
offset=front-center; camera.location=center+Vector((-offset.x,-offset.y,offset.z)); camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'BigTree-rear.png'); bpy.ops.render.render(write_still=True)
root_center=Vector((center.x,center.y,low.z+span*.09))
camera.location=root_center+Vector((span*.55,-span*.9,-span*.5)); camera.rotation_euler=(root_center-camera.location).to_track_quat('-Z','Y').to_euler(); camera.data.ortho_scale=span*.8
for label,image in [('underside-before',old),('underside-after',cleaned)]:
    texture.image=image
    scene.render.filepath=str(ROOT/('BigTree-'+label+'.png')); bpy.ops.render.render(write_still=True)
report={'original_binary_preserved':True,'source_sha256':hashlib.sha256(raw).hexdigest(),'output_sha256':hashlib.sha256(output).hexdigest(),'method':'ImageGen local paint repair registered to original UV; texture-only GLB replacement'}
(ROOT/'report.json').write_text(json.dumps(report,indent=2))
