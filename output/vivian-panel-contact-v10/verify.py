"""Prove lower-panel contact and preserve all other mesh geometry."""
import bpy,json,math,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
changed={'Left_Display_Lower_Panel','Right_Display_Lower_Panel'}
def signatures(path):
 bpy.ops.wm.open_mainfile(filepath=str(path));result={}
 for o in bpy.context.scene.objects:
  if o.type!='MESH' or o.name in changed or o.get('preview_only',False) or o.name.startswith('Preview_'):continue
  positions=[tuple(round(c,7) for c in o.matrix_world@v.co) for v in o.data.vertices]
  result[o.name]=hashlib.sha256(str(positions).encode()).hexdigest()
 return result
before=signatures(ROOT.parent/'vivian-roof-crafted-v9'/'VivianStore-crafted-roof.blend')
after=signatures(ROOT/'VivianStore-panel-contact.blend');assert before==after
base=bpy.data.objects['Foundation'];inverse=base.matrix_world.inverted();contacts=[]
for name in sorted(changed):
 panel=bpy.data.objects[name];points=[panel.matrix_world@v.co for v in panel.data.vertices]
 bottom=min(p.z for p in points);x=(min(p.x for p in points)+max(p.x for p in points))/2;y=min(p.y for p in points)
 origin=inverse@Vector((x,y,.5));direction=(inverse.to_3x3()@Vector((0,0,-1))).normalized()
 hit,location,normal,index=base.ray_cast(origin,direction);assert hit
 surface=(base.matrix_world@location).z
 assert bottom<surface-.005,(name,bottom,surface)
 contacts.append({'panel':name,'bottom':bottom,'moldingSurfaceAtFront':surface,'contactOverlap':surface-bottom})
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'))
points=[o.matrix_world@v.co for o in bpy.context.scene.objects if o.type=='MESH' for v in o.data.vertices]
assert points and all(math.isfinite(c) for p in points for c in p)
assert min(p.z for p in points)>-.001
report={'glbReload':True,'finiteBounds':True,'unchangedOtherMeshes':len(before),'panelContact':contacts,'gameApplied':False}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2));print('PASS',json.dumps(report))
