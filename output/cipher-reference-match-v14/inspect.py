import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root.parent/'cipher-roof-edge-v13'/'CipherSecurities-roof-edge.blend'))
rows=[]
for o in bpy.context.scene.objects:
    if o.name.startswith(('Grand_Window','Grand_Front_Window','Door_','Cipher_Logo')):
        rows.append({'name':o.name,'materials':[m.name for m in o.data.materials] if o.type in ('MESH','CURVE') else []})
(root/'source-parts.json').write_text(json.dumps(rows,indent=2))
print(json.dumps(rows[:35]))
