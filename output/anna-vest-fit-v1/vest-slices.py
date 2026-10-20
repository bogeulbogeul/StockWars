import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/AnnaVest.glb')
o=next(o for o in bpy.data.objects if o.type=='MESH')
for z in [-.7,-.5,-.3,-.1,.1,.3,.5,.7]:
 v=[v.co for v in o.data.vertices if abs(v.co.z-z)<.025]
 print(z,[(round(min(p[i] for p in v),3),round(max(p[i] for p in v),3)) for i in [0,1]])
