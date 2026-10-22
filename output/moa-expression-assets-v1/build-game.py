"""Retain the game's bench pose and add the authored doze motion and face."""
import bpy
import importlib.util
import json
from pathlib import Path

P = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('moa_builder', P/'build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'anna-size-sit-match-v1/Anna-size-sit-matched.blend'))
rig = bpy.data.objects['Somangi_Rig']
body = bpy.data.objects['Somangi_Body']
texture = body.data.materials[0].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].links[0].from_node
image = bpy.data.images.load(str(P/'doze-basecolor.png'), check_existing=False)
image.pack()
texture.image = image
action = builder.make_doze(rig, 'Bench_Seated')
rig.animation_data.action = action
bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'Moa-bench-doze.blend'))
clips = builder.export(rig, 'Moa-bench-doze')
assert 'Seated_Doze' in clips and 'Bench_Seated' in clips
(P/'game-clips.json').write_text(json.dumps({'clips': clips, 'seat_plane': 0,
    'source_pose': 'Bench_Seated', 'doze_duration_seconds': 4}, indent=2))
