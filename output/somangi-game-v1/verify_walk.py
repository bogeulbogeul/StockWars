import bpy,json,numpy as np
from pathlib import Path
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P/'somangi-walk.blend'))
body=bpy.data.objects['Somangi_SmoothBody'];scene=bpy.context.scene
raw=np.array([v.co[:] for v in body.data.vertices]);groups={g.name:g.index for g in body.vertex_groups}
arms={n:[v.index for v in body.data.vertices if any(g.group==groups[n] and g.weight>.999 for g in v.groups)] for n in ['Arm.L','Arm.R']}
feet=[];errors=[];heights=[];poses=[];torsoErrors=[];footErrors=[]
footIndices=[[v.index for v in body.data.vertices if v.co.z<-.78 and v.co.x*sign>0][::37] for sign in [1,-1]]
torso=[v.index for v in body.data.vertices if v.co.z>-.50 and v.co.z<.95 and abs(v.co.x)<.15][::71]
for f in range(1,32):
 scene.frame_set(f);bpy.context.view_layer.update();ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();p=np.array([v.co[:] for v in m.vertices]);ev.to_mesh_clear();feet.append(float(p[:,2].min()))
 heights.append(float(np.ptp(p[:,2])));poses.append(p)
 torsoErrors.append(float(abs(np.linalg.norm(p[torso]-p[torso[0]],axis=1)-np.linalg.norm(raw[torso]-raw[torso[0]],axis=1)).max()))
 for indices in footIndices:
  footErrors.append(float(abs(np.linalg.norm(p[indices]-p[indices[0]],axis=1)-np.linalg.norm(raw[indices]-raw[indices[0]],axis=1)).max()))
 for indices in arms.values():
  a=np.array(indices)[::101];ref=raw[a]-raw[a[0]];posed=p[a]-p[a[0]]
  errors.append(float(abs(np.linalg.norm(ref,axis=1)-np.linalg.norm(posed,axis=1)).max()))
report=dict(frames=31,footMin=min(feet),footMax=max(feet),maxArmLengthError=max(errors),restVerticesUnchanged=True)
report.update(heightMin=min(heights),heightMax=max(heights),maxTorsoLengthError=max(torsoErrors),loopVertexError=float(abs(poses[0]-poses[-1]).max()))
report['maxFootShapeError']=max(footErrors)
assert max(footErrors)<1e-5,report
assert max(torsoErrors)<1e-5,report
assert report['loopVertexError']<1e-5,report
assert max(heights)-min(heights)<.04,report
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'somangi-rear-junction-v43/somangi-eat.blend'))
original=np.array([v.co[:] for v in bpy.data.objects['Somangi_SmoothBody'].data.vertices])
report['restVerticesUnchanged']=bool(np.array_equal(original,raw));assert report['restVerticesUnchanged'];assert max(errors)<1e-5
(P/'walk-verification.json').write_text(json.dumps(report,indent=2));print(report)
