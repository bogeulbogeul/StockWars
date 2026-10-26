import bpy,sys
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P));from merge_clip import merge_clip
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-hidden-shoulder-v39/somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];m=b.data.materials[0];n=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');skin=next(n for n in b.data.materials[2].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
print('SKIN',skin.inputs['Base Color'].default_value[:])
for key in ['Base Color','Metallic','Roughness']:
 for l in list(n.inputs[key].links):m.node_tree.links.remove(l)
 n.inputs[key].default_value=skin.inputs[key].default_value
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True);merge_clip(P/'somangi-eat.glb','Diagnostic')
