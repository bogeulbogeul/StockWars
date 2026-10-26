import bpy,json
from pathlib import Path
from mathutils.kdtree import KDTree
P=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P.parent/'somangi-face-smooth-v1/somangi-face-smooth.glb'))
original=[o.matrix_world@v.co for o in bpy.context.scene.objects if o.type=='MESH' for v in o.data.vertices]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'somangi-arms-separated.glb'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert sorted(o.name for o in objects)==['Arm.L','Arm.R','Body']
points=[o.matrix_world@v.co for o in objects for v in o.data.vertices]
tree=KDTree(len(points))
for i,p in enumerate(points):tree.insert(p,i)
tree.balance()
error=max(tree.find(p)[2] for p in original)
assert error<1e-6,error
report=json.loads((P/'validation.json').read_text())
report['glbRoundTrip']={'meshObjects':[o.name for o in objects],
    'maximumOriginalVertexNearestDistance':error,'originalVertexSamples':len(original)}
(P/'validation.json').write_text(json.dumps(report,indent=2))
print('ROUNDTRIP_VALIDATION',report['glbRoundTrip'])
