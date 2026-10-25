"""Reload delivery GLB and check exterior geometry and preserved entrance."""
import bpy,bmesh,json,math
from pathlib import Path
R=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'Furniture-clean.glb'))
objects=list(bpy.context.scene.objects);meshes=[o for o in objects if o.type=='MESH']
points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
assert points and all(math.isfinite(c) for p in points for c in p)
assert min(p.z for p in points)>-.001
assert not any(o.name.startswith(('Main_Sealed_Roof','Main_Rounded_Tile','Showroom_Sealed_Roof','Showroom_Rounded_Tile')) for o in objects)
def count(prefix):return sum(o.name.startswith(prefix) for o in objects)
assert count('Main_Domed_Ridge_Cap')==9 and count('Wing_Domed_Ridge_Cap')==10
assert count('Cocoa_Closed_Valley_Liner')==2
assert count('Entry_Double_Door_Leaf')==2
assert count('Showroom_Inset_Mullion')==2
assert count('Showroom_Inset_Blue_Glass')==1
assert count('Chair_House_Plaque')==1
bad=[]
for o in meshes:
 if o.name.startswith(('Pitched_Cocoa','Rounded_Cocoa','Cocoa_Closed_Valley','Main_Domed','Wing_Domed','Joined_Timber')):
  bm=bmesh.new();bm.from_mesh(o.data)
  bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
  if any(not e.is_manifold for e in bm.edges):bad.append(o.name)
  bm.free()
assert not bad,bad
door=[o.matrix_world@v.co for o in meshes if o.name.startswith('Entry_Double_Door_Leaf') for v in o.data.vertices]
report={'glbReload':True,'finitePositions':True,'ground':min(p.z for p in points),'roofTiles':count('Rounded_Cocoa_Tile'),
 'mainRidgeCaps':9,'wingRidgeCaps':10,'valleyLiners':2,'newRoofAndTimberClosed':True,'doubleDoorLeaves':2,'showcaseMullions':2,
 'doorCenterX':(min(p.x for p in door)+max(p.x for p in door))/2,'doorHeight':max(p.z for p in door)-min(p.z for p in door),
 'modelWidth':max(p.x for p in points)-min(p.x for p in points),'gameApplied':False}
(R/'validation.json').write_text(json.dumps(report,indent=2));print('PASS',report)
