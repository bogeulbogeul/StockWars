import bpy,json
from pathlib import Path
P=Path(__file__).resolve().parent;source=P.parent/'somangi-story-expressions-v4'
bpy.ops.wm.open_mainfile(filepath=str(source/'somangi-expressions.blend'))
data=json.loads((source/'manifest.json').read_text(encoding='utf-8'))
removed=[entry for entry in data['expressions'] if entry['id'] in {'sad','proud'}]
for entry in removed:
 for name in entry['materials']:
  material=bpy.data.materials.get(name)
  if material:bpy.data.materials.remove(material,do_unlink=True)
 image=bpy.data.images.get('Expression_'+entry['id'])
 if image:bpy.data.images.remove(image,do_unlink=True)
assert not any(m.name.startswith(('Expression_sad_','Expression_proud_')) for m in bpy.data.materials)
bpy.ops.wm.save_as_mainfile(filepath=str(P/'somangi-expressions.blend'))
print('REMOVED sad/proud; 14 expressions retained')
