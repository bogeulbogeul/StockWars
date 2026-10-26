"""Check unchanged facade meshes, then reload the delivered roof asset."""
import bpy,json,math,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
def signatures(path):
 bpy.ops.wm.open_mainfile(filepath=str(path));result={}
 for o in bpy.context.scene.objects:
  if o.type!='MESH' or o.get('preview_only',False) or o.name.startswith(('Preview_','Coral_Ridge','Coral_Clay_Roof_Tile')):continue
  values=[tuple(round(c,7) for c in o.matrix_world@v.co) for v in o.data.vertices]
  result[o.name]=hashlib.sha256(str(values).encode()).hexdigest()
 return result
before=signatures(ROOT.parent/'vivian-door-cross-v8'/'VivianStore-fitted-cross.blend')
after=signatures(ROOT/'VivianStore-crafted-roof.blend')
assert before==after,'Non-roof geometry changed'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
assert points and all(math.isfinite(c) for p in points for c in p)
assert min(p.z for p in points)>-.001
assert any(o.name.startswith('Door_Glass_Unified_Fitted_Cross') for o in meshes)
caps=[o for o in meshes if o.name.startswith('Coral_Ridge_Cap')]
bands=[o for o in meshes if o.name.startswith('Coral_Ridge_Rounded_Overlap_Band')]
tiles=[o for o in meshes if o.name.startswith('Coral_Clay_Roof_Tile')]
assert len(caps)==9 and len(bands)==10 and len(tiles)==144
report={'glbReload':True,'finitePositions':True,'ground':min(p.z for p in points),
 'unchangedNonRoofMeshes':len(before),'doorGlassCrossPreserved':True,
 'ridgeCaps':len(caps),'overlapBands':len(bands),'tiles':len(tiles),'gameApplied':False}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2));print('PASS',json.dumps(report))
