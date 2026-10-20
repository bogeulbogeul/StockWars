import bpy,json
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'Anna-leaf-moods.glb'))
o=bpy.data.objects['Anna_PlumpLeaf'];groups={g.index:g.name for g in o.vertex_groups}
assert all(len(v.groups)==1 and groups[v.groups[0].group]=='Leaf_Stem' and abs(v.groups[0].weight-1)<1e-6 for v in o.data.vertices)
assert len(bpy.data.actions)==4
print('REIMPORT_RIGID_LEAF_OK')
