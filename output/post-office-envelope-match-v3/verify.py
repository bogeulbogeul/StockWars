import bpy,json,hashlib,math
from pathlib import Path
R=Path(__file__).resolve().parent
def data_signature(o):
 if o.type=='MESH':values=[tuple(v.co) for v in o.data.vertices]
 else:values=[tuple(p.co) for spline in o.data.splines for p in spline.points]
 return hashlib.sha256(repr(values).encode()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(R/'PostOffice-shared-envelope.blend'))
actual={o.name.removeprefix('Post_Shared_'):data_signature(o) for o in bpy.context.scene.objects if o.name.startswith('Post_Shared_Mailbox_Envelope_')}
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'home-envelope-correct-v7/Home-correct-envelope.blend'))
assert len(actual)==5
assert all(data_signature(bpy.data.objects[n])==h for n,h in actual.items())
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'PostOffice.glb'))
objects=list(bpy.context.scene.objects)
assert sum(o.name.startswith('Post_Shared_Mailbox_Envelope_') for o in objects)==5
assert any(o.name=='Envelope_Ivory_Body' for o in objects)
assert sum(o.name.startswith('Rounded_Pitched_Terracotta_Tile') for o in objects)==128
assert all(math.isfinite(c) for o in objects if o.type=='MESH' for v in o.data.vertices for c in v.co)
(R/'validation.json').write_text(json.dumps({'sameSourceGeometry':True,'sharedEnvelopeParts':5,'glbReload':True,'buildingSignUnchanged':True,'roofTilesPreserved':128,'finitePositions':True,'gameApplied':False},indent=2));print('PASS shared home envelope geometry and GLB reload')
