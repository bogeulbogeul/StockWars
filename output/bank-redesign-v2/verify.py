import bpy,bmesh,math,json
from pathlib import Path
R=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'Bank-clean.glb'))
objects=list(bpy.context.scene.objects);meshes=[o for o in objects if o.type=='MESH']
def count(prefix):return sum(o.name.startswith(prefix) for o in objects)
assert count('Main_Gold_Ridge')==12 and count('Porch_Gold_Ridge')==4
assert count('Central_Double_Door_Leaf')==2
assert count('Coin_Gold_Rim')==1
assert count('Gold_Closed_Valley')==2
assert count('Front_Left_Continuous_Window_Arch')==1 and count('Right_Side_Continuous_Window_Arch')==1
assert not any(o.name.startswith(('Sealed_Gold_Roof','Broad_Green_Tile','Porch_Gold_Curved_Edge')) for o in objects)
points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
assert all(math.isfinite(c) for p in points for c in p)
assert min(p.z for p in points)>-.001
bad=[]
for o in meshes:
 if o.name.startswith(('Gold_Pitched_Roof','Rounded_Gold_Tile','Main_Closed_Timber_Soffit','Porch_Continuous_Timber','Gold_Closed_Valley','Central_Double_Door_Leaf')):
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
  if any(not e.is_manifold for e in bm.edges):bad.append(o.name)
  bm.free()
assert not bad,bad
report={'glbReload':True,'finitePositions':True,'ground':min(p.z for p in points),'tiles':count('Rounded_Gold_Tile'),
 'mainRidgeCaps':12,'porchRidgeCaps':4,'closedNewRoofTimberDoors':True,'doubleDoors':2,'engravedCoinPreserved':True,
 'modelWidth':max(p.x for p in points)-min(p.x for p in points),'gameApplied':False}
(R/'validation.json').write_text(json.dumps(report,indent=2));print('PASS',report)
