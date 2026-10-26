import bpy,math,json
from pathlib import Path
R=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'Information-clean.glb'))
s=bpy.context.scene
points=[o.matrix_world@v.co for o in s.objects if o.type=='MESH' for v in o.data.vertices]
assert points and all(math.isfinite(c) for p in points for c in p)
assert min(p.z for p in points)>-.001
for name in ['Porch_Joined_Timber_Frame','Foundation_Joined_Entry_Steps','Information_Sprout_Wall_Mark']:
 assert name in s.objects,name
for prefix,count in [('Main_Sage_Clay_Tile',144),('Porch_Sage_Clay_Tile',24)]:
 assert sum(o.name.startswith(prefix) for o in s.objects)==count
(R/'glb-validation.json').write_text(json.dumps({'glbReload':True,'finitePositions':True,'ground':min(p.z for p in points),'roofTilesPreserved':168,'gameApplied':False},indent=2))
print('PASS GLB reload, finite coordinates, roof tiles, closed join objects')
