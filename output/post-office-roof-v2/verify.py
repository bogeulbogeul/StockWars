import bpy,bmesh,math,json
from pathlib import Path
R=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'PostOffice.glb'))
s=bpy.context.scene;objects=list(s.objects)
def count(prefix):return sum(o.name.startswith(prefix) for o in objects)
assert count('Rounded_Pitched_Terracotta_Tile')==128
assert count('Terracotta_Domed_Ridge')==8 and count('Terracotta_Ridge_Overlap')==9
assert count('Collection_Box_Body')==1 and count('Envelope_Ivory_Body')==1
assert count('Mailbox_Envelope_Ivory_Body')==1
assert not any(o.name.startswith(('Sealed_Curved_Roof','Continuous_Curved_Timber_Edge','Rounded_Terracotta_Tile')) for o in objects)
bad=[]
for o in objects:
 if o.type=='MESH' and o.name.startswith(('Straight_Terracotta_Roof','Rounded_Pitched_Terracotta_Tile','Joined_Post_Office_Timber_Eaves')):
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
  if any(not e.is_manifold for e in bm.edges):bad.append(o.name)
  bm.free()
assert not bad,bad
points=[o.matrix_world@v.co for o in objects if o.type=='MESH' for v in o.data.vertices]
assert all(math.isfinite(c) for p in points for c in p)
assert min(p.z for p in points)>-.001
report={'glbReload':True,'closedRoofAndTimber':True,'tiles':128,'ridgeCaps':8,'overlapBands':9,'envelopeSignAndMailboxPreserved':True,'finitePositions':True,'ground':min(p.z for p in points),'gameApplied':False}
(R/'validation.json').write_text(json.dumps(report,indent=2));print('PASS',report)
