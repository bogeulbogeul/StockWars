import bpy,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene;scene.frame_set(136)
mixed=[v.index for v in body.data.vertices if sum(g.weight>1e-6 for g in v.groups)>1]
group=body.vertex_groups.new(name='ConnectionSmooth')
for i in mixed:
    entropy=1-sum(g.weight*g.weight for g in body.data.vertices[i].groups);t=min(1,entropy*2);weight=t*t*t*(10-15*t+6*t*t);group.add([i],weight,'REPLACE')
mod=body.modifiers.new('Concealed attachment correction','CORRECTIVE_SMOOTH');mod.vertex_group=group.name;mod.iterations=20;mod.factor=.5;mod.smooth_type='LENGTH_WEIGHTED';mod.rest_source='ORCO';mod.use_only_smooth=True
rig=bpy.data.objects['Somangi_WholeArmRig']
for frame in range(1,137):
    scene.frame_set(frame);angle=max((pb.matrix@pb.bone.matrix_local.inverted()).to_quaternion().angle for pb in rig.pose.bones);t=min(1,angle/.35);mod.factor=.7*t*t*(3-2*t);mod.keyframe_insert('factor',frame=frame)
scene.frame_set(136)
ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh();print('REST ERROR',max((a.co-b.co).length for a,b in zip(mesh.vertices,body.data.vertices)));ev.to_mesh_clear()
bpy.ops.wm.save_as_mainfile(filepath=str(P/'test-corrective.blend'))
code=(P/'check_connections.py').read_text().replace("'somangi-eat.blend'","'test-corrective.blend'");exec(compile(code,str(P/'check_connections.py'),'exec'))
