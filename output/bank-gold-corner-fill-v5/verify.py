import bpy,bmesh,math,json
from pathlib import Path
R=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'Bank-clean.glb'))
s=bpy.context.scene;tiles=[o for o in s.objects if o.name.startswith('Gold_Fitted_Corner_Tile')]
assert len(tiles)==2
for o in tiles:
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
 assert all(e.is_manifold for e in bm.edges),o.name
 bm.free()
assert sum(o.name.startswith('Rounded_Gold_Tile') for o in s.objects)==166
assert all(math.isfinite(c) for o in s.objects if o.type=='MESH' for v in o.data.vertices for c in v.co)
(R/'glb-validation.json').write_text(json.dumps({'glbReload':True,'fittedCornerTiles':2,'closedCornerTiles':True,'originalRoofTilesPreserved':166,'finitePositions':True,'gameApplied':False},indent=2));print('PASS')
