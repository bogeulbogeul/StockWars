import bpy,bmesh,math,json
from pathlib import Path
R=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'Bookstore-clean.glb'))
s=bpy.context.scene;objects=list(s.objects)
assert sum(o.name.startswith('Clean_Closed_Plum_Valley') for o in objects)==2
assert sum(o.name.startswith('Clean_Main_Ridge') for o in objects)==8
assert sum(o.name.startswith('Clean_Wing_Ridge') for o in objects)==8
bad=[]
for o in objects:
 if o.type=='MESH' and o.name.startswith(('Clean_Pitched_Roof','Clean_Plum_Tile','Clean_Closed_Plum_Valley','Clean_Main_Ridge','Clean_Wing_Ridge')):
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
  if any(not e.is_manifold for e in bm.edges):bad.append(o.name)
  bm.free()
assert not bad,bad
assert all(math.isfinite(c) for o in objects if o.type=='MESH' for v in o.data.vertices for c in v.co)
(R/'validation.json').write_text(json.dumps({'glbReload':True,'closedRoofTilesRidgesValleys':True,'valleyParts':2,'ridgeCaps':16,'finitePositions':True},indent=2));print('PASS')
