import bpy,json
from pathlib import Path
root=Path('C:/GitHub/StockWars/output')
for folder,file in [('somangi-bench-sit-v2','somangi-bench-sit.blend'),('somangi-walk-v4','somangi-walk.blend')]:
    bpy.ops.wm.open_mainfile(filepath=str(root/folder/file))
    rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
    print('RIG',folder,rig.name,'objects',[(o.name,o.type) for o in bpy.context.scene.objects])
    print('BONES',[(b.name,tuple(b.head_local),tuple(b.tail_local)) for b in rig.data.bones])
    for frame in [1,25]:
        bpy.context.scene.frame_set(frame)
        print('POSE',frame,[(b.name,tuple(b.location),tuple(b.rotation_euler),tuple(b.rotation_quaternion)) for b in rig.pose.bones])
