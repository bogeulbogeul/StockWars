import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'CipherSecurities-reference.blend'))
seen={};duplicates=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH' or not o.name.startswith(('Roof_','Central_','Wing_')):continue
 positions=sorted(tuple(round(c,6) for c in o.matrix_world@v.co) for v in o.data.vertices)
 key=hashlib.sha256(str(positions).encode()).hexdigest()
 if key in seen:duplicates.append((seen[key],o.name))
 else:seen[key]=o.name
(ROOT/'duplicate-check.json').write_text(json.dumps(duplicates,indent=2))
print('DUPLICATES',len(duplicates),duplicates[:20])
