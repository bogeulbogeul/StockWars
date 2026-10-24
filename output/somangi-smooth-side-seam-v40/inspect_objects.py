import bpy,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent;bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'));bpy.context.scene.frame_set(50)
for ob in bpy.context.scene.objects:
 if ob.type!='MESH':continue
 ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();v=np.array([(ob.matrix_world@p.co)[:] for p in m.vertices]);ev.to_mesh_clear();print(ob.name,len(v),v.min(0),v.max(0),ob.hide_render)
