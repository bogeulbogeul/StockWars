import bpy,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
for kind in ['bread','drink']:
    bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-eat-drink-shoulder-v2'/f'somangi-{kind}.blend'))
    body=bpy.data.objects['Somangi_SmoothBody'];rig=bpy.data.objects['Somangi_OriginalRig']
    ids={}
    for side in ['L','R']:
        b=rig.data.bones['Arm.'+side];direction=(b.tail_local-b.head_local).normalized()
        group=body.vertex_groups['Part.Arm.'+side].index
        ids[side]=[v.index for v in body.data.vertices if any(g.group==group for g in v.groups) and (v.co-b.head_local).dot(direction)>.30]
    for frame in [1,41]:
        bpy.context.scene.frame_set(frame);ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh()
        print(kind,frame)
        for side in ['L','R']:
            coords=np.array([tuple(m.vertices[i].co) for i in ids[side]])
            print(side,len(coords),'center',coords.mean(0),'min',coords.min(0),'max',coords.max(0))
        print('PROP',bpy.data.objects[kind+'_Prop'].location)
        ev.to_mesh_clear()
