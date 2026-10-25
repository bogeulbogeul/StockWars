"""Check that moldings and inset faces form one closed connected panel each."""
import bpy,bmesh,json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
excluded=('Left_Display_Lower_Panel','Right_Display_Lower_Panel','Left_Display_Decorative_Panel','Right_Display_Decorative_Panel')
def signatures(path):
 bpy.ops.wm.open_mainfile(filepath=str(path));result={}
 for o in bpy.context.scene.objects:
  if o.type!='MESH' or o.get('preview_only',False) or o.name.startswith(('Preview_',*excluded)):continue
  values=[tuple(round(c,7) for c in o.matrix_world@v.co) for v in o.data.vertices]
  result[o.name]=hashlib.sha256(str(values).encode()).hexdigest()
 return result
before=signatures(ROOT.parent/'vivian-panel-contact-v10'/'VivianStore-panel-contact.blend')
after=signatures(ROOT/'VivianStore-integrated-molding.blend');assert before==after
panels=[]
for side in ('Left','Right'):
 o=bpy.data.objects[side+'_Display_Lower_Panel'];bm=bmesh.new();bm.from_mesh(o.data)
 boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges)
 remaining=set(bm.verts);components=0
 while remaining:
  components+=1;stack=[remaining.pop()]
  while stack:
   v=stack.pop()
   for e in v.link_edges:
    other=e.other_vert(v)
    if other in remaining:remaining.remove(other);stack.append(other)
 bm.free();assert boundary==0 and nonmanifold==0 and components==1,(side,boundary,nonmanifold,components)
 panels.append({'side':side,'connectedComponents':components,'boundaryEdges':boundary,'nonManifoldEdges':nonmanifold})
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(ROOT/'VivianStore-clean.glb'))
points=[o.matrix_world@v.co for o in bpy.context.scene.objects if o.type=='MESH' for v in o.data.vertices]
assert points and all(math.isfinite(c) for p in points for c in p)
assert min(p.z for p in points)>-.001
report={'glbReload':True,'finiteBounds':True,'unchangedOtherMeshes':len(before),'integratedPanels':panels,'gameApplied':False}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2));print('PASS',json.dumps(report))
