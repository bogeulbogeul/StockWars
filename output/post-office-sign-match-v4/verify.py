import bpy,json,hashlib,math
from pathlib import Path
R=Path(__file__).resolve().parent
def signature(o):
 values=[tuple(v.co) for v in o.data.vertices] if o.type=='MESH' else [tuple(p.co) for sp in o.data.splines for p in sp.points]
 return hashlib.sha256(repr(values).encode()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(R/'PostOffice-shared-envelope-sign.blend'))
actual={o.name.removeprefix('Post_Sign_Shared_'):signature(o) for o in bpy.context.scene.objects if o.name.startswith('Post_Sign_Shared_Mailbox_Envelope_')}
bpy.ops.wm.open_mainfile(filepath=str(R.parent/'home-envelope-correct-v7/Home-correct-envelope.blend'))
assert len(actual)==5 and all(signature(bpy.data.objects[n])==h for n,h in actual.items())
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'PostOffice.glb'))
objects=list(bpy.context.scene.objects)
assert sum(o.name.startswith('Post_Sign_Shared_Mailbox_Envelope_') for o in objects)==5
assert sum(o.name.startswith('Post_Shared_Mailbox_Envelope_') for o in objects)==5
assert any(o.name=='Sign_Solid_Timber_Back' for o in objects)
assert not any(o.name=='Envelope_Ivory_Body' for o in objects)
assert all(math.isfinite(c) for o in objects if o.type=='MESH' for v in o.data.vertices for c in v.co)
(R/'validation.json').write_text(json.dumps({'sameHomeEnvelopeGeometry':True,'signParts':5,'mailboxPartsPreserved':5,'framePreserved':True,'glbReload':True,'finitePositions':True,'gameApplied':False},indent=2));print('PASS')
