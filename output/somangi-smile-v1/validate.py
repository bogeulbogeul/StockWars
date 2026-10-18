import bpy,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'blank-buddy-walk-v3/somangi-walk.blend'))
o=bpy.data.objects['Somangi_Body'];positions=[tuple(v.co) for v in o.data.vertices];weights=[[(g.group,g.weight) for g in v.groups] for v in o.data.vertices]
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-happy.blend'));o=bpy.data.objects['Somangi_Body']
assert positions==[tuple(v.co) for v in o.data.vertices] and weights==[[(g.group,g.weight) for g in v.groups] for v in o.data.vertices]
assert not o.data.materials[0].node_tree.nodes.get('Principled BSDF').inputs['Normal'].links
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'somangi-happy.glb'))
assert sum(o.type=='ARMATURE' for o in bpy.context.scene.objects)==1
report={'mesh_positions_unchanged':True,'weights_unchanged':True,'normal_map_disconnected':True,'glb_import_passed':True,'expression':'happy','runtime_switch_implemented':False}
(P/'validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
