import bpy,json,shutil
from pathlib import Path
P=Path(__file__).resolve().parent;source=P.parent/'somangi-story-expressions-v5'
bpy.ops.wm.open_mainfile(filepath=str(source/'somangi-expressions.blend'))
data=json.loads((P/'manifest.json').read_text(encoding='utf-8'));entry=next(e for e in data['expressions'] if e['id']=='teary')
shutil.copy2(P/'rebuild/textures/teary.png',P/'textures/teary.png')
image=bpy.data.images.load(str(P/'textures/teary.png'),check_existing=False);image.pack()
for name in entry['materials']:bpy.data.materials[name].node_tree.nodes['Image Texture'].image=image
body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;scene.frame_set(136);original=[body.data.materials[i] for i in [0,1]]
for i,name in enumerate(entry['materials']):body.data.materials[i]=bpy.data.materials[name]
scene.render.filepath=str(P/'portraits/teary.png');bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);rig=bpy.data.objects['Somangi_WholeArmRig'];rig.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(P/'models/teary.glb'),use_selection=True,export_format='GLB',export_skins=True,export_animations=False,export_cameras=False,export_lights=False)
for i,material in enumerate(original):body.data.materials[i]=material
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-expressions.blend'))
