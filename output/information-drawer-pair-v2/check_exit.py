import bpy
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'anna-meshy-short-vest-v5'/'Anna-meshy-short-vest.blend'))
rig=bpy.data.objects['Somangi_Rig']
rig.animation_data.action=bpy.data.actions['Walk_InPlace']
for track in rig.animation_data.nla_tracks:track.mute=True
names=['Somangi_Body','Eating_Torso','Rigid_Arm.L','Rigid_Arm.R','Anna_PlumpLeaf','Anna_Vest']
widths=[]
for f in range(1,26):
    bpy.context.scene.frame_set(f)
    xs=[]
    for name in names:
        obj=bpy.data.objects[name].evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh=obj.to_mesh()
        xs.extend((obj.matrix_world@v.co).x*.65 for v in mesh.vertices)
        obj.to_mesh_clear()
    widths.append(max(xs)-min(xs))
report={'scale':.65,'current_chair_cabinet_gap':.455,
        'walk_width_min':min(widths),'walk_width_max':max(widths),
        'fits_straight_through_gap':max(widths)<.455,
        'method':'All visible meshes projected width over 25 walk frames; provisional scene scale'}
(ROOT/'exit-clearance.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
