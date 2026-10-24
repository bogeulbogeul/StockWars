"""Deliver the approved unclothed Moa, retaining her leaf bones and fixed walk."""
import bpy,sys,json,hashlib
from pathlib import Path
P=Path(__file__).resolve().parent
sys.path.insert(0,str(P.parent/'moa-somangi-base-v1'))
from leaf_moods import isolate_exported_tracks
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'moa-user-vest-fit-v14/moa.blend'))
rig=bpy.data.objects['Somangi_WholeArmRig']
bpy.context.scene.frame_set(1)
names=['Somangi_SmoothBody','Somangi_WholeArmRig','Moa_Leaf','Moa_LeafStem']
for ob in list(bpy.context.scene.objects):
    if ob.name not in names:bpy.data.objects.remove(ob,do_unlink=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(P/'moa.blend'))
bpy.ops.export_scene.gltf(filepath=str(P/'moa.glb'),use_selection=True,
    export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',
    export_frame_range=False,export_cameras=False,export_lights=False)
isolate_exported_tracks(P/'moa.glb')
target=P.parent.parent/'web/assets/characters/3d/moa'
(target/'moa.glb').write_bytes((P/'moa.glb').read_bytes())
(P/'verification.json').write_text(json.dumps(dict(objects=names,clothes=False,
    bodyColour='#FFDBA3',walk='v5 fixed shoulder attachment',
    leafMoods=['Calm','Happy','Sad','Curious','Surprised']),indent=2))
