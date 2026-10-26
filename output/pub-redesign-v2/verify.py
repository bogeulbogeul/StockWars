import bpy,bmesh,math,json
from pathlib import Path
R=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'Pub-clean.glb'))
s=bpy.context.scene;objects=list(s.objects)
def count(prefix):return sum(o.name.startswith(prefix) for o in objects)
assert count('Main_Burgundy_Ridge')==12 and count('Porch_Burgundy_Ridge')==4
assert count('Golden_Crescent')==1 and count('Round_Pub_Sign')==1
assert count('Double_Arch_Door')==2 and count('Door_Blue_Glass_Left')>=1
assert count('Lantern_Glass')==2 and count('Pub_Closed_Chimney_Collar')==1
assert count('Front_Oak_Post')==4 and count('Rear_Oak_Post')==2
assert not any(o.name.startswith(('Sealed_Burgundy_Roof','Broad_Burgundy_Tile','Timber_Post')) for o in objects)
points=[o.matrix_world@v.co for o in objects if o.type=='MESH' for v in o.data.vertices]
assert all(math.isfinite(c) for p in points for c in p)
assert min(p.z for p in points)>-.001
bad=[]
for o in objects:
 if o.type=='MESH' and o.name.startswith(('Rounded_Burgundy_Tile','Burgundy_Pitched_Roof','Pub_Closed_Chimney_Collar','Porch_Continuous_Timber')):
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
  if any(not e.is_manifold for e in bm.edges):bad.append(o.name)
  bm.free()
assert not bad,bad
report={'glbReload':True,'finitePositions':True,'ground':min(p.z for p in points),'closedRoofAndChimneyCollar':True,
 'tiles':count('Rounded_Burgundy_Tile'),'ridgeCaps':16,'crescent':True,'beerSign':True,'lanterns':2,'doubleDoorLeaves':2,
 'latticeMeshes':sum('Diamond' in o.name for o in objects),'gameApplied':False}
(R/'validation.json').write_text(json.dumps(report,indent=2));print('PASS',report)
