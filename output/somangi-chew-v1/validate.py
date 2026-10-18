import bpy,json,struct,math
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-chew.blend'));s=bpy.context.scene;body=bpy.data.objects['Somangi_Body'];mouth=bpy.data.objects['Mouth_Animated'];snap={};stationary=0
for f in range(1,74):
 s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get()
 for o in [body,mouth]:
  evaluated=o.evaluated_get(dg);m=evaluated.to_mesh();coords=[v.co.copy() for v in m.vertices]
  assert all(math.isfinite(c) for p in coords for c in p)
  if o==body:stationary=max(stationary,max((p-v.co).length for p,v in zip(coords,body.data.vertices)))
  elif f in [1,10,73]:snap[f]=coords
  evaluated.to_mesh_clear()
loop=max((a-b).length for a,b in zip(snap[1],snap[73]));movement=max((a-b).length for a,b in zip(snap[1],snap[10]));assert stationary<1e-5 and loop<1e-6 and movement>.05
buf=(P/'somangi-chew.glb').read_bytes();n=struct.unpack_from('<I',buf,12)[0];data=json.loads(buf[20:20+n]);assert any(c['target']['path']=='weights' for a in data['animations'] for c in a['channels'])
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'somangi-chew.glb'));assert any(o.type=='MESH' and o.data.shape_keys for o in bpy.context.scene.objects)
report={'frames':73,'seconds':3,'chew_cycles':4,'body_displacement':stationary,'mouth_loop_error':loop,'mouth_movement':movement,'morph_animation_exported':True,'glb_reimport':True,'clips':[a.get('name') for a in data['animations']]}
(P/'validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
