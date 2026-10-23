import bpy
from pathlib import Path
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];body.modifiers[0].use_deform_preserve_volume=True
bpy.ops.wm.save_as_mainfile(filepath=str(P/'test-dual.blend'))
code=(P/'check_connections.py').read_text().replace("'somangi-eat.blend'","'test-dual.blend'");exec(compile(code,str(P/'check_connections.py'),'exec'))
