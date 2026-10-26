import bpy,json,sys,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent;sys.path.insert(0,str(P))
from motion_utils import points
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-eat.blend'))
b=bpy.data.objects['Somangi_SmoothBody'];r=bpy.data.objects['Somangi_WholeArmRig'];raw=np.array([v.co[:] for v in b.data.vertices]);ids=json.loads((P/'arm-vertices.json').read_text());errors={n:0. for n in ids}
for n,ix in ids.items():
 g=b.vertex_groups[n].index
 assert all(len(b.data.vertices[i].groups)==1 and b.data.vertices[i].groups[0].group==g and b.data.vertices[i].groups[0].weight==1 for i in ix)
for k in range(271):
 f=1+k*.5;bpy.context.scene.frame_set(int(f),subframe=f-int(f));actual=points(b)
 for n,ix in ids.items():
  m=np.array(r.pose.bones[n].matrix@r.data.bones[n].matrix_local.inverted());expected=raw[ix]@m[:3,:3].T+m[:3,3]
  errors[n]=max(errors[n],float(np.max(np.abs(expected-actual[ix]))))
bpy.context.scene.frame_set(136);rest=float(np.max(np.abs(points(b)-raw)))
result=dict(samples=271,allArmVerticesRigidIncludingRoots=True,maximumRigidTransformError=errors,endRestError=rest)
(P/'rigidity.json').write_text(json.dumps(result,indent=2));print(result)
assert max(errors.values())<1e-5
