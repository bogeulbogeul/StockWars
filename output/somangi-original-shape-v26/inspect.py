import bpy,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-black-eyes-v1/somangi-black-eyes.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];r=bpy.data.objects['Somangi_OriginalRig']
r.animation_data_clear()
for p in r.pose.bones:p.matrix_basis.identity()
bpy.context.view_layer.update()
print('BODY',len(b.data.vertices),len(b.data.polygons),'KEYS',len(b.data.shape_keys.key_blocks) if b.data.shape_keys else 0)
print('GROUPS',[(g.name,g.index) for g in b.vertex_groups]);print('MODS',[(m.name,m.type) for m in b.modifiers])
for side in ['L','R']:
    idx=b.vertex_groups['Part.Arm.'+side].index
    ids=[v.index for v in b.data.vertices if any(g.group==idx for g in v.groups)]
    a=np.array([b.data.vertices[i].co[:] for i in ids]);print(side,len(ids),a.min(0),a.max(0),a.mean(0))
