import bpy
from pathlib import Path
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='C:/GitHub/StockWars/web/assets/characters/3d/somangi/wave.glb')
bpy.context.scene.frame_set(1)
for o in bpy.data.objects:
 print('OBJ',o.name,o.type,o.hide_render,tuple(o.dimensions),len(o.data.vertices) if o.type=='MESH' else '',o.name in bpy.context.scene.objects)
