import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'CipherSecurities-reference.blend'))
for o in bpy.context.scene.objects:
 if o.type=='MESH' and o.name.startswith(('Roof_','Central_Ridge','Wing_Ridge','Wing_Hip')):
  o.data.normals_split_custom_set([(0,0,0)]*len(o.data.loops))
  for p in o.data.polygons:p.use_smooth=False
scene=bpy.context.scene;scene.cycles.samples=8;scene.render.filepath=str(ROOT/'shading-check.png')
bpy.ops.render.render(write_still=True)
