import bpy
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/Users/bogeu/Downloads/Meshy_AI_Cedar_Haven_Sofa_1020184130_texture.glb')
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  print('BOUNDS',[(i,min((o.matrix_world@v.co)[i] for v in o.data.vertices),max((o.matrix_world@v.co)[i] for v in o.data.vertices)) for i in range(3)])
