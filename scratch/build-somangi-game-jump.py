import bpy
from pathlib import Path
P=Path('C:/GitHub/StockWars')
bpy.ops.wm.open_mainfile(filepath=str(P/'output/somangi-jump-v1/somangi-jump.blend'))
bpy.context.scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['Somangi_Rig']
bpy.ops.export_scene.gltf(filepath=str(P/'web/assets/characters/3d/somangi/jump.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
