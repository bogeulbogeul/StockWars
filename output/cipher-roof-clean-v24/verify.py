import bpy,bmesh,math,json
from pathlib import Path
R=Path(__file__).resolve().parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'CipherSecurities-clock.glb'))
s=bpy.context.scene;objects=list(s.objects)
for n in ['Clock_Hour','Clock_Minute','Door_Assembly','Pediment_Unified_Closed_Solid']:assert n in s.objects,n
assert not any(o.name.startswith(('Roof_Tile_','Roof_Plane_','Central_Ridge')) for o in objects)
bad=[]
for o in objects:
 if o.type=='MESH' and o.name.startswith(('Clean_Roof_Base','Clean_Blue_Tile','Clean_Central_Ridge','Clean_Wing_Ridge','Clean_Wing_Hip')):
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
  if any(not e.is_manifold for e in bm.edges):bad.append(o.name)
  bm.free()
assert not bad,bad
pts=[o.matrix_world@v.co for o in objects if o.type=='MESH' for v in o.data.vertices]
assert all(math.isfinite(c) for p in pts for c in p)
ridge=[o.matrix_world@v.co for o in objects if o.type=='MESH' and o.name.startswith('Clean_Central_Ridge') for v in o.data.vertices]
assert max(p.x for p in ridge)-min(p.x for p in ridge)<.20
(R/'validation.json').write_text(json.dumps({'glbReload':True,'closedNewRoofMeshes':True,'finitePositions':True,'centralRidgeStraight':True,'clockAndDoorPreserved':True,'tiles':sum(o.name.startswith('Clean_Blue_Tile') for o in objects),'gameApplied':False},indent=2));print('PASS')
