import bpy
from pathlib import Path

source = Path(r'C:\Users\bogeu\Downloads\BigTree.glb')
target = Path(r'C:\GitHub\StockWars\web\assets\props\3d\BigTree-game.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH':
        continue
    before = len(obj.data.polygons)
    modifier = obj.modifiers.new('Game foliage reduction', 'DECIMATE')
    modifier.ratio = 0.035
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    print(f'TREE_FACES {before} -> {len(obj.data.polygons)}', flush=True)
target.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB', export_image_format='AUTO')
print(f'TREE_EXPORTED {target.stat().st_size}', flush=True)
