import bpy,json,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-walk.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_WholeArmRig'];report=[]
for frame in [1,5,9,13,17,21,25,29,31]:
 bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
 ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh();p=np.array([v.co[:] for v in mesh.vertices]);ev.to_mesh_clear()
 report.append(dict(frame=frame,height=float(np.ptp(p[:,2])),top=float(p[:,2].max()),root=list(rig.pose.bones['Body'].location),scales={b.name:list(b.scale) for b in rig.pose.bones}))
print(json.dumps(report))
(P/'height-before.json').write_text(json.dumps(report,indent=2))
