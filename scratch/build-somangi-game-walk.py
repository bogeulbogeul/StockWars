import bpy
from pathlib import Path
P=Path('C:/GitHub/StockWars')
bpy.ops.wm.open_mainfile(filepath=str(P/'output/somangi-walk-v4/somangi-walk.blend'))
r=bpy.data.objects['Somangi_Rig']
m=bpy.data.objects['Somangi_Body'];bs=m.data.materials[0].node_tree.nodes.get('Principled BSDF');tex=bpy.data.images.load(str(P/'output/somangi-smile-v1/base-original.png'));tex.pack();bs.inputs['Base Color'].links[0].from_node.image=tex
s=bpy.context.scene;s.frame_start=1;s.frame_end=25;s.frame_set(7)
bpy.ops.object.select_all(action='DESELECT')
for name in ['Somangi_Rig','Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=r
bpy.ops.export_scene.gltf(filepath=str(P/'web/assets/characters/3d/somangi/walk.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=True,export_animation_mode='ACTIONS',export_cameras=False,export_lights=False)
