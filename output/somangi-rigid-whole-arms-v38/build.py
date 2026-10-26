import bpy,json,sys,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from merge_clip import merge_clip
S=P.parent/'somangi-mouth-bite-v37';bpy.ops.wm.open_mainfile(filepath=str(S/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;scene.frame_set(136)
arm_ids=json.loads((S/'optimized-arm-weights.json').read_text());report={}
for name,entries in arm_ids.items():
    ids=[i for i,w in entries]
    for group_name in ['Body','Head','Arm.L','Arm.R']:body.vertex_groups[group_name].remove(ids)
    body.vertex_groups[name].add(ids,1,'REPLACE');report[name]=ids
# Every original arm vertex, including its root, has exactly one rigid transform.
for name,ids in report.items():
    group=body.vertex_groups[name].index
    assert all(len(body.data.vertices[i].groups)==1 and body.data.vertices[i].groups[0].group==group and body.data.vertices[i].groups[0].weight==1 for i in ids)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(P/'somangi-eat.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True,export_cameras=False,export_lights=False,export_morph=True,export_try_sparse_sk=True)
merge_clip(P/'somangi-eat.glb','RigidWholeArms_Eat');(P/'arm-vertices.json').write_text(json.dumps(report))
