import bpy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'Information-clean.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
assert points and all(math.isfinite(c) for p in points for c in p)
assert min(p.z for p in points)>-.001
counts={}
for prefix,expected in [('Main',(144,9,10)),('Porch',(24,3,4))]:
 values=tuple(sum(o.name.startswith(prefix+n) for o in meshes) for n in ['_Sage_Clay_Tile','_Ridge_Cap','_Ridge_Rounded_Overlap_Band'])
 assert values==expected,(prefix,values)
 counts[prefix]=values
assert any(o.name=='Information_Sprout_Wall_Mark' for o in bpy.context.scene.objects)
report={'glbReload':True,'finitePositions':True,'ground':min(p.z for p in points),'tilesCapsBands':counts,'sproutPreserved':True,'gameApplied':False}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2));print('PASS',report)
