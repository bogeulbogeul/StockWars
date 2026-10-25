import bpy,json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-full-reference-v18'/'CipherSecurities-reference.blend'))
scene=bpy.context.scene
rows=[]
prefixes=('Wing_Foundation','Wing_Corner_Foot','Portico_Column_Plinth','Portico_Column_Capital',
 'Reference_Stepped','Reference_Continuous','Cipher_Logo_Navy','Clock_Face','Grand_Front_Window',
 'Grand_Window_Continuous','Door_Continuous','Reference_Door','Ref_Wing','Ref_Cream')
def project(p):
 v=world_to_camera_view(scene,scene.camera,p)
 return [v.x*1374,(1-v.y)*1145]
for o in scene.objects:
 if not o.name.startswith(prefixes):continue
 if 'Tile' in o.name or 'Roof' in o.name or 'Ridge' in o.name or 'Hip' in o.name:continue
 corners=[o.matrix_world@Vector(c) for c in o.bound_box]
 rows.append({'name':o.name,'min':[min(p[i] for p in corners) for i in range(3)],
  'max':[max(p[i] for p in corners) for i in range(3)],'screenCenter':project(sum(corners,Vector())/8)})
(ROOT/'objects.json').write_text(json.dumps(rows,indent=2))
print(json.dumps(rows,indent=2))
